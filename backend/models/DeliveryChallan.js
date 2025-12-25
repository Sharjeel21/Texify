//backend/models/DeliveryChallan.js
const mongoose = require('mongoose');

const clothSchema = new mongoose.Schema({
  meter: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  }
});

const baleSchema = new mongoose.Schema({
  baleNumber: {
    type: Number,  // Changed to Number for simple numbering
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  cloths: [clothSchema],
  totalMeter: Number,
  totalWeight: Number,
  numberOfPieces: Number
});

const deliveryChallanSchema = new mongoose.Schema({
  challanNumber: {
    type: Number,  // Changed to Number for simple numbering
    required: true
  },
  quality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quality',
    required: true
  },
  qualityName: String,
  
  // Configuration from quality
  expectedBalesCount: {
    type: Number,
    required: true
  },
  expectedPiecesPerBale: {
    type: Number,
    required: true
  },
  
  // Actual data
  bales: [baleSchema],
  
  // Status tracking
  status: {
    type: String,
    enum: ['incomplete', 'complete'],
    default: 'incomplete'
  },
  completedBalesCount: {
    type: Number,
    default: 0
  },
  
  // Invoice tracking
  isSold: {
    type: Boolean,
    default: false
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaxInvoice'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update completedBalesCount and status before saving
deliveryChallanSchema.pre('save', function(next) {
  this.completedBalesCount = this.bales.length;
  
  // Auto-update status based on bales count
  if (this.completedBalesCount >= this.expectedBalesCount) {
    this.status = 'complete';
  } else {
    this.status = 'incomplete';
  }
  
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('DeliveryChallan', deliveryChallanSchema);