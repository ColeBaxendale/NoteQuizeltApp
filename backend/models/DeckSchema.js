const mongoose = require('mongoose');
const { Schema } = mongoose;

const deckSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String 
  },
  description: {
    type: String 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  // multiple flashcard sets
  flashcardSets: [{
    type: Schema.Types.ObjectId,
    ref: 'FlashcardSet'
  }],

  // multiple quiz sets
  quizSets: [{
    type: Schema.Types.ObjectId,
    ref: 'Quiz'
  }],

  // multiple summarization sets
  summarizations: [{
    type: Schema.Types.ObjectId,
    ref: 'Summarization'
  }],

  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// keep titles unique per user
deckSchema.index({ user: 1, title: 1 }, { unique: true });

// auto‐stamp updates
deckSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Deck', deckSchema);
