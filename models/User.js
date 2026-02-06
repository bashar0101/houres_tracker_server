const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'manager'],
    default: 'user'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'rejected'],
    default: 'pending'
  }
});

module.exports = mongoose.model('User', UserSchema);
