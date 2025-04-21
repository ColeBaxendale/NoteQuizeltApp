const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false, select: false }, 
  isPremium: {type: Number, default : 0}, // "0" = Free, "1" = Premium, "2" = Super Premium
  stripeSubscriptionId: { type: String, default: null },
  isOAuth: { type: Boolean, default: false },
  googleId: { type: String, default: null },
  
});

const User = mongoose.model('User', userSchema);
module.exports = User;