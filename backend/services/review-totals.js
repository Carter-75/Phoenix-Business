/**
 * Review Totals Helper
 * Rating totals and averages on phoenixwebsites.ai EXCLUDE reviews whose
 * project was archived under the Client Communication Policy. Archived-project
 * reviews stay public and searchable in the list; they simply no longer count
 * toward the headline rating numbers.
 */

// Mongo filter selecting only the reviews that count toward rating totals.
const RATING_TOTALS_FILTER = { policyArchived: { $ne: true } };

/**
 * Summarize rating totals from an array of review-like objects.
 * Any review with policyArchived === true is excluded.
 * @param {Array<{rating?: number, policyArchived?: boolean}>} reviews
 * @returns {{ count: number, total: number, average: number, excludedArchived: number }}
 */
function summarizeRatings(reviews) {
  const list = Array.isArray(reviews) ? reviews : [];
  let count = 0;
  let total = 0;
  let excludedArchived = 0;

  for (const review of list) {
    if (review && review.policyArchived === true) {
      excludedArchived++;
      continue;
    }
    const rating = review && typeof review.rating === 'number' ? review.rating : 0;
    count++;
    total += rating;
  }

  return {
    count,
    total,
    average: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
    excludedArchived
  };
}

module.exports = {
  RATING_TOTALS_FILTER,
  summarizeRatings
};
