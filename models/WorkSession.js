const mongoose = require('mongoose');

const WorkSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // duration in milliseconds
    default: 0
  }
});

module.exports = mongoose.model('WorkSession', WorkSessionSchema);
