// backend/models/Purchase.js
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchaseNumber: {
    type: Number,
    required: true,
    unique: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  partyName: String,
  
  // Yarn details
  yarnType: {
    type: String,
    required: true,
    enum: ['Roto', 'Zeero', 'Other']
  },
  yarnQuality: {
    type: String,
    required: true
  },
  
  // Purchase terms
  approxQuantity: {
    type: Number,
    required: true,
    min: [0.001, 'Quantity must be greater than 0']
  },
  ratePerKg: {
    type: Number,
    required: true,
    min: [0, 'Rate cannot be negative']
  },
  godownChargesPerKg: {
    type: Number,
    default: 0,
    min: [0, 'Godown charges cannot be negative']
  },
  
  // Payment terms
  paymentType: {
    type: String,
    required: true,
    enum: ['Current', 'Dhara']
  },
  paymentDays: {
    type: Number,
    required: true,
    min: [1, 'Payment days must be at least 1']
  },
  
  // Weight tracking
  totalActualWeight: {
    type: Number,
    default: 0
  },
  totalDeductedWeight: {
    type: Number,
    default: 0
  },
  remainingApproxQuantity: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },
  
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

purchaseSchema.pre('save', function(next) {
  this.remainingApproxQuantity = this.approxQuantity - (this.totalDeductedWeight || 0);
  
  if (this.remainingApproxQuantity < 0) {
    this.remainingApproxQuantity = 0;
  }
  
  if (!this.totalDeductedWeight || this.totalDeductedWeight === 0) {
    this.status = 'pending';
  } else if (this.totalDeductedWeight >= this.approxQuantity) {
    this.status = 'completed';
  } else {
    this.status = 'partial';
  }
  
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);