// backend/models/CompanySettings.js
const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  // ============================================
  // COMPANY DETAILS
  // ============================================
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  stateCode: {
    type: String,
    trim: true
  },
  
  // Contact Details (Optional)
  mobile: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // GST Details
  gstNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Logo (Base64 encoded image)
  logo: {
    type: String
  },
  
  // ============================================
  // BANK DETAILS
  // ============================================
  bankName: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    uppercase: true,
    trim: true
  },
  branchName: {
    type: String,
    trim: true
  },
  
  // ============================================
  // GANTH PRESS DETAILS (for Delivery Challan)
  // ============================================
  ganthPressName: {
    type: String,
    trim: true
  },
  ganthPressAddress: {
    type: String,
    trim: true
  },
  
  // ============================================
  // DOCUMENT NUMBER SERIES
  // ============================================
  numberSeries: {
    // Invoice Number Series
    invoicePrefix: {
      type: String,
      default: 'INV',
      trim: true
    },
    invoiceStartNumber: {
      type: Number,
      default: 1
    },
    invoiceCurrentNumber: {
      type: Number,
      default: 0
    },
    invoiceResetYearly: {
      type: Boolean,
      default: true
    },
    invoiceYearFormat: {
      type: String,
      enum: ['YYYY', 'YY', 'YYYY-YY', 'none'],
      default: 'YY'
    },
    
    // Challan Number Series
    challanPrefix: {
      type: String,
      default: 'DC',
      trim: true
    },
    challanStartNumber: {
      type: Number,
      default: 1
    },
    challanCurrentNumber: {
      type: Number,
      default: 0
    },
    challanResetYearly: {
      type: Boolean,
      default: true
    },
    challanYearFormat: {
      type: String,
      enum: ['YYYY', 'YY', 'YYYY-YY', 'none'],
      default: 'YY'
    },
    
    // Purchase Order Number Series
    purchasePrefix: {
      type: String,
      default: 'PO',
      trim: true
    },
    purchaseStartNumber: {
      type: Number,
      default: 1
    },
    purchaseCurrentNumber: {
      type: Number,
      default: 0
    },
    purchaseResetYearly: {
      type: Boolean,
      default: true
    },
    purchaseYearFormat: {
      type: String,
      enum: ['YYYY', 'YY', 'YYYY-YY', 'none'],
      default: 'YY'
    }
  },
  
  // ============================================
  // INVOICE FORMAT SETTINGS
  // ============================================
  invoiceFormat: {
    // Layout
    template: {
      type: String,
      enum: ['classic', 'modern', 'minimal', 'detailed'],
      default: 'classic'
    },
    showLogo: {
      type: Boolean,
      default: true
    },
    logoPosition: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'left'
    },
    
    // Colors
    primaryColor: {
      type: String,
      default: '#2c3e50'
    },
    accentColor: {
      type: String,
      default: '#3498db'
    },
    
    // Fields to Show/Hide
    showBankDetails: {
      type: Boolean,
      default: true
    },
    showTerms: {
      type: Boolean,
      default: true
    },
    showSignature: {
      type: Boolean,
      default: true
    },
    showQRCode: {
      type: Boolean,
      default: false
    },
    
    // Footer Text
    footerText: {
      type: String,
      default: 'Thank you for your business!'
    },
    
    // Tax Display
    taxDisplayStyle: {
      type: String,
      enum: ['combined', 'separate', 'detailed'],
      default: 'combined'
    }
  },
  
  // ============================================
  // CHALLAN FORMAT SETTINGS
  // ============================================
  challanFormat: {
    // Layout
    template: {
      type: String,
      enum: ['compact', 'detailed', 'summary'],
      default: 'detailed'
    },
    showLogo: {
      type: Boolean,
      default: true
    },
    
    // Fields to Show/Hide
    showGanthPress: {
      type: Boolean,
      default: true
    },
    showBaleDetails: {
      type: Boolean,
      default: true
    },
    showQualityBreakdown: {
      type: Boolean,
      default: true
    },
    showWeights: {
      type: Boolean,
      default: true
    },
    
    // Footer
    footerNote: {
      type: String,
      default: 'Goods remain the property of the consignor until paid for'
    }
  },
  
  // ============================================
  // TERMS AND CONDITIONS
  // ============================================
  terms: {
    invoice: {
      line1: String,
      line2: String,
      line3: String,
      line4: String
    },
    challan: {
      line1: String,
      line2: String,
      line3: String
    }
  },
  
  // Legacy fields (for backward compatibility)
  termsLine1: String,
  termsLine2: String,
  termsLine3: String,
  termsLine4: String,
  
  // ============================================
  // SIGNATURE & STAMPS
  // ============================================
  signatureImage: {
    type: String // Base64 encoded
  },
  signatureText: {
    type: String,
    default: 'Authorized Signatory'
  },
  stampImage: {
    type: String // Base64 encoded
  },
  
  // ============================================
  // NOTIFICATIONS & PREFERENCES
  // ============================================
  preferences: {
    defaultTaxRate: {
      type: Number,
      default: 18
    },
    defaultCurrency: {
      type: String,
      default: 'INR'
    },
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    },
    numberFormat: {
      type: String,
      enum: ['indian', 'international'],
      default: 'indian'
    }
  },
  
  // ============================================
  // TIMESTAMPS
  // ============================================
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ============================================
// METHODS
// ============================================

// Generate next invoice number
companySettingsSchema.methods.getNextInvoiceNumber = function() {
  const series = this.numberSeries;
  series.invoiceCurrentNumber += 1;
  
  let number = `${series.invoicePrefix}-`;
  
  if (series.invoiceYearFormat !== 'none') {
    const year = new Date().getFullYear();
    switch (series.invoiceYearFormat) {
      case 'YYYY':
        number += `${year}-`;
        break;
      case 'YY':
        number += `${year.toString().slice(-2)}-`;
        break;
      case 'YYYY-YY':
        const nextYear = year + 1;
        number += `${year}-${nextYear.toString().slice(-2)}-`;
        break;
    }
  }
  
  number += series.invoiceCurrentNumber.toString().padStart(4, '0');
  return number;
};

// Generate next challan number
companySettingsSchema.methods.getNextChallanNumber = function() {
  const series = this.numberSeries;
  series.challanCurrentNumber += 1;
  
  let number = `${series.challanPrefix}-`;
  
  if (series.challanYearFormat !== 'none') {
    const year = new Date().getFullYear();
    switch (series.challanYearFormat) {
      case 'YYYY':
        number += `${year}-`;
        break;
      case 'YY':
        number += `${year.toString().slice(-2)}-`;
        break;
      case 'YYYY-YY':
        const nextYear = year + 1;
        number += `${year}-${nextYear.toString().slice(-2)}-`;
        break;
    }
  }
  
  number += series.challanCurrentNumber.toString().padStart(4, '0');
  return number;
};

// Generate next purchase number
companySettingsSchema.methods.getNextPurchaseNumber = function() {
  const series = this.numberSeries;
  series.purchaseCurrentNumber += 1;
  
  let number = `${series.purchasePrefix}-`;
  
  if (series.purchaseYearFormat !== 'none') {
    const year = new Date().getFullYear();
    switch (series.purchaseYearFormat) {
      case 'YYYY':
        number += `${year}-`;
        break;
      case 'YY':
        number += `${year.toString().slice(-2)}-`;
        break;
      case 'YYYY-YY':
        const nextYear = year + 1;
        number += `${year}-${nextYear.toString().slice(-2)}-`;
        break;
    }
  }
  
  number += series.purchaseCurrentNumber.toString().padStart(4, '0');
  return number;
};

// Reset yearly counters (call this on January 1st)
companySettingsSchema.methods.resetYearlyCounters = function() {
  if (this.numberSeries.invoiceResetYearly) {
    this.numberSeries.invoiceCurrentNumber = 0;
  }
  if (this.numberSeries.challanResetYearly) {
    this.numberSeries.challanCurrentNumber = 0;
  }
  if (this.numberSeries.purchaseResetYearly) {
    this.numberSeries.purchaseCurrentNumber = 0;
  }
};

// ============================================
// PRE-SAVE HOOK
// ============================================
companySettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Migrate legacy terms to new structure
  if (this.termsLine1 && !this.terms.invoice.line1) {
    this.terms.invoice.line1 = this.termsLine1;
  }
  if (this.termsLine2 && !this.terms.invoice.line2) {
    this.terms.invoice.line2 = this.termsLine2;
  }
  if (this.termsLine3 && !this.terms.invoice.line3) {
    this.terms.invoice.line3 = this.termsLine3;
  }
  if (this.termsLine4 && !this.terms.invoice.line4) {
    this.terms.invoice.line4 = this.termsLine4;
  }
  
  next();
});

module.exports = mongoose.model('CompanySettings', companySettingsSchema);