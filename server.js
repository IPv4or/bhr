const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Security Imports
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Load env vars
dotenv.config();

const app = express();

// --- CRITICAL FIX FOR RAILWAY ---
// This tells Express to trust the Load Balancer/Proxy 
// so we can get the correct User IP for rate limiting.
app.set('trust proxy', 1); 
// --------------------------------

// --- SECURITY MIDDLEWARE START ---

// 1. Set security headers
// We disable contentSecurityPolicy because we are using CDNs (Tailwind/FontAwesome)
app.use(helmet({
    contentSecurityPolicy: false,
}));

// 2. Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, 
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// 3. Prevent NoSQL Injection
app.use(mongoSanitize());

// 4. Prevent XSS Attacks
app.use(xss());

// 5. Prevent Parameter Pollution
app.use(hpp());

// --- SECURITY MIDDLEWARE END ---

app.use(express.json({ limit: '10kb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// DB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Routes
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));

// Catch-all
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
