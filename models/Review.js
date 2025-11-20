const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [50, 'Title cannot be more than 50 characters']
    },
    category: {
        type: String,
        required: true,
        enum: ['Food', 'Housing', 'Nightlife', 'Campus', 'Other']
    },
    rating: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    body: {
        type: String,
        required: [true, 'Please add some text'],
        maxlength: [500, 'Keep it brief, brutal, and honest']
    },
    votes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Review', ReviewSchema);
