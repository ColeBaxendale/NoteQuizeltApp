const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subschema for quiz questions
const questionSchema = new Schema({
  questionText: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['truefalse', 'fillin', 'multiplechoice'], 
    required: true 
  },
  // Only used for multiple-choice questions; for other types, this can be empty or omitted.
  options: {
    type: [String],
    default: undefined  // Makes it optional
  },
  // The correct answer:
  // - For truefalse: store a Boolean.
  // - For fillin/multiplechoice: store a String.
  correctAnswer: { 
    type: Schema.Types.Mixed, 
    required: true 
  }
});

// Main Quiz Schema
const quizSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  questions: [questionSchema],
  deck: { 
    type: Schema.Types.ObjectId, 
    ref: 'Deck', 
    required: true 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // A numeric grade that can be updated when the quiz is graded
  grade: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;
