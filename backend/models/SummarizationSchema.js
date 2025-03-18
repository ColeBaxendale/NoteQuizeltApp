const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const summarizationSchema = new Schema({
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

});

const Summarization = mongoose.model('Summarization', summarizationSchema);
module.exports = Summarization;
