// backend/routes/companySettings.js
const express = require('express');
const router = express.Router();
const CompanySettings = require('../models/CompanySettings');
const { initCaptcha, searchGST } = require('../gstScraper');

// ============================================
// GST Verification Routes
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
// Company Settings Routes
// ============================================

// Get company settings with auto-reset check
router.get('/', async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
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
router.post('/', async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
    if (settings) {
      // Update existing settings
      Object.assign(settings, req.body);
      settings.updatedAt = new Date();
      await settings.save();
      console.log('✅ Company settings updated successfully');
    } else {
      // Create new settings with defaults
      const defaultSettings = {
        ...req.body,
        numberSeries: req.body.numberSeries || {},
        invoiceFormat: req.body.invoiceFormat || {},
        challanFormat: req.body.challanFormat || {},
        terms: req.body.terms || { invoice: {}, challan: {} },
        preferences: req.body.preferences || {},
        financialYear: req.body.financialYear || {}
      };
      
      settings = new CompanySettings(defaultSettings);
      await settings.save();
      console.log('✅ Company settings created successfully');
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
router.patch('/', async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
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
      if (!['numberSeries', 'invoiceFormat', 'challanFormat', 'terms', 'preferences', 'financialYear'].includes(key)) {
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
// Number Series Management
// ============================================

// Get next document numbers (preview without incrementing)
router.get('/next-numbers', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
    // Check if auto-reset needed
    await settings.autoResetIfNeeded();
    
    // Generate preview numbers (without saving)
    const previewInvoice = settings.getNextInvoiceNumber();
    const previewChallan = settings.getNextChallanNumber();
    const previewPurchase = settings.getNextPurchaseNumber();
    
    // Decrement back to get current state
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

// Generate and increment invoice number
router.post('/generate-invoice-number', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    
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

// Generate and increment challan number
router.post('/generate-challan-number', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    
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

// Generate and increment purchase number
router.post('/generate-purchase-number', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    
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

// Manual reset number series
router.post('/reset-number-series', async (req, res) => {
  try {
    const { type } = req.body; // 'invoice', 'challan', 'purchase', or 'all'
    
    if (!type || !['invoice', 'challan', 'purchase', 'all'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be invoice, challan, purchase, or all'
      });
    }
    
    const settings = await CompanySettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
    // Store backup info before reset
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

// Get financial year info
router.get('/financial-year', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    
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

// Delete company settings (for testing)
router.delete('/', async (req, res) => {
  try {
    await CompanySettings.deleteOne({});
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