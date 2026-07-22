/**
 * Data Portal — Public + Authenticated API Routes (Phoenix Business / phoenixwebsites.ai)
 * 
 * These routes power the public-facing data search portal at phoenixwebsites.ai/data
 * Connects to the same MongoDB as the Cold Email pipeline (shared cluster).
 * Each record has a unique shareable URL for email-to-purchase flow.
 * 
 * Public endpoints: search, record preview, stats, SEO
 * Authenticated endpoints: cart CRUD, saved searches, purchases
 * 
 * Rate-limited to prevent abuse on public endpoints.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const DataPurchase = require('../models/DataPurchase');

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

// --- Auth guard middleware ---
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Login required.', authRequired: true });
  }
  next();
};

// ==================================================================
//                     PUBLIC ENDPOINTS
// ==================================================================

/**
 * GET /api/data-portal/search
 * Public search — returns preview cards with REDACTED contact info
 */
router.get('/search', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const isInitialLoad = !req.query.q && !req.query.city && !req.query.state && !req.query.source && !req.query.projectType;

    const query = { status: { $ne: 'failed' } };

    if (req.query.q) {
      query.$or = [
        { 'structured.companyName': new RegExp(req.query.q, 'i') },
        { 'structured.projectType': new RegExp(req.query.q, 'i') },
        { 'structured.executiveSummary': new RegExp(req.query.q, 'i') },
        { 'structured.location.city': new RegExp(req.query.q, 'i') },
        { 'structured.tags': new RegExp(req.query.q, 'i') }
      ];
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

    let records = [];
    let total = 0;
    let allMatchingIds = [];

    if (isInitialLoad) {
      // Random sampling on initial load directly from real MongoDB collection
      records = await DataRecord.aggregate([
        { $match: query },
        { $sample: { size: limit } },
        { $project: { 'structured.companyName': 1, 'structured.projectType': 1, 'structured.estimatedBudget': 1, 'structured.location': 1, 'structured.tags': 1, 'structured.executiveSummary': 1, 'structured.contactInfo': 1, sourceType: 1, createdAt: 1 } }
      ]);
      total = await DataRecord.countDocuments(query);
      allMatchingIds = records.map(r => r._id);
    } else {
      [records, total, allMatchingIds] = await Promise.all([
        DataRecord.find(query)
          .select('structured.companyName structured.projectType structured.estimatedBudget structured.location structured.tags structured.executiveSummary structured.contactInfo sourceType createdAt')
          .sort('-createdAt')
          .skip(skip)
          .limit(limit)
          .lean(),
        DataRecord.countDocuments(query),
        DataRecord.find(query)
          .select('_id')
          .sort('-createdAt')
          .limit(100)
          .lean()
      ]);
      allMatchingIds = allMatchingIds.map(r => r._id);
    }

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
      portalUrl: `/data/${r._id}`
    }));

    res.json({
      records: previews,
      blockRecordIds: allMatchingIds,
      blockSize: allMatchingIds.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (err) {
    console.error('[DataPortal] Search error:', err.message);
    res.status(500).json({ message: 'Search failed.' });
  }
});

/**
 * GET /api/data-portal/record/:id
 * Single record preview — public, but contact info gated behind purchase
 */
router.get('/record/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid record ID.' });
    }

    const record = await DataRecord.findOne({ 
      _id: req.params.id, 
      status: { $ne: 'failed' } 
    }).select('-raw').lean();

    if (!record) return res.status(404).json({ message: 'Record not found.' });

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

    const crypto = require('crypto');
    const expectedToken = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'phoenix-data-secret')
      .update(req.params.id)
      .digest('hex')
      .substring(0, 24);

    if (token !== expectedToken) {
      return res.status(403).json({ message: 'Invalid or expired access token.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid record ID.' });
    }

    const record = await DataRecord.findOne({ 
      _id: req.params.id, 
      status: { $ne: 'failed' } 
    }).select('-raw').lean();

    if (!record) return res.status(404).json({ message: 'Record not found.' });

    res.json(record);
  } catch (err) {
    console.error('[DataPortal] Full record error:', err.message);
    res.status(500).json({ message: 'Failed to fetch record.' });
  }
});

/**
 * GET /api/data-portal/record/:id/seo
 */
router.get('/record/:id/seo', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({});
    }

    const record = await DataRecord.findOne({
      _id: req.params.id,
      status: { $ne: 'failed' }
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
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalRecords, totalCities, recentRecords] = await Promise.all([
      DataRecord.countDocuments({ status: { $ne: 'failed' } }),
      DataRecord.distinct('structured.location.city', { status: { $ne: 'failed' } }),
      DataRecord.countDocuments({ 
        status: { $ne: 'failed' },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    const sourceCounts = await DataRecord.aggregate([
      { $match: { status: { $ne: 'failed' } } },
      { $group: { _id: '$sourceType', count: { $sum: 1 } } }
    ]);

    res.json({
      totalRecords,
      totalCities: totalCities.length,
      recentRecords,
      sources: sourceCounts.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {})
    });
  } catch (err) {
    console.error('[DataPortal] Stats error:', err.message);
    res.status(500).json({ message: 'Failed to fetch stats.' });
  }
});

// ==================================================================


// ==================================================================
//              AUTHENTICATED ENDPOINTS (Cart, Searches, Purchases)
// ==================================================================

// ---- CART ----

/**
 * GET /api/data-portal/cart
 */
router.get('/cart', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('cart').lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ 
      cart: user.cart || [],
      totalItems: (user.cart || []).length,
      totalPrice: (user.cart || []).length * 149
    });
  } catch (err) {
    console.error('[DataPortal] Cart fetch error:', err.message);
    res.status(500).json({ message: 'Failed to fetch cart.' });
  }
});

/**
 * POST /api/data-portal/cart/add
 * Body: { recordIds, searchQuery, filters: { city, state, source }, blockLabel }
 */
router.post('/cart/add', requireAuth, async (req, res) => {
  try {
    const { recordIds, searchQuery, filters, blockLabel } = req.body;

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({ message: 'No records selected for this block.' });
    }

    const cappedIds = recordIds.slice(0, 100);

    const cartItem = {
      recordIds: cappedIds,
      searchQuery: searchQuery || '',
      filters: {
        city: filters?.city || '',
        state: filters?.state || '',
        source: filters?.source || ''
      },
      blockLabel: blockLabel || `${searchQuery || 'All records'}${filters?.city ? ` in ${filters.city}` : ''}${filters?.state ? `, ${filters.state}` : ''}`,
      totalRecords: cappedIds.length,
      addedAt: new Date()
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { cart: cartItem } },
      { new: true, select: 'cart' }
    );

    res.json({ 
      message: `Block added to cart (${cappedIds.length} records).`,
      cart: user.cart,
      totalItems: user.cart.length,
      totalPrice: user.cart.length * 149
    });
  } catch (err) {
    console.error('[DataPortal] Cart add error:', err.message);
    res.status(500).json({ message: 'Failed to add to cart.' });
  }
});

/**
 * DELETE /api/data-portal/cart/:index
 */
router.delete('/cart/:index', requireAuth, async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const user = await User.findById(req.user._id).select('cart');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (index < 0 || index >= (user.cart || []).length) {
      return res.status(400).json({ message: 'Invalid cart item index.' });
    }

    user.cart.splice(index, 1);
    await user.save();

    res.json({ 
      message: 'Item removed from cart.',
      cart: user.cart,
      totalItems: user.cart.length,
      totalPrice: user.cart.length * 149
    });
  } catch (err) {
    console.error('[DataPortal] Cart remove error:', err.message);
    res.status(500).json({ message: 'Failed to remove from cart.' });
  }
});

/**
 * DELETE /api/data-portal/cart — Clear entire cart
 */
router.delete('/cart', requireAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
    res.json({ message: 'Cart cleared.', cart: [], totalItems: 0, totalPrice: 0 });
  } catch (err) {
    console.error('[DataPortal] Cart clear error:', err.message);
    res.status(500).json({ message: 'Failed to clear cart.' });
  }
});

// ---- SAVED SEARCHES ----

/**
 * POST /api/data-portal/save-search
 */
router.post('/save-search', requireAuth, async (req, res) => {
  try {
    const { query, city, state, source } = req.body;

    const label = [
      query || 'All records',
      city ? `in ${city}` : '',
      state ? `, ${state}` : '',
      source ? `(${source})` : ''
    ].filter(Boolean).join(' ');

    const searchItem = {
      query: query || '',
      city: city || '',
      state: state || '',
      source: source || '',
      label,
      createdAt: new Date()
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { savedSearches: { $each: [searchItem], $slice: -20 } } },
      { new: true, select: 'savedSearches' }
    );

    res.json({ 
      message: 'Search saved!',
      savedSearches: user.savedSearches
    });
  } catch (err) {
    console.error('[DataPortal] Save search error:', err.message);
    res.status(500).json({ message: 'Failed to save search.' });
  }
});

/**
 * GET /api/data-portal/saved-searches
 */
router.get('/saved-searches', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedSearches').lean();
    res.json({ savedSearches: (user?.savedSearches || []).reverse() });
  } catch (err) {
    console.error('[DataPortal] Saved searches fetch error:', err.message);
    res.status(500).json({ message: 'Failed to fetch saved searches.' });
  }
});

/**
 * DELETE /api/data-portal/saved-searches/:index
 */
router.delete('/saved-searches/:index', requireAuth, async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const user = await User.findById(req.user._id).select('savedSearches');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const realIndex = (user.savedSearches || []).length - 1 - index;
    if (realIndex < 0 || realIndex >= (user.savedSearches || []).length) {
      return res.status(400).json({ message: 'Invalid search index.' });
    }

    user.savedSearches.splice(realIndex, 1);
    await user.save();

    res.json({ 
      message: 'Saved search removed.',
      savedSearches: (user.savedSearches || []).reverse()
    });
  } catch (err) {
    console.error('[DataPortal] Delete saved search error:', err.message);
    res.status(500).json({ message: 'Failed to delete saved search.' });
  }
});

// ---- PURCHASES (Library) ----

/**
 * GET /api/data-portal/purchases
 */
router.get('/purchases', requireAuth, async (req, res) => {
  try {
    const purchases = await DataPurchase.find({ 
      userId: req.user._id, 
      status: { $in: ['paid', 'delivered'] } 
    })
      .sort('-paidAt')
      .lean();

    res.json({ purchases });
  } catch (err) {
    console.error('[DataPortal] Purchases fetch error:', err.message);
    res.status(500).json({ message: 'Failed to fetch purchases.' });
  }
});

/**
 * GET /api/data-portal/purchases/:id
 * Full records with contact info for a specific purchase
 */
router.get('/purchases/:id', requireAuth, async (req, res) => {
  try {
    const purchase = await DataPurchase.findOne({ 
      _id: req.params.id, 
      userId: req.user._id,
      status: { $in: ['paid', 'delivered'] }
    }).lean();

    if (!purchase) return res.status(404).json({ message: 'Purchase not found.' });

    const records = await DataRecord.find({ 
      _id: { $in: purchase.recordIds } 
    }).select('-raw').lean();

    res.json({ 
      purchase,
      records: records.map(r => ({
        _id: r._id,
        companyName: r.structured?.companyName || 'Unknown',
        projectType: r.structured?.projectType || 'N/A',
        estimatedBudget: r.structured?.estimatedBudget || 0,
        location: r.structured?.location || {},
        contactInfo: r.structured?.contactInfo || {},
        executiveSummary: r.structured?.executiveSummary || '',
        tags: r.structured?.tags || [],
        sourceType: r.sourceType,
        date: r.createdAt
      }))
    });
  } catch (err) {
    console.error('[DataPortal] Purchase detail error:', err.message);
    res.status(500).json({ message: 'Failed to fetch purchase details.' });
  }
});

module.exports = router;
