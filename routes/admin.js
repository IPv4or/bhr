const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Admin Login
// @route   POST /api/admin/login
router.post('/login', (req, res) => {
    const { password } = req.body;

    // Simple check against Environment Variable
    if (password === process.env.ADMIN_PASSWORD) {
        res.json({
            username: 'Admin',
            token: generateToken('admin-id-123'), // Static ID for single admin
        });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

module.exports = router;
