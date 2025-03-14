const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false, select: false }, 
  isPremium: { type: Boolean, default: false },
  stripeSubscriptionId: { type: String, default: null },
  isOAuth: { type: Boolean, default: false },
  googleId: { type: String, default: null },
  isDarkTheme: { type: Boolean, default: false },
  
});

const User = mongoose.model('User', userSchema);
module.exports = User;