const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// Simple Admin Protection (Hardcoded for simplicity - use proper Auth in v2)
// You must send a header 'x-admin-secret': 'logan-justice' to delete
const ADMIN_SECRET = 'logan-justice';

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
        const { type } = req.body; // 'up' or 'down'
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

// @desc    Delete a review (Admin only)
// @route   DELETE /api/reviews/:id
router.delete('/:id', async (req, res) => {
    try {
        const secret = req.headers['x-admin-secret'];
        
        if (secret !== ADMIN_SECRET) {
            return res.status(401).json({ error: 'Unauthorized: Wrong secret phrase' });
        }

        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        await review.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
