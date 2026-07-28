#!/usr/bin/env node
/**
 * seed-real-data.js — Populates the database with REAL public records.
 * Sources: SEC EDGAR, USASpending.gov, Chicago permits, NYC permits.
 * Zero synthetic data. Every record comes from a real public API.
 */
const path = require('path');
const fs = require('fs');
try { const dns = require('node:dns'); dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
const mongoose = require('mongoose');

const resolveEnvPath = () => {
  const candidates = [
    path.join(process.cwd(), '.env.local'),
    path.join(__dirname, '../../.env.local')
  ];
  for (const c of candidates) { if (fs.existsSync(c)) return c; }
  return null;
};
const envPath = resolveEnvPath();
if (envPath) require('dotenv').config({ path: envPath });
else require('dotenv').config();

async function main() {
  const mongoURI = (process.env.MONGODB_URI || '').replace(/^["']|["']$/g, '');
  if (!mongoURI) { console.error('No MONGODB_URI'); process.exit(1); }

  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB.');

  // Register the DataRecord model (same schema as data-portal.js)
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
    status: { type: String, enum: ['raw', 'processing', 'processed', 'published', 'failed', 'sent-to-outreach', 'reserved', 'sold'], default: 'raw' },
    failureReason: { type: String },
    publishedUrl: { type: String },
    publishedAt: { type: Date },
    linkedLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    processedAt: { type: Date },
    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reservedUntil: { type: Date, default: null },
    soldAt: { type: Date, default: null }
  }, { timestamps: true });

  DataRecordSchema.index({ userId: 1, sourceType: 1, sourceId: 1 }, { unique: true });
  DataRecordSchema.index({ userId: 1, status: 1 });
  DataRecordSchema.index({
    'structured.companyName': 'text',
    'structured.projectType': 'text',
    'structured.executiveSummary': 'text',
    'structured.location.city': 'text'
  });
  DataRecordSchema.index({ reservedUntil: 1 }, { sparse: true });
  DataRecordSchema.index({ soldAt: 1 }, { sparse: true });

  try { mongoose.model('DataRecord'); } catch (e) { mongoose.model('DataRecord', DataRecordSchema); }

  const dataFetcher = require('../services/data-fetcher.service');

  console.log('\n=== Phase 1: SEC EDGAR (50 records) ===');
  const edgarResults = await dataFetcher.fetchAndUpsert('edgar', '', 50, 0);
  console.log(`  -> Inserted ${edgarResults.length} EDGAR records`);

  // Small delay between sources to be polite
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n=== Phase 2: USASpending.gov (50 records) ===');
  const usaResults = await dataFetcher.fetchAndUpsert('usaspending', '', 50, 1);
  console.log(`  -> Inserted ${usaResults.length} USASpending records`);

  await new Promise(r => setTimeout(r, 1000));

  console.log('\n=== Phase 3: Chicago Building Permits (50 records) ===');
  const chicagoResults = await dataFetcher.fetchAndUpsert('chicago', '', 50, 0);
  console.log(`  -> Inserted ${chicagoResults.length} Chicago records`);

  await new Promise(r => setTimeout(r, 1000));

  console.log('\n=== Phase 4: NYC DOB Permits (50 records) ===');
  const nycResults = await dataFetcher.fetchAndUpsert('nyc', '', 50, 0);
  console.log(`  -> Inserted ${nycResults.length} NYC records`);

  // Summary
  const total = edgarResults.length + usaResults.length + chicagoResults.length + nycResults.length;
  const DataRecord = mongoose.model('DataRecord');
  const dbTotal = await DataRecord.countDocuments();
  const sources = await DataRecord.aggregate([
    { $group: { _id: '$sourceType', count: { $sum: 1 } } }
  ]);

  console.log('\n========================================');
  console.log(`Total new records inserted: ${total}`);
  console.log(`Total records in DB: ${dbTotal}`);
  console.log('By source:');
  sources.forEach(s => console.log(`  ${s._id}: ${s.count}`));
  console.log('========================================\n');

  // Verify a sample record
  const sample = await DataRecord.findOne().lean();
  if (sample) {
    console.log('Sample record:');
    console.log(`  Company: ${sample.structured?.companyName}`);
    console.log(`  Type: ${sample.structured?.projectType}`);
    console.log(`  Location: ${sample.structured?.location?.city}, ${sample.structured?.location?.state}`);
    console.log(`  Budget: $${sample.structured?.estimatedBudget}`);
    console.log(`  Source: ${sample.sourceType}`);
    console.log(`  Summary: ${(sample.structured?.executiveSummary || '').substring(0, 100)}...`);
  }

  await mongoose.disconnect();
  console.log('\nDone! Database seeded with 100% real public records.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
