const User = require('../models/UserSchema')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

require('dotenv').config();


exports.register = async (req, res) => {
    console.log("in register");
    console.log("req.body:", req.body); // See if any data is arriving
    const { email, password } = req.body;
    console.log("email:", email);
    try {
        // ✅ Validate Password Strength
        if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)) {
            return res.status(400).json({
                message: "Password too weak: 8 characters long, an uppercase & lowercase letter, a number, and a special character." 

            });
        }

        // ✅ Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Create User
        const user = new User({
            email,
            password: hashedPassword,
            isPremium: "0"
        });

        await user.save();

        // ✅ Generate JWT Token
        const token = jwt.sign({ userId: user._id, isPremium: user.isPremium }, process.env.JWT_SECRET, { expiresIn: "24h" });

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ userId: user._id, isPremium: user.isPremium }, process.env.JWT_SECRET, { expiresIn: "24h" });
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        res.status(200).json({ message: 'Logged in successfully' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};


exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({
            userId: user._id,
            email: user.email,
            isPremium: user.isPremium,
        });
        
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

