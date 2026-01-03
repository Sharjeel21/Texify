//backend/models/Party.js
const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  gstNumber: {
    type: String,
    required: true
    // unique: true removed here
  },
  state: {
    type: String,
    required: true
  },
  stateCode: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for uniqueness per user
partySchema.index({ user: 1, gstNumber: 1 }, { unique: true });

module.exports = mongoose.model('Party', partySchema);