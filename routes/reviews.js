const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Comment = require('../models/Comment');
const { protect } = require('../middleware/authMiddleware');

// HELPER: Calculate Dynamic Threshold
// Returns the average interaction count of all reviews, or a minimum of 5
async function getUnlockThreshold() {
    const result = await Review.aggregate([
        { $group: { _id: null, avgInteractions: { $avg: '$interactionCount' } } }
    ]);
    const average = result.length > 0 ? Math.ceil(result[0].avgInteractions) : 0;
    // Minimum 3 interactions to unlock, otherwise use the average
    return Math.max(3, average); 
}

// @desc    Get all reviews (With Unlock Status)
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 }).lean();
        const threshold = await getUnlockThreshold();

        // Attach unlock status and threshold to each review
        const enrichedReviews = reviews.map(review => ({
            ...review,
            isUnlocked: (review.interactionCount || 0) >= threshold,
            unlockThreshold: threshold
        }));

        res.status(200).json(enrichedReviews);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Vote on a review
router.patch('/:id/vote', async (req, res) => {
    try {
        const { type } = req.body;
        const increment = type === 'up' ? 1 : -1;
        
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { 
                $inc: { 
                    votes: increment,           // Net Score (+1 or -1)
                    interactionCount: 1         // Heat (+1 always)
                } 
            },
            { new: true }
        );
        
        // Check if this vote unlocked it
        const threshold = await getUnlockThreshold();
        const isUnlocked = review.interactionCount >= threshold;

        res.status(200).json({ ...review.toObject(), isUnlocked, unlockThreshold: threshold });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Get Comments for a Review
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ reviewId: req.params.id }).sort({ createdAt: -1 });
        res.status(200).json(comments);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Post a Comment (Only if Unlocked)
router.post('/:id/comments', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        const threshold = await getUnlockThreshold();

        if (review.interactionCount < threshold) {
            return res.status(403).json({ error: "Comments are locked! More engagement needed." });
        }

        const comment = await Comment.create({
            reviewId: req.params.id,
            text: req.body.text
        });

        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Post a review
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

// @desc    Delete a review
router.delete('/:id', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ error: 'Review not found' });
        await review.deleteOne();
        // Cleanup comments
        await Comment.deleteMany({ reviewId: req.params.id });
        res.status(200).json({ success: true, id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
