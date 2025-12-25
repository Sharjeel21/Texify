const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  dealNumber: {
    type: Number,
    required: true,
    unique: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  partyDetails: {
    name: String,
    address: String,
    gstNumber: String,
    state: String,
    stateCode: String
  },
  quality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quality',
    required: true
  },
  qualityDetails: {
    name: String,
    hsnCode: String,
    balesPerChallan: Number,
    piecesPerBale: Number
  },
  
  // Deal specifics
  ratePerMeter: {
    type: Number,
    required: true,
    min: 0
  },
  totalBilties: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Tracking - completedBilties represents sold (invoiced) challans
  completedBilties: {
    type: Number,
    default: 0
  },
  challanIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryChallan'
  }],
  invoiceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaxInvoice'
  }],
  
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  
  // Optional fields
  notes: String,
  startDate: {
    type: Date,
    default: Date.now
  },
  completionDate: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update status and completionDate before saving
dealSchema.pre('save', function(next) {
  // Only auto-complete if we've reached or exceeded the target AND status is still active
  if (this.completedBilties >= this.totalBilties && this.status === 'active') {
    this.status = 'completed';
    this.completionDate = new Date();
  }
  
  // If status was manually changed back to active, clear completion date
  if (this.status === 'active' && this.completionDate) {
    this.completionDate = null;
  }
  
  this.updatedAt = new Date();
  next();
});

// Virtual field to get count of created (but not necessarily sold) challans
dealSchema.virtual('createdChallansCount').get(function() {
  return this.challanIds.length;
});

// Virtual field to calculate remaining bilties
dealSchema.virtual('remainingBilties').get(function() {
  return Math.max(0, this.totalBilties - this.completedBilties);
});

// Ensure virtuals are included when converting to JSON
dealSchema.set('toJSON', { virtuals: true });
dealSchema.set('toObject', { virtuals: true });

// Index for faster queries
dealSchema.index({ party: 1, status: 1 });
dealSchema.index({ quality: 1, status: 1 });
dealSchema.index({ dealNumber: 1 });

module.exports = mongoose.model('Deal', dealSchema);