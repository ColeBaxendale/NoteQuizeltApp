const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  // References to related flashcards
  flashcards: [{
    type: Schema.Types.ObjectId,
    ref: 'Flashcard'
  }],
  // References to generated quizzes
  quizzes: [{
    type: Schema.Types.ObjectId,
    ref: 'Quiz'
  }],
  // References to generated summarizations
  summarizations: [{
    type: Schema.Types.ObjectId,
    ref: 'Summarization'
  }],
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

deckSchema.index({ user: 1, title: 1 }, { unique: true });

// Pre-save hook to update updatedAt on every save
deckSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Deck = mongoose.model('Deck', deckSchema);
module.exports = Deck;
