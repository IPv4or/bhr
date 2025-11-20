const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all reviews
// @route   GET /api/reviews
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.status(200).json(reviews);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Add a review
// @route   POST /api/reviews
router.post('/', async (req, res) => {
    try {
        // No filter here - raw honest reviews
        const review = await Review.create(req.body);
        res.status(201).json(review);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ error: messages });
        }
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Vote on a review
// @route   PATCH /api/reviews/:id/vote
router.patch('/:id/vote', async (req, res) => {
    try {
        const { type } = req.body;
        const increment = type === 'up' ? 1 : -1;
        
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { $inc: { votes: increment } },
            { new: true }
        );
        
        res.status(200).json(review);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Delete a review (Protected by JWT)
// @route   DELETE /api/reviews/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        await review.deleteOne();

        res.status(200).json({ success: true, id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
