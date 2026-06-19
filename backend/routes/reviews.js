const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Contract = require('../models/Contract');

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

    const reviewStatusArray = contracts.map(contract => {
      // Find review for this specific contract
      const review = reviews.find(r => r.contractId.toString() === contract._id.toString());
      
      return {
        contractId: contract._id,
        projectName: contract.projectName || contract.contractType,
        contractStatus: contract.status,
        hasReview: !!review,
        reviewId: review ? review._id : null,
        rating: review ? review.rating : null,
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
// @desc    Delete an existing review
router.delete('/:reviewId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const review = await Review.findOne({ _id: req.params.reviewId, userId: req.user._id });
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
router.patch('/:reviewId/admin-comment', async (req, res) => {
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
// @desc    Get all reviews for public viewing
router.get('/public', async (req, res) => {
  try {
    const reviews = await Review.find()
      .select('_id userId projectName businessName firstName lastName rating message adminComment createdAt')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching public reviews:', err);
    res.status(500).json([]);
  }
});

// @route   GET /api/reviews/all
// @desc    Get all reviews for admin dashboard
router.get('/all', async (req, res) => {
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
