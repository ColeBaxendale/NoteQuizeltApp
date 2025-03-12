const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/UserSchema');
const jwt = require('jsonwebtoken');
require('dotenv').config();


async function handleOAuthLogin(profile, provider) {
    let user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
        // ✅ If user exists, update their provider ID if missing
        if (!user[`${provider}Id`]) {
            user[`${provider}Id`] = profile.id;
            await user.save();
        }
    } else {
        // ❌ No existing user, create a new one
        user = new User({
            email: profile.emails ? profile.emails[0].value : `${profile.id}@${provider}.com`,
            isOAuth: true,
            [`${provider}Id`]: profile.id,
            isPremium: false,
        });
        await user.save();

    }

    return user;
}

// ✅ Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const user = await handleOAuthLogin(profile, 'google');
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));


// ✅ Serialize & Deserialize User
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});