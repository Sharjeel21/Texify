//backend/models/taxInvoice.js
const mongoose = require('mongoose');

const baleDetailSchema = new mongoose.Schema({
  baleNumber: Number,
  numberOfPieces: Number,
  totalMeter: Number,
  totalWeight: Number
});

const challanDetailSchema = new mongoose.Schema({
  challanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryChallan',
    required: true
  },
  challanNumber: String,
  numberOfBales: Number,
  totalPieces: Number,
  totalMeters: Number,
  bales: [baleDetailSchema]
});

const taxInvoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  billNumber: {
    type: Number,
    required: true
    // unique: true removed here
  },
  date: {
    type: Date,
    required: true
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
  qualityName: String,
  hsnCode: String,
  
  // NEW: Optional deal reference
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    default: null
  },
  
  challanDetails: [challanDetailSchema],
  
  totalPieces: Number,
  totalMeters: Number,
  ratePerMeter: Number, // Original rate (NOT printed on bill)
  discountedRate: Number, // Discounted rate (printed on bill)
  discountPercentage: {
    type: Number,
    default: 0
  },
  discountAmount: Number,
  subtotal: Number,
  cgst: Number,
  sgst: Number,
  igst: Number,
  roundOff: Number,
  totalAmount: Number,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// COMPOUND INDICES
taxInvoiceSchema.index({ user: 1, billNumber: 1 }, { unique: true });
taxInvoiceSchema.index({ user: 1, party: 1, date: -1 });
taxInvoiceSchema.index({ user: 1, dealId: 1 });

module.exports = mongoose.model('TaxInvoice', taxInvoiceSchema);