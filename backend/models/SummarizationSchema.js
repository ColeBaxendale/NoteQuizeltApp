const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const summarizationSchema = new Schema({
  title: {             // optional, but handy
    type: String,
    default: 'Summary'
  },
  summary: { 
    type: String, 
    required: true 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  deck: { 
    type: Schema.Types.ObjectId, 
    ref: 'Deck', 
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


const Summarization = mongoose.model('Summarization', summarizationSchema);
module.exports = Summarization;
