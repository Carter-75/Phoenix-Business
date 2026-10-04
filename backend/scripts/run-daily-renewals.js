#!/usr/bin/env node
/**
 * Standalone Daily Renewals Runner
 * Can be run via crontab, Docker cron, Render worker, or local CLI:
 *   node backend/scripts/run-daily-renewals.js [--date=YYYY-MM-DD] [--dry-run]
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { processDailyRenewals } = require('../services/renewal-scheduler.service');

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const dateArg = args.find(a => a.startsWith('--date='));
  const referenceDate = dateArg ? new Date(dateArg.split('=')[1]) : new Date();

  console.log(`[RUNNER] Starting daily renewal scheduler for reference date: ${referenceDate.toISOString()} (dryRun: ${dryRun})`);

  if (!process.env.MONGODB_URI) {
    console.error('[RUNNER] MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[RUNNER] Connected to MongoDB.');

    const summary = await processDailyRenewals({ referenceDate, dryRun });
    console.log('[RUNNER] Renewal execution completed:', JSON.stringify(summary, null, 2));

    await mongoose.disconnect();
    console.log('[RUNNER] Disconnected from MongoDB. Exiting cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('[RUNNER] Fatal execution error:', err);
    process.exit(1);
  }
}

run();
