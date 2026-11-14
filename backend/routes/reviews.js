const express = require('express');
const router = express.Router();
const ownerOnly = require('../middleware/growth-admin');
const Review = require('../models/Review');
const ReviewHandoff = require('../models/ReviewHandoff');
const Contract = require('../models/Contract');
const { RATING_TOTALS_FILTER, summarizeRatings } = require('../services/review-totals');
const googleReviews = require('../services/google-reviews.service');

// @route   GET /api/reviews/status
// @desc    Get all contracts for the user and their review status
router.get('/status', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.json([]);
    }

    // Get all contracts
    const contracts = await Contract.find({ userId: req.user._id }).sort({ acceptedAt: -1 });
    
    // Get all reviews for this user
    const reviews = await Review.find({ userId: req.user._id });

    // Reviews are posted on Google now; a handoff means this contract went
    // through the composer and was sent to Google to post there.
    const handoffs = await ReviewHandoff.find({ userId: req.user._id });

    const reviewStatusArray = contracts.map(contract => {
      // Find review for this specific contract
      const review = reviews.find(r => r.contractId.toString() === contract._id.toString());
      const handoff = handoffs.find(h => h.contractId.toString() === contract._id.toString());

      return {
        contractId: contract._id,
        projectName: contract.projectName || contract.contractType,
        contractStatus: contract.status,
        hasReview: !!review || !!handoff,
        viaGoogle: !review && !!handoff,
        reviewId: review ? review._id : null,
        rating: review ? review.rating : (handoff ? handoff.rating : null),
        message: review ? review.message : null,
        adminComment: review ? review.adminComment : null,
        dismissedLowRating: review ? review.dismissedLowRating : false
      };
    });

    res.json(reviewStatusArray);
  } catch (err) {
    console.error('Error fetching review status:', err);
    res.status(500).json([]);
  }
});

// @route   POST /api/reviews
// @desc    Submit a review for a specific contract
router.post('/', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { contractId, businessName, firstName, lastName, rating, message, projectName } = req.body;

    if (!contractId || !businessName || !firstName || rating == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Verify contract belongs to user
    const contract = await Contract.findOne({ _id: contractId, userId: req.user._id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Ensure no duplicate review for this contract
    const existingReview = await Review.findOne({ userId: req.user._id, contractId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already submitted a review for this order' });
    }

    const newReview = new Review({
      userId: req.user._id,
      contractId,
      projectName: projectName || contract.projectName || contract.contractType,
      businessName,
      firstName,
      lastName,
      rating,
      message,
      dismissedLowRating: false
    });

    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PATCH /api/reviews/:reviewId
// @desc    Update an existing review
router.patch('/:reviewId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { rating, message } = req.body;

    if (rating == null || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating is required' });
    }

    const review = await Review.findOne({ _id: req.params.reviewId, userId: req.user._id });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.rating = rating;
    review.message = message;
    // Reset dismissed status if they updated it
    review.dismissedLowRating = false;

    await review.save();
    res.json(review);
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete an existing review. The review's own user can delete
//          it; the site owner (admin account) can delete any review.
router.delete('/:reviewId', async (req, res) => {
  try {
    // Admin API key path: the same DISCOUNT_API_KEY that guards the
    // coupon admin endpoints may delete any review. This exists for
    // moderation cleanups run without an owner browser session.
    const configuredKey = process.env.DISCOUNT_API_KEY;
    if (configuredKey && req.headers['x-api-key'] === configuredKey) {
      const target = await Review.findById(req.params.reviewId);
      if (!target) {
        return res.status(404).json({ message: 'Review not found' });
      }
      await Review.deleteOne({ _id: target._id });
      return res.json({ success: true });
    }

    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let review = await Review.findOne({ _id: req.params.reviewId, userId: req.user._id });

    if (!review) {
      const ownerEmail = (process.env.OWNER_EMAIL || 'hello@phoenixwebsites.ai').toLowerCase().trim();
      const userEmail = (req.user.email || '').toLowerCase().trim();
      const isOwnerEmail = userEmail === ownerEmail ||
                           userEmail === 'hello@phoenixwebsites.ai' ||
                           userEmail === 'partnerships@carter-portfolio.fyi';
      const isOwnerId = process.env.GROWTH_ADMIN_USER_ID && String(req.user._id) === process.env.GROWTH_ADMIN_USER_ID;
      if (isOwnerEmail || isOwnerId) {
        review = await Review.findById(req.params.reviewId);
      }
    }

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await Review.deleteOne({ _id: review._id });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PATCH /api/reviews/:reviewId/dismiss
// @desc    Dismiss a low rating prompt forever
router.patch('/:reviewId/dismiss', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const review = await Review.findOne({ _id: req.params.reviewId, userId: req.user._id });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.dismissedLowRating = true;
    await review.save();
    res.json(review);
  } catch (err) {
    console.error('Error dismissing low rating:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PATCH /api/reviews/:reviewId/admin-comment
// @desc    Add an admin comment to a review
router.patch('/:reviewId/admin-comment', ownerOnly, async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // TODO: Verify admin role here if you have one.

    const { adminComment } = req.body;
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.adminComment = adminComment;
    await review.save();
    res.json(review);
  } catch (err) {
    console.error('Error saving admin comment:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/reviews/public
// @desc    Get all reviews for public viewing. Reviews for projects archived
//          under the Client Communication Policy remain listed (public and
//          searchable) with their policyNote; they are excluded from totals.
router.get('/public', async (req, res) => {
  try {
    const siteReviews = await Review.find()
      .select('_id userId projectName businessName firstName lastName rating message adminComment policyArchived policyNote createdAt')
      .sort({ createdAt: -1 })
      .lean();
    const tagged = siteReviews.map(r => ({ ...r, source: 'website' }));
    // Merge in Google reviews once the profile has at least 1 rating.
    // Google reviews that match a website review (same person, same stars,
    // same opening text) are dropped so nobody is shown twice.
    googleReviews.refreshIfStale().catch(() => {});
    const googleBlock = await googleReviews.getGoogleBlock();
    const merged = [...tagged, ...googleReviews.mergedGoogleReviews(tagged, googleBlock)];
    merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(merged);
  } catch (err) {
    console.error('Error fetching public reviews:', err);
    res.status(500).json([]);
  }
});

// @route   GET /api/reviews/summary
// @desc    Headline rating totals. Reviews with policyArchived = true are
//          EXCLUDED from the count and average (they are still listed by
//          /api/reviews/public and remain searchable).
router.get('/summary', async (req, res) => {
  try {
    const counted = await Review.find(RATING_TOTALS_FILTER).select('rating policyArchived');
    const totals = summarizeRatings(counted);
    const totalListed = await Review.countDocuments({});
    const googleBlock = await googleReviews.getGoogleBlock();
    const google = googleBlock.active
      ? { rating: googleBlock.rating, count: googleBlock.count }
      : null;
    // Combined headline across both platforms, from the real totals of each.
    // Site duplicates of a Google review cannot be detected at the aggregate
    // level (Google only exposes its own totals), so this is a straight sum
    // of the two platforms' published numbers, labeled as such in the UI.
    let combined = null;
    if (google) {
      const combinedCount = totals.count + google.count;
      combined = {
        count: combinedCount,
        average: combinedCount > 0
          ? Math.round(((totals.total + google.rating * google.count) / combinedCount) * 100) / 100
          : 0
      };
    }
    res.json({
      count: totals.count,
      total: totals.total,
      average: totals.average,
      excludedArchived: Math.max(0, totalListed - totals.count),
      google,
      combined
    });
  } catch (err) {
    console.error('Error fetching review summary:', err);
    res.status(500).json({ count: 0, total: 0, average: 0, excludedArchived: 0 });
  }
});

// @route   GET /api/reviews/google
// @desc    Public Google review link + aggregate for "Rate on Google"
//          buttons and badges across the site.
router.get('/google', async (req, res) => {
  try {
    googleReviews.refreshIfStale().catch(() => {});
    const googleBlock = await googleReviews.getGoogleBlock();
    res.json({
      reviewUrl: googleBlock.reviewUrl,
      active: googleBlock.active,
      rating: googleBlock.rating,
      count: googleBlock.count
    });
  } catch (err) {
    console.error('Error fetching Google review info:', err);
    res.status(500).json({ reviewUrl: googleReviews.getReviewUrl(), active: false, rating: 0, count: 0 });
  }
});

// @route   POST /api/reviews/handoff
// @desc    Record that a client finished the website composer and was handed
//          off to Google to post the review there. Accepts either the email
//          review token or an authenticated contractId. Stores no review
//          content: the review itself lives only on Google.
router.post('/handoff', async (req, res) => {
  try {
    const { token, contractId, rating } = req.body || {};
    let contract = null;
    if (token) {
      contract = await Contract.findOne({ reviewToken: token });
    } else if (contractId && req.isAuthenticated()) {
      contract = await Contract.findOne({ _id: contractId, userId: req.user._id });
    }
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found for this review.' });
    }
    const existing = await ReviewHandoff.findOne({ contractId: contract._id });
    if (!existing) {
      await ReviewHandoff.create({
        contractId: contract._id,
        userId: contract.userId || null,
        rating: typeof rating === 'number' ? rating : undefined
      });
    }
    res.json({ ok: true, reviewUrl: googleReviews.getReviewUrl() });
  } catch (err) {
    console.error('Error recording review handoff:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/reviews/google/refresh
// @desc    Force a Google reviews cache refresh (floored server-side) when a
//          client returns from posting on Google, then report the aggregate.
router.post('/google/refresh', async (req, res) => {
  try {
    await googleReviews.forceRefresh();
    const googleBlock = await googleReviews.getGoogleBlock();
    res.json({
      reviewUrl: googleBlock.reviewUrl,
      active: googleBlock.active,
      rating: googleBlock.rating,
      count: googleBlock.count
    });
  } catch (err) {
    console.error('Error refreshing Google reviews:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/reviews/all
// @desc    Get all reviews for admin dashboard
router.get('/all', ownerOnly, async (req, res) => {
  try {
    // Add admin check if you have an isAdmin field. For now checking authentication.
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // TODO: if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching all reviews:', err);
    res.status(500).json([]);
  }
});

// @route   GET /api/reviews/token/:token
// @desc    Get contract details by token (public)
router.get('/token/:token', async (req, res) => {
  try {
    const contract = await Contract.findOne({ reviewToken: req.params.token }).populate('userId');
    if (!contract) {
      return res.status(404).json({ message: 'Invalid or expired review link.' });
    }

    const existingReview = await Review.findOne({ contractId: contract._id });
    if (existingReview) {
      return res.status(400).json({ message: 'A review has already been submitted for this project.' });
    }

    res.json({
      contractId: contract._id,
      projectName: contract.projectName || contract.contractType,
      businessName: contract.userId ? contract.userId.businessName : '',
      firstName: contract.userId ? contract.userId.firstName : '',
      lastName: contract.userId ? contract.userId.lastName : ''
    });
  } catch (err) {
    console.error('Error fetching by token:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/reviews/token/:token
// @desc    Submit a review using a token
router.post('/token/:token', async (req, res) => {
  try {
    const contract = await Contract.findOne({ reviewToken: req.params.token });
    if (!contract) {
      return res.status(404).json({ message: 'Invalid or expired review link.' });
    }

    const existingReview = await Review.findOne({ contractId: contract._id });
    if (existingReview) {
      return res.status(400).json({ message: 'A review has already been submitted for this project.' });
    }

    const { businessName, firstName, lastName, rating, message } = req.body;

    if (!businessName || !firstName || rating == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const newReview = new Review({
      userId: contract.userId,
      contractId: contract._id,
      projectName: contract.projectName || contract.contractType,
      businessName,
      firstName,
      lastName,
      rating,
      message,
      dismissedLowRating: false
    });

    await newReview.save();
    
    contract.reviewToken = null;
    await contract.save();

    res.status(201).json(newReview);
  } catch (err) {
    console.error('Error submitting review by token:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
