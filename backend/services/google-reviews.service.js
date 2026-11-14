/**
 * Google reviews integration (read-only mirror).
 *
 * Google does not allow any third party to post, edit, or delete reviews on a
 * business profile, so true two-way sync does not exist. What this service
 * does instead:
 *   1. Pulls the profile's aggregate rating and most recent reviews from the
 *      Places API (New) into a local cache, so the website reviews page can
 *      show one merged wall of website + Google reviews.
 *   2. Exposes the official Google review link everywhere the site asks for a
 *      review, so a client who rates on the website can repeat it on Google
 *      in one tap (and the merge then de-duplicates the pair).
 *
 * Configuration (all public values except the API key):
 *   GOOGLE_PLACES_API_KEY  secret, enables the data feed
 *   GOOGLE_PLACE_ID        ChIJ place id of the business profile
 *   GOOGLE_REVIEW_URL      official "write a review" link (g.page/r/...)
 */
const GoogleReviewCache = require('../models/GoogleReviewCache');

const REVIEW_URL = process.env.GOOGLE_REVIEW_URL || 'https://g.page/r/CTqmpCl2k6BSEAI/review';
const PLACE_ID = process.env.GOOGLE_PLACE_ID || '';
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

const STALE_MS = 24 * 60 * 60 * 1000; // refresh the cache at most once a day
let refreshInFlight = null;

function isConfigured() {
  return Boolean(API_KEY && PLACE_ID);
}

function getReviewUrl() {
  return REVIEW_URL;
}

/** Cached Google aggregate + reviews, or null when no data is cached yet. */
async function getCached() {
  try {
    const doc = await GoogleReviewCache.findOne({ key: 'google' }).lean();
    if (!doc || !doc.fetchedAt) return null;
    return doc;
  } catch (err) {
    console.error('[GoogleReviews] cache read failed:', err.message);
    return null;
  }
}

/** Fetch fresh data from the Places API and store it in the cache. */
async function refresh() {
  if (!isConfigured()) return null;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE_ID)}`, {
        headers: {
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'rating,userRatingCount,reviews'
        }
      });
      if (!res.ok) {
        console.error(`[GoogleReviews] Places API ${res.status}`);
        return null;
      }
      const data = await res.json();
      const reviews = Array.isArray(data.reviews) ? data.reviews.map(r => ({
        authorName: (r.authorAttribution && r.authorAttribution.displayName) || 'Google user',
        rating: typeof r.rating === 'number' ? r.rating : 0,
        text: (r.text && r.text.text) || (r.originalText && r.originalText.text) || '',
        publishTime: r.publishTime ? new Date(r.publishTime) : null
      })) : [];
      const doc = await GoogleReviewCache.findOneAndUpdate(
        { key: 'google' },
        {
          key: 'google',
          rating: typeof data.rating === 'number' ? data.rating : 0,
          userRatingCount: typeof data.userRatingCount === 'number' ? data.userRatingCount : 0,
          reviews,
          fetchedAt: new Date()
        },
        { upsert: true, new: true }
      ).lean();
      return doc;
    } catch (err) {
      console.error('[GoogleReviews] refresh failed:', err.message);
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/** Refresh only when the cache is missing or older than a day. Never throws. */
async function refreshIfStale() {
  try {
    if (!isConfigured()) return null;
    const cached = await getCached();
    if (cached && (Date.now() - new Date(cached.fetchedAt).getTime()) < STALE_MS) return cached;
    return await refresh();
  } catch (err) {
    console.error('[GoogleReviews] refreshIfStale failed:', err.message);
    return null;
  }
}

const FORCE_FLOOR_MS = 5 * 60 * 1000; // a forced refresh at most every 5 min

/**
 * Forced refresh used when a client returns from posting on Google, so the
 * site can spot their new review quickly. Floored at 5 minutes so this can
 * never be used to hammer the Places API. Never throws.
 */
async function forceRefresh() {
  try {
    if (!isConfigured()) return null;
    const cached = await getCached();
    if (cached && (Date.now() - new Date(cached.fetchedAt).getTime()) < FORCE_FLOOR_MS) return cached;
    return await refresh();
  } catch (err) {
    console.error('[GoogleReviews] forceRefresh failed:', err.message);
    return null;
  }
}

/**
 * Google data shaped for the reviews endpoints. `active` follows Carter's
 * rule: the merge only lights up once Google has at least 1 rating.
 */
async function getGoogleBlock() {
  const cached = await getCached();
  const count = cached ? (cached.userRatingCount || 0) : 0;
  return {
    configured: isConfigured(),
    reviewUrl: REVIEW_URL,
    active: count >= 1,
    rating: cached ? (cached.rating || 0) : 0,
    count,
    syncedAt: cached ? (cached.fetchedAt || null) : null,
    reviews: cached && Array.isArray(cached.reviews) ? cached.reviews : []
  };
}

function normalizeText(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeName(firstName, lastName) {
  return normalizeText(`${firstName || ''} ${lastName || ''}`);
}

/**
 * True when a Google review looks like the same review a client already left
 * on the website: same reviewer name, same star rating, and the same opening
 * text. Heuristic on purpose: Google exposes only a public display name, so
 * an exact identity match is impossible. When in doubt, keep both.
 */
function isSameReview(siteReview, googleReview) {
  if (!siteReview || !googleReview) return false;
  if (siteReview.rating !== googleReview.rating) return false;
  const siteName = normalizeName(siteReview.firstName, siteReview.lastName);
  const googleName = normalizeText(googleReview.authorName);
  if (!siteName || !googleName || siteName !== googleName) return false;
  const siteText = normalizeText(siteReview.message);
  const googleText = normalizeText(googleReview.text);
  if (!siteText && !googleText) return true;
  if (!siteText || !googleText) return false;
  const probe = siteText.slice(0, 50);
  return googleText === siteText || googleText.startsWith(probe) || siteText.startsWith(googleText.slice(0, 50));
}

/** Google reviews shaped like website reviews, minus any already on the site. */
function mergedGoogleReviews(siteReviews, googleBlock) {
  if (!googleBlock || !googleBlock.active) return [];
  return googleBlock.reviews
    .filter(g => !siteReviews.some(s => isSameReview(s, g)))
    .map((g, i) => ({
      _id: `google-${i}`,
      source: 'google',
      userId: null,
      projectName: 'Google Review',
      businessName: '',
      firstName: g.authorName || 'Google user',
      lastName: '',
      rating: g.rating || 0,
      message: g.text || '',
      adminComment: null,
      policyArchived: false,
      policyNote: null,
      createdAt: g.publishTime || null
    }));
}

module.exports = {
  isConfigured,
  getReviewUrl,
  getCached,
  refresh,
  refreshIfStale,
  forceRefresh,
  getGoogleBlock,
  isSameReview,
  mergedGoogleReviews
};
