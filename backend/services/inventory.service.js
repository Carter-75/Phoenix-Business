/**
 * Inventory Service — Manages soft-max limits, pruning, and reservation cleanup
 * 
 * Rules:
 * - Soft max = min(currentCount * 5, 10_000), floor of 400
 * - Hard ceiling: 10,000 records
 * - When exceeding soft max on search, increase by +50 (capped at 10,000)
 * - Protected records (in cart, saved list, or reserved) are never pruned
 * - Expired reservations are cleaned atomically
 */

const mongoose = require('mongoose');
const User = require('../models/user');

// Persistent soft-max override (starts null, set when search forces growth)
let softMaxOverride = null;

function getDataRecordModel() {
  try { return mongoose.model('DataRecord'); } catch (e) { return null; }
}

/**
 * Get current soft max.
 * Default: min(currentCount * 5, 10000), floor of 400
 * If softMaxOverride was set by search overflow, use whichever is larger.
 */
async function getSoftMax() {
  const DataRecord = getDataRecordModel();
  if (!DataRecord) return 400;

  const currentCount = await DataRecord.countDocuments({ soldAt: null });
  const calculated = Math.max(400, Math.min(currentCount * 5, 10000));
  
  if (softMaxOverride !== null) {
    return Math.min(Math.max(calculated, softMaxOverride), 10000);
  }
  return calculated;
}

/**
 * Increase soft max by +50 (search overflow).
 * Capped at 10,000.
 */
function growSoftMax() {
  const current = softMaxOverride || 400;
  softMaxOverride = Math.min(current + 50, 10000);
  console.log(`[Inventory] Soft max grown to ${softMaxOverride}`);
  return softMaxOverride;
}

/**
 * Get all protected record IDs (must never be pruned).
 * Protected = in any user's cart OR saved search results OR currently reserved.
 */
async function getProtectedIds() {
  const DataRecord = getDataRecordModel();
  const protectedIds = new Set();

  // 1. Records in user carts — PERMANENT GUARANTEE: records in any user's
  //    cart are NEVER deleted by pruning. This is the primary data protection
  //    mechanism. Service-type cart items have no recordIds and are naturally skipped.
  try {
    const usersWithCarts = await User.find(
      { 'cart.0': { $exists: true } },
      { 'cart.recordIds': 1 }
    ).lean();

    for (const user of usersWithCarts) {
      for (const block of (user.cart || [])) {
        for (const id of (block.recordIds || [])) {
          protectedIds.add(id.toString());
        }
      }
    }
  } catch (err) {
    console.error('[Inventory] Error fetching cart IDs:', err.message);
  }

  // 2. Currently reserved records
  if (DataRecord) {
    try {
      const reserved = await DataRecord.find(
        { reservedBy: { $ne: null }, reservedUntil: { $gt: new Date() } },
        { _id: 1 }
      ).lean();

      for (const r of reserved) {
        protectedIds.add(r._id.toString());
      }
    } catch (err) {
      console.error('[Inventory] Error fetching reserved IDs:', err.message);
    }
  }

  return protectedIds;
}

/**
 * Prune unprotected records to make room for new ones.
 * If not enough unprotected records can be pruned, grow the soft max.
 * 
 * @param {number} newRecordCount - How many new records are about to be inserted
 * @returns {number} Number of records deleted
 */
async function prune(newRecordCount = 0) {
  const DataRecord = getDataRecordModel();
  if (!DataRecord) return 0;

  const currentCount = await DataRecord.countDocuments({ soldAt: null });
  const softMax = await getSoftMax();

  const overBy = (currentCount + newRecordCount) - softMax;
  if (overBy <= 0) return 0; // Under limit, no pruning needed

  console.log(`[Inventory] Over soft max by ${overBy}. Current: ${currentCount}, SoftMax: ${softMax}, New: ${newRecordCount}`);

  const protectedIds = await getProtectedIds();
  const protectedObjectIds = [...protectedIds].map(id => {
    try { return new mongoose.Types.ObjectId(id); } catch (e) { return null; }
  }).filter(Boolean);

  // Find unprotected, unsold records, oldest first
  const candidates = await DataRecord.find({
    _id: { $nin: protectedObjectIds },
    soldAt: null,
    reservedBy: null,
    status: { $nin: ['reserved', 'sold'] }
  })
    .sort({ createdAt: 1 })
    .limit(overBy)
    .select({ _id: 1 })
    .lean();

  if (candidates.length < overBy) {
    // Not enough unprotected records — grow soft max instead
    const shortfall = overBy - candidates.length;
    console.log(`[Inventory] Only ${candidates.length} pruneable (need ${overBy}). Growing soft max by ${Math.ceil(shortfall / 50) * 50}.`);
    for (let i = 0; i < Math.ceil(shortfall / 50); i++) {
      growSoftMax();
    }
  }

  if (candidates.length === 0) return 0;

  const deleteIds = candidates.map(c => c._id);
  const result = await DataRecord.deleteMany({ _id: { $in: deleteIds } });
  console.log(`[Inventory] Pruned ${result.deletedCount} records.`);
  return result.deletedCount;
}

/**
 * Clean expired reservations atomically.
 * Any record with reservedUntil in the past gets its reservation cleared.
 */
async function cleanExpiredReservations() {
  const DataRecord = getDataRecordModel();
  if (!DataRecord) return 0;

  const result = await DataRecord.updateMany(
    {
      reservedUntil: { $lt: new Date() },
      reservedBy: { $ne: null }
    },
    {
      $set: { reservedBy: null, reservedUntil: null, status: 'processed' }
    }
  );

  if (result.modifiedCount > 0) {
    console.log(`[Inventory] Cleaned ${result.modifiedCount} expired reservations.`);
  }
  return result.modifiedCount;
}

/**
 * Get inventory stats for monitoring.
 */
async function getStats() {
  const DataRecord = getDataRecordModel();
  if (!DataRecord) return { total: 0, softMax: 400, reserved: 0, sold: 0 };

  const [total, reserved, sold] = await Promise.all([
    DataRecord.countDocuments({ soldAt: null }),
    DataRecord.countDocuments({ reservedBy: { $ne: null }, reservedUntil: { $gt: new Date() } }),
    DataRecord.countDocuments({ soldAt: { $ne: null } })
  ]);

  return {
    total,
    softMax: await getSoftMax(),
    reserved,
    sold,
    softMaxOverride
  };
}

module.exports = {
  getSoftMax,
  growSoftMax,
  getProtectedIds,
  prune,
  cleanExpiredReservations,
  getStats
};
