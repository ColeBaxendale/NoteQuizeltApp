const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const flashcardSchema = new Schema({
  setTitle: { 
    type: String, 
    required: true 
  },

  length:{
    type: Number,
    required: true
  }, 

  flashcards: [{
    question: { 
      type: String, 
      required: true 
    },
    answer: { 
      type: String, 
      required: true 
    }
  }],
  deck: { 
    type: Schema.Types.ObjectId, 
    ref: 'Deck', 
    required: true 
  }
});

const FlashcardSet = mongoose.model('FlashcardSet', flashcardSchema);
module.exports = FlashcardSet;
