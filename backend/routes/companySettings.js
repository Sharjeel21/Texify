// backend/routes/companySettings.js
const express = require('express');
const router = express.Router();
const CompanySettings = require('../models/CompanySettings');
const { initCaptcha, searchGST } = require('../gstScraper');

// ============================================
// GST Verification Routes (with CAPTCHA)
// ============================================

// Initialize CAPTCHA for GST verification
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

// Verify GST with CAPTCHA
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

// Get company settings
router.get('/', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    
    if (!settings) {
      return res.json({
        exists: false,
        data: null
      });
    }
    
    res.json({
      exists: true,
      data: settings
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
        preferences: req.body.preferences || {}
      };
      
      settings = new CompanySettings(defaultSettings);
      await settings.save();
      console.log('✅ Company settings created successfully');
    }
    
    res.json({
      success: true,
      exists: true,
      data: settings,
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
      settings.numberSeries = { ...settings.numberSeries, ...req.body.numberSeries };
    }
    if (req.body.invoiceFormat) {
      settings.invoiceFormat = { ...settings.invoiceFormat, ...req.body.invoiceFormat };
    }
    if (req.body.challanFormat) {
      settings.challanFormat = { ...settings.challanFormat, ...req.body.challanFormat };
    }
    if (req.body.terms) {
      settings.terms = { ...settings.terms, ...req.body.terms };
    }
    if (req.body.preferences) {
      settings.preferences = { ...settings.preferences, ...req.body.preferences };
    }
    
    // Update other fields
    Object.keys(req.body).forEach(key => {
      if (!['numberSeries', 'invoiceFormat', 'challanFormat', 'terms', 'preferences'].includes(key)) {
        settings[key] = req.body[key];
      }
    });
    
    settings.updatedAt = new Date();
    await settings.save();
    
    res.json({
      success: true,
      exists: true,
      data: settings,
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

// Get next document numbers
router.get('/next-numbers', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        nextInvoice: settings.getNextInvoiceNumber(),
        nextChallan: settings.getNextChallanNumber(),
        nextPurchase: settings.getNextPurchaseNumber()
      }
    });
  } catch (error) {
    console.error('Error getting next numbers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Increment and get next invoice number
router.post('/generate-invoice-number', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
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

// Increment and get next challan number
router.post('/generate-challan-number', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
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

// Increment and get next purchase number
router.post('/generate-purchase-number', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
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

// Reset yearly counters (to be called by a cron job on Jan 1st)
router.post('/reset-yearly-counters', async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Company settings not found'
      });
    }
    
    settings.resetYearlyCounters();
    await settings.save();
    
    res.json({
      success: true,
      message: 'Yearly counters reset successfully'
    });
  } catch (error) {
    console.error('Error resetting yearly counters:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete company settings (optional - for testing)
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