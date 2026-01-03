// backend/routes/companySettings.js - UPDATED WITH SECURITY
const express = require('express');
const router = express.Router();
const CompanySettings = require('../models/CompanySettings');
const { initCaptcha, searchGST } = require('../gstScraper');
const { authenticate } = require('../middleware/auth');
const { 
  secureCreate, 
  secureUpdate, 
  handleCompanySettings 
} = require('../middleware/dataAccess');

// ============================================
// GST Verification Routes (No auth needed)
// ============================================
router.get('/gst/init-captcha', async (req, res) => {
  try {
    const result = await initCaptcha();
    res.json(result);
  } catch (error) {
    console.error('Error initializing CAPTCHA:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initialize CAPTCHA' 
    });
  }
});

router.post('/gst/verify', async (req, res) => {
  try {
    const { sessionId, gstNumber, captcha } = req.body;
    
    if (!sessionId || !gstNumber || !captcha) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    const result = await searchGST(sessionId, gstNumber, captcha);
    res.json(result);
  } catch (error) {
    console.error('Error verifying GST:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify GST' 
    });
  }
});

// ============================================
// PROTECTED ROUTES - Require Authentication
// ============================================

// Get company settings for current user
router.get('/', authenticate, handleCompanySettings, async (req, res) => {
  try {
    let settings = await CompanySettings.findOne({ user: req.userId });
    
    if (!settings) {
      return res.json({
        exists: false,
        data: null
      });
    }
    
    // Auto-reset number series if needed
    await settings.autoResetIfNeeded();
    
    res.json({
      exists: true,
      data: settings,
      financialYear: settings.getCurrentFinancialYear()
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ 
      exists: false,
      error: error.message 
    });
  }
});

// Create or update company settings
router.post('/', authenticate, secureCreate, async (req, res) => {
  try {
    let settings = await CompanySettings.findOne({ user: req.userId });
    
    if (settings) {
      // Update existing settings
      Object.assign(settings, req.body);
      settings.user = req.userId; // Ensure user doesn't change
      settings.updatedAt = new Date();
      await settings.save();
      console.log('✅ Company settings updated for user:', req.userId);
    } else {
      // Create new settings
      const defaultSettings = {
        ...req.body,
        user: req.userId, // Always set to current user
        numberSeries: req.body.numberSeries || {},
        invoiceFormat: req.body.invoiceFormat || {},
        challanFormat: req.body.challanFormat || {},
        terms: req.body.terms || { invoice: {}, challan: {} },
        preferences: req.body.preferences || {},
        financialYear: req.body.financialYear || {}
      };
      
      settings = new CompanySettings(defaultSettings);
      await settings.save();
      console.log('✅ Company settings created for user:', req.userId);
    }
    
    res.json({
      success: true,
      exists: true,
      data: settings,
      financialYear: settings.getCurrentFinancialYear(),
      message: 'Company settings saved successfully'
    });
  } catch (error) {
    console.error('❌ Error saving company settings:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Update specific fields (PATCH)
router.patch('/', authenticate, secureUpdate, async (req, res) => {
  try {
    let settings = await CompanySettings.findOne({ user: req.userId });
    
    if (!settings) {
      return res.status(404).json({ 
        success: false,
        error: 'Company settings not found' 
      });
    }
    
    // Handle nested object updates
    if (req.body.numberSeries) {
      settings.numberSeries = { ...settings.numberSeries.toObject(), ...req.body.numberSeries };
    }
    if (req.body.invoiceFormat) {
      settings.invoiceFormat = { ...settings.invoiceFormat.toObject(), ...req.body.invoiceFormat };
    }
    if (req.body.challanFormat) {
      settings.challanFormat = { ...settings.challanFormat.toObject(), ...req.body.challanFormat };
    }
    if (req.body.terms) {
      settings.terms = { ...settings.terms.toObject(), ...req.body.terms };
    }
    if (req.body.preferences) {
      settings.preferences = { ...settings.preferences.toObject(), ...req.body.preferences };
    }
    if (req.body.financialYear) {
      settings.financialYear = { ...settings.financialYear.toObject(), ...req.body.financialYear };
    }
    
    // Update other fields
    Object.keys(req.body).forEach(key => {
      if (!['numberSeries', 'invoiceFormat', 'challanFormat', 'terms', 'preferences', 'financialYear', 'user'].includes(key)) {
        settings[key] = req.body[key];
      }
    });
    
    settings.updatedAt = new Date();
    await settings.save();
    
    res.json({
      success: true,
      exists: true,
      data: settings,
      financialYear: settings.getCurrentFinancialYear(),
      message: 'Company settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================
// Number Series Management (All Protected)
// ============================================

router.get('/next-numbers', authenticate, async (req, res) => {
  try {
    const settings = await CompanySettings.findOne({ user: req.userId });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
    await settings.autoResetIfNeeded();
    
    const previewInvoice = settings.getNextInvoiceNumber();
    const previewChallan = settings.getNextChallanNumber();
    const previewPurchase = settings.getNextPurchaseNumber();
    
    settings.numberSeries.invoiceCurrentNumber -= 1;
    settings.numberSeries.challanCurrentNumber -= 1;
    settings.numberSeries.purchaseCurrentNumber -= 1;
    
    res.json({
      success: true,
      data: {
        nextInvoice: previewInvoice,
        nextChallan: previewChallan,
        nextPurchase: previewPurchase,
        currentNumbers: {
          invoice: settings.numberSeries.invoiceCurrentNumber,
          challan: settings.numberSeries.challanCurrentNumber,
          purchase: settings.numberSeries.purchaseCurrentNumber
        },
        resetInfo: {
          invoice: {
            mode: settings.numberSeries.invoiceResetMode,
            lastReset: settings.numberSeries.invoiceLastReset,
            shouldReset: settings.shouldResetNumberSeries('invoice')
          },
          challan: {
            mode: settings.numberSeries.challanResetMode,
            lastReset: settings.numberSeries.challanLastReset,
            shouldReset: settings.shouldResetNumberSeries('challan')
          },
          purchase: {
            mode: settings.numberSeries.purchaseResetMode,
            lastReset: settings.numberSeries.purchaseLastReset,
            shouldReset: settings.shouldResetNumberSeries('purchase')
          }
        }
      },
      financialYear: settings.getCurrentFinancialYear()
    });
  } catch (error) {
    console.error('Error getting next numbers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/generate-invoice-number', authenticate, async (req, res) => {
  try {
    const settings = await CompanySettings.findOne({ user: req.userId });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
    await settings.autoResetIfNeeded();
    
    const number = settings.getNextInvoiceNumber();
    await settings.save();
    
    res.json({
      success: true,
      data: { number }
    });
  } catch (error) {
    console.error('Error generating invoice number:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/generate-challan-number', authenticate, async (req, res) => {
  try {
    const settings = await CompanySettings.findOne({ user: req.userId });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
    await settings.autoResetIfNeeded();
    
    const number = settings.getNextChallanNumber();
    await settings.save();
    
    res.json({
      success: true,
      data: { number }
    });
  } catch (error) {
    console.error('Error generating challan number:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/generate-purchase-number', authenticate, async (req, res) => {
  try {
    const settings = await CompanySettings.findOne({ user: req.userId });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
    await settings.autoResetIfNeeded();
    
    const number = settings.getNextPurchaseNumber();
    await settings.save();
    
    res.json({
      success: true,
      data: { number }
    });
  } catch (error) {
    console.error('Error generating purchase number:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/reset-number-series', authenticate, async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!type || !['invoice', 'challan', 'purchase', 'all'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be invoice, challan, purchase, or all'
      });
    }
    
    const settings = await CompanySettings.findOne({ user: req.userId });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
    const backup = {
      invoice: settings.numberSeries.invoiceCurrentNumber,
      challan: settings.numberSeries.challanCurrentNumber,
      purchase: settings.numberSeries.purchaseCurrentNumber,
      resetDate: new Date()
    };
    
    if (type === 'all') {
      settings.manualResetNumberSeries('invoice');
      settings.manualResetNumberSeries('challan');
      settings.manualResetNumberSeries('purchase');
    } else {
      settings.manualResetNumberSeries(type);
    }
    
    await settings.save();
    
    res.json({
      success: true,
      message: `Number series reset successfully for: ${type}`,
      backup,
      newNumbers: {
        invoice: settings.numberSeries.invoiceCurrentNumber,
        challan: settings.numberSeries.challanCurrentNumber,
        purchase: settings.numberSeries.purchaseCurrentNumber
      }
    });
  } catch (error) {
    console.error('Error resetting number series:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/financial-year', authenticate, async (req, res) => {
  try {
    const settings = await CompanySettings.findOne({ user: req.userId });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
    const fyInfo = settings.getCurrentFinancialYear();
    
    res.json({
      success: true,
      data: fyInfo
    });
  } catch (error) {
    console.error('Error getting financial year:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete company settings (for current user only)
router.delete('/', authenticate, async (req, res) => {
  try {
    await CompanySettings.deleteOne({ user: req.userId });
    res.json({ 
      success: true,
      message: 'Company settings deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting company settings:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;