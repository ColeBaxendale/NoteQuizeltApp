const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController.js'); 
const authenticateToken = require('../config/authMiddleware')

router.post('/signup', authController.register);
router.post('/signin', authController.login);
router.get('/user', authenticateToken, authController.getUser);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    });

    res.redirect('http://localhost:3000/dashboard'); 
});


router.get("/check-auth", (req, res) => {
    const token = req.cookies.token; 

    if (!token) {
        return res.status(401).json({ authenticated: false });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ authenticated: true, userId: decoded.userId });
    } catch (error) {
        res.status(401).json({ authenticated: false });
    }
});


module.exports = router;