const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: true
    },
    text: {
        type: String,
        required: [true, 'Comment cannot be empty'],
        trim: true,
        maxlength: [300, 'Keep comments brief']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Comment', CommentSchema);
