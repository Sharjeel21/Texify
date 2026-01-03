// backend/models/Quality.js
const mongoose = require('mongoose');

const qualitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  name: {
    type: String,
    required: true
    // unique: true removed here
  },
  description: String,
  
  // HSN Code for GST Invoice
  hsnCode: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        // HSN code can be 4, 6, or 8 digits
        return /^\d{4,8}$/.test(v);
      },
      message: 'HSN code must be 4 to 8 digits'
    }
  },
  
  // Quality-specific configuration
  balesPerChallan: {
    type: Number,
    required: true,
    default: 5,
    min: 1
  },
  piecesPerBale: {
    type: Number,
    required: true,
    default: 10,
    min: 1
  },
  
  currentBaleNumber: {
    type: Number,
    default: 0
  },
  currentChallanNumber: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for uniqueness per user
qualitySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Quality', qualitySchema);