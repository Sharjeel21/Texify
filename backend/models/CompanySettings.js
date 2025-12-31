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
  mobile: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  gstNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
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
  panNumber: {
    type: String,
    uppercase: true,
    trim: true
  },
  
  // ============================================
  // GANTH PRESS DETAILS
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
  // FINANCIAL YEAR CONFIGURATION
  // ============================================
  financialYear: {
    startMonth: {
      type: Number,
      default: 4,
      min: 1,
      max: 12
    },
    currentYear: {
      type: Number,
      default: () => new Date().getFullYear()
    },
    lastResetDate: {
      type: Date,
      default: null
    }
  },
  
  // ============================================
  // DOCUMENT NUMBER SERIES
  // ============================================
  numberSeries: {
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
    invoiceResetMode: {
      type: String,
      enum: ['financial_year', 'calendar_year', 'manual', 'never'],
      default: 'financial_year'
    },
    invoiceYearFormat: {
      type: String,
      enum: ['YYYY', 'YY', 'YYYY-YY', 'none'],
      default: 'YY'
    },
    invoiceLastReset: {
      type: Date,
      default: null
    },
    
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
    challanResetMode: {
      type: String,
      enum: ['financial_year', 'calendar_year', 'manual', 'never'],
      default: 'financial_year'
    },
    challanYearFormat: {
      type: String,
      enum: ['YYYY', 'YY', 'YYYY-YY', 'none'],
      default: 'YY'
    },
    challanLastReset: {
      type: Date,
      default: null
    },
    
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
    purchaseResetMode: {
      type: String,
      enum: ['financial_year', 'calendar_year', 'manual', 'never'],
      default: 'financial_year'
    },
    purchaseYearFormat: {
      type: String,
      enum: ['YYYY', 'YY', 'YYYY-YY', 'none'],
      default: 'YY'
    },
    purchaseLastReset: {
      type: Date,
      default: null
    }
  },
  
  // ============================================
  // INVOICE FORMAT SETTINGS
  // ============================================
  invoiceFormat: {
    // Display Options
    showLogo: {
      type: Boolean,
      default: true
    },
    logoPosition: {
      type: String,
      enum: ['left', 'right'],
      default: 'left'
    },
    
    // Color Mode
    colorMode: {
      type: String,
      enum: ['color', 'black_white'],
      default: 'color'
    },
    
    // Typography Settings
    fontFamily: {
      type: String,
      enum: ['Segoe UI', 'Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'],
      default: 'Segoe UI'
    },
    fontSize: {
      base: {
        type: Number,
        default: 11, // Base font size in px
        min: 8,
        max: 16
      },
      companyName: {
        type: Number,
        default: 48,
        min: 24,
        max: 72
      },
      heading: {
        type: Number,
        default: 12,
        min: 10,
        max: 18
      }
    },
    fontWeight: {
      type: String,
      enum: ['normal', 'bold'],
      default: 'normal'
    },
    
    // Show/Hide Options
    showBankDetails: {
      type: Boolean,
      default: true
    },
    showTerms: {
      type: Boolean,
      default: true
    }
  },
  
  // ============================================
  // CHALLAN FORMAT SETTINGS
  // ============================================
  challanFormat: {
    // Display Options
    showLogo: {
      type: Boolean,
      default: true
    },
    logoPosition: {
      type: String,
      enum: ['left', 'right'],
      default: 'left'
    },
    
    // Color Mode
    colorMode: {
      type: String,
      enum: ['color', 'black_white'],
      default: 'color'
    },
    
    // Typography Settings
    fontFamily: {
      type: String,
      enum: ['Segoe UI', 'Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'],
      default: 'Segoe UI'
    },
    fontSize: {
      base: {
        type: Number,
        default: 11,
        min: 8,
        max: 16
      },
      companyName: {
        type: Number,
        default: 22,
        min: 16,
        max: 32
      },
      heading: {
        type: Number,
        default: 12,
        min: 10,
        max: 18
      }
    },
    fontWeight: {
      type: String,
      enum: ['normal', 'bold'],
      default: 'normal'
    },
    
    // Show/Hide Options
    showGanthPress: {
      type: Boolean,
      default: true
    },
    showWeights: {
      type: Boolean,
      default: true
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
      line1: {
        type: String,
        default: 'Any type of complaint regarding weight and folding will be entertained within 48Hrs.'
      }
    }
  },
  
  // Legacy fields
  termsLine1: String,
  termsLine2: String,
  termsLine3: String,
  termsLine4: String,
  
  // ============================================
  // SIGNATURE & STAMPS
  // ============================================
  signatureImage: {
    type: String
  },
  signatureText: {
    type: String,
    default: 'Authorized Signatory'
  },
  stampImage: {
    type: String
  },
  
  // ============================================
  // PREFERENCES
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
// HELPER METHODS
// ============================================

companySettingsSchema.methods.getCurrentFinancialYear = function() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const fyStartMonth = this.financialYear.startMonth;
  
  let fyStart, fyEnd;
  
  if (currentMonth >= fyStartMonth) {
    fyStart = new Date(currentYear, fyStartMonth - 1, 1);
    fyEnd = new Date(currentYear + 1, fyStartMonth - 1, 0);
  } else {
    fyStart = new Date(currentYear - 1, fyStartMonth - 1, 1);
    fyEnd = new Date(currentYear, fyStartMonth - 1, 0);
  }
  
  return {
    startDate: fyStart,
    endDate: fyEnd,
    startYear: fyStart.getFullYear(),
    endYear: fyEnd.getFullYear(),
    label: `FY ${fyStart.getFullYear()}-${(fyEnd.getFullYear() % 100).toString().padStart(2, '0')}`
  };
};

companySettingsSchema.methods.shouldResetNumberSeries = function(type) {
  const series = this.numberSeries;
  const resetMode = series[`${type}ResetMode`];
  const lastReset = series[`${type}LastReset`];
  
  if (resetMode === 'never') return false;
  if (resetMode === 'manual') return false;
  
  const now = new Date();
  
  if (resetMode === 'financial_year') {
    const fy = this.getCurrentFinancialYear();
    if (!lastReset) return true;
    return lastReset < fy.startDate && now >= fy.startDate;
  }
  
  if (resetMode === 'calendar_year') {
    const currentYear = now.getFullYear();
    if (!lastReset) return true;
    const lastResetYear = lastReset.getFullYear();
    return lastResetYear < currentYear;
  }
  
  return false;
};

companySettingsSchema.methods.autoResetIfNeeded = async function() {
  let resetOccurred = false;
  
  ['invoice', 'challan', 'purchase'].forEach(type => {
    if (this.shouldResetNumberSeries(type)) {
      this.numberSeries[`${type}CurrentNumber`] = 0;
      this.numberSeries[`${type}LastReset`] = new Date();
      resetOccurred = true;
    }
  });
  
  if (resetOccurred) {
    await this.save();
  }
  
  return resetOccurred;
};

companySettingsSchema.methods.getYearString = function(type, yearFormat) {
  if (yearFormat === 'none') return '';
  
  const resetMode = this.numberSeries[`${type}ResetMode`];
  
  if (resetMode === 'financial_year') {
    const fy = this.getCurrentFinancialYear();
    
    switch (yearFormat) {
      case 'YYYY':
        return `${fy.startYear}`;
      case 'YY':
        return `${(fy.startYear % 100).toString().padStart(2, '0')}`;
      case 'YYYY-YY':
        return `${fy.startYear}-${(fy.endYear % 100).toString().padStart(2, '0')}`;
      default:
        return '';
    }
  } else {
    const year = new Date().getFullYear();
    
    switch (yearFormat) {
      case 'YYYY':
        return `${year}`;
      case 'YY':
        return `${(year % 100).toString().padStart(2, '0')}`;
      case 'YYYY-YY':
        const nextYear = year + 1;
        return `${year}-${(nextYear % 100).toString().padStart(2, '0')}`;
      default:
        return '';
    }
  }
};

companySettingsSchema.methods.getNextInvoiceNumber = function() {
  const series = this.numberSeries;
  series.invoiceCurrentNumber += 1;
  
  let number = `${series.invoicePrefix}`;
  
  const yearStr = this.getYearString('invoice', series.invoiceYearFormat);
  if (yearStr) {
    number += `-${yearStr}`;
  }
  
  number += `-${series.invoiceCurrentNumber.toString().padStart(4, '0')}`;
  return number;
};

companySettingsSchema.methods.getNextChallanNumber = function() {
  const series = this.numberSeries;
  series.challanCurrentNumber += 1;
  
  let number = `${series.challanPrefix}`;
  
  const yearStr = this.getYearString('challan', series.challanYearFormat);
  if (yearStr) {
    number += `-${yearStr}`;
  }
  
  number += `-${series.challanCurrentNumber.toString().padStart(4, '0')}`;
  return number;
};

companySettingsSchema.methods.getNextPurchaseNumber = function() {
  const series = this.numberSeries;
  series.purchaseCurrentNumber += 1;
  
  let number = `${series.purchasePrefix}`;
  
  const yearStr = this.getYearString('purchase', series.purchaseYearFormat);
  if (yearStr) {
    number += `-${yearStr}`;
  }
  
  number += `-${series.purchaseCurrentNumber.toString().padStart(4, '0')}`;
  return number;
};

companySettingsSchema.methods.manualResetNumberSeries = function(type) {
  const series = this.numberSeries;
  series[`${type}CurrentNumber`] = 0;
  series[`${type}LastReset`] = new Date();
};

// ============================================
// PRE-SAVE HOOK
// ============================================
companySettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Migrate legacy terms
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