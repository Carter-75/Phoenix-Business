/**
 * Data Portal — Public API Routes (Phoenix Business / phoenixwebsites.ai)
 * 
 * These routes power the public-facing data search portal at phoenixwebsites.ai/data
 * Connects to the same MongoDB as the Cold Email pipeline (shared cluster).
 * Each record has a unique shareable URL for email-to-purchase flow.
 * 
 * Rate-limited to prevent abuse on public endpoints.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// --- DataRecord Schema (mirrors the Cold Email schema, same MongoDB collection) ---
let DataRecord;
try {
  DataRecord = mongoose.model('DataRecord');
} catch (e) {
  const DataRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sourceType: { type: String, enum: ['building-permits', 'gov-contracts', 'sec-filings'] },
    sourceId: { type: String },
    sourceUrl: { type: String },
    raw: { type: mongoose.Schema.Types.Mixed },
    structured: {
      companyName: { type: String, default: '' },
      estimatedBudget: { type: Number, default: 0 },
      projectType: { type: String, default: '' },
      location: {
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zip: { type: String, default: '' },
        fullAddress: { type: String, default: '' }
      },
      contactInfo: {
        name: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' }
      },
      executiveSummary: { type: String, default: '' },
      tags: [String]
    },
    status: { type: String, enum: ['raw', 'processing', 'processed', 'published', 'failed', 'sent-to-outreach'], default: 'raw' },
    failureReason: { type: String },
    publishedUrl: { type: String },
    publishedAt: { type: Date },
    linkedLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    processedAt: { type: Date }
  }, { timestamps: true });

  DataRecordSchema.index({ userId: 1, sourceType: 1, sourceId: 1 }, { unique: true });
  DataRecordSchema.index({ userId: 1, status: 1 });
  DataRecordSchema.index({ 
    'structured.companyName': 'text', 
    'structured.projectType': 'text', 
    'structured.executiveSummary': 'text',
    'structured.location.city': 'text'
  });

  DataRecord = mongoose.model('DataRecord', DataRecordSchema);
}

// Simple in-memory rate limiter for public endpoints
const rateLimiter = (() => {
  const hits = new Map();
  const WINDOW_MS = 60 * 1000;
  const MAX_HITS = 30;

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const record = hits.get(ip);

    if (!record || now - record.windowStart > WINDOW_MS) {
      hits.set(ip, { windowStart: now, count: 1 });
      return next();
    }

    record.count++;
    if (record.count > MAX_HITS) {
      return res.status(429).json({ message: 'Rate limit exceeded. Please wait a moment.' });
    }
    next();
  };
})();

router.use(rateLimiter);

/**
 * GET /api/data-portal/search
 * Public search — returns preview cards with REDACTED contact info
 */
router.get('/search', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query = { status: { $in: ['processed', 'published'] } };

    if (req.query.q) {
      query.$text = { $search: req.query.q };
    }
    if (req.query.city) {
      query['structured.location.city'] = new RegExp(req.query.city, 'i');
    }
    if (req.query.state) {
      query['structured.location.state'] = new RegExp(req.query.state, 'i');
    }
    if (req.query.source) {
      query.sourceType = req.query.source;
    }
    if (req.query.projectType) {
      query['structured.projectType'] = new RegExp(req.query.projectType, 'i');
    }

    const [records, total] = await Promise.all([
      DataRecord.find(query)
        .select('structured.companyName structured.projectType structured.estimatedBudget structured.location structured.tags structured.executiveSummary sourceType createdAt')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      DataRecord.countDocuments(query)
    ]);

    const previews = records.map(r => ({
      _id: r._id,
      companyName: r.structured?.companyName || 'Unknown',
      projectType: r.structured?.projectType || 'N/A',
      estimatedBudget: r.structured?.estimatedBudget || 0,
      city: r.structured?.location?.city || '',
      state: r.structured?.location?.state || '',
      tags: r.structured?.tags || [],
      summary: r.structured?.executiveSummary 
        ? r.structured.executiveSummary.substring(0, 120) + '...'
        : 'AI-enriched record available',
      sourceType: r.sourceType,
      date: r.createdAt,
      hasContact: !!(r.structured?.contactInfo?.email),
      hasPhone: !!(r.structured?.contactInfo?.phone),
      // Unique shareable URL
      portalUrl: `/data/${r._id}`
    }));

    res.json({
      records: previews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('[DataPortal] Search error:', err.message);
    res.status(500).json({ message: 'Search failed.' });
  }
});

/**
 * GET /api/data-portal/record/:id
 * Single record preview — public, but contact info gated behind purchase
 * This is the endpoint that the emailed link points to
 */
router.get('/record/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid record ID.' });
    }

    const record = await DataRecord.findOne({ 
      _id: req.params.id, 
      status: { $in: ['processed', 'published'] } 
    }).select('-raw').lean();

    if (!record) return res.status(404).json({ message: 'Record not found.' });

    // Return public preview (redacted contact info)
    const preview = {
      _id: record._id,
      companyName: record.structured?.companyName || 'Unknown',
      projectType: record.structured?.projectType || 'N/A',
      estimatedBudget: record.structured?.estimatedBudget || 0,
      location: record.structured?.location || {},
      executiveSummary: record.structured?.executiveSummary || '',
      tags: record.structured?.tags || [],
      sourceType: record.sourceType,
      date: record.createdAt,
      // Redacted — purchaser gets full access
      hasContact: !!(record.structured?.contactInfo?.email),
      hasPhone: !!(record.structured?.contactInfo?.phone),
      contactRedacted: true
    };

    res.json(preview);
  } catch (err) {
    console.error('[DataPortal] Record detail error:', err.message);
    res.status(500).json({ message: 'Failed to fetch record.' });
  }
});

/**
 * GET /api/data-portal/record/:id/full
 * Full record with contact info — requires a valid purchase token
 * Token is generated after Stripe payment and sent via email
 */
router.get('/record/:id/full', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(401).json({ 
        message: 'Purchase required to view full record details.',
        upgradeRequired: true 
      });
    }

    // Verify purchase token (simple HMAC check)
    const crypto = require('crypto');
    const expectedToken = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'phoenix-data-secret')
      .update(req.params.id)
      .digest('hex')
      .substring(0, 24);

    if (token !== expectedToken) {
      return res.status(403).json({ message: 'Invalid or expired access token.' });
    }

    const record = await DataRecord.findOne({ 
      _id: req.params.id, 
      status: { $in: ['processed', 'published'] } 
    }).select('-raw').lean();

    if (!record) return res.status(404).json({ message: 'Record not found.' });

    // Full record with contact info
    res.json(record);
  } catch (err) {
    console.error('[DataPortal] Full record error:', err.message);
    res.status(500).json({ message: 'Failed to fetch record.' });
  }
});

/**
 * GET /api/data-portal/record/:id/seo
 * JSON-LD structured data for search engine indexing
 */
router.get('/record/:id/seo', async (req, res) => {
  try {
    const record = await DataRecord.findOne({
      _id: req.params.id,
      status: { $in: ['processed', 'published'] }
    }).select('structured sourceType createdAt').lean();

    if (!record) return res.status(404).json({});

    const s = record.structured || {};
    const loc = s.location || {};

    res.json({
      '@context': 'https://schema.org',
      '@type': 'GovernmentService',
      name: `${s.projectType || 'Project'} — ${s.companyName || 'Unknown'}`,
      description: s.executiveSummary || '',
      areaServed: { '@type': 'Place', name: `${loc.city || ''}, ${loc.state || ''}` },
      provider: { '@type': 'Organization', name: s.companyName || 'Unknown' },
      datePublished: record.createdAt,
      keywords: s.tags?.join(', ') || ''
    });
  } catch (err) {
    res.status(500).json({});
  }
});

/**
 * GET /api/data-portal/stats
 * Aggregate stats for the portal landing page
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalRecords, totalCities, recentRecords] = await Promise.all([
      DataRecord.countDocuments({ status: { $in: ['processed', 'published'] } }),
      DataRecord.distinct('structured.location.city', { status: { $in: ['processed', 'published'] } }),
      DataRecord.countDocuments({ 
        status: { $in: ['processed', 'published'] },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    const sourceCounts = await DataRecord.aggregate([
      { $match: { status: { $in: ['processed', 'published'] } } },
      { $group: { _id: '$sourceType', count: { $sum: 1 } } }
    ]);

    res.json({
      totalRecords,
      totalCities: totalCities.length,
      recentRecords,
      sources: sourceCounts.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {})
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats.' });
  }
});

module.exports = router;
