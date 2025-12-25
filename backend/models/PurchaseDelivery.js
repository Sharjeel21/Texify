// backend/models/PurchaseDelivery.js
const mongoose = require('mongoose');

const purchaseDeliverySchema = new mongoose.Schema({
  deliveryNumber: {
    type: Number,
    required: true
  },
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true
  },
  
  deliveryDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  actualWeight: {
    type: Number,
    required: true,
    min: [0.001, 'Weight must be greater than 0']
  },
  deductFromDeal: {
    type: Number,
    required: true,
    min: [0.001, 'Deduct amount must be greater than 0']
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
  
  grossAmount: {
    type: Number,
    default: 0
  },
  godownCharges: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    default: 0
  },
  
  paymentDueDate: {
    type: Date,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: [0, 'Amount paid cannot be negative']
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  
  // Payment details
  payments: [{
    paymentDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative']
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['RTGS', 'Cheque']
    },
    // For Cheque payments
    chequeNumber: String,
    chequeDate: Date,
    bankName: String,
    // For RTGS payments
    transactionId: String,
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  supplierChallanNumber: String,
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

purchaseDeliverySchema.pre('save', function(next) {
  this.grossAmount = Math.round(this.actualWeight * 1000 * this.ratePerKg * 100) / 100;
  this.godownCharges = Math.round(this.actualWeight * 1000 * (this.godownChargesPerKg || 0) * 100) / 100;
  this.netAmount = Math.round((this.grossAmount - this.godownCharges) * 100) / 100;
  
  if (this.amountPaid > this.netAmount) {
    this.amountPaid = this.netAmount;
  }
  
  this.pendingAmount = Math.round((this.netAmount - (this.amountPaid || 0)) * 100) / 100;
  
  if (!this.amountPaid || this.amountPaid === 0) {
    this.paymentStatus = 'pending';
  } else if (this.amountPaid >= this.netAmount) {
    this.paymentStatus = 'paid';
    this.pendingAmount = 0;
  } else {
    this.paymentStatus = 'partial';
  }
  
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PurchaseDelivery', purchaseDeliverySchema);