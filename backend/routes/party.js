//backend/routes/party.js
const express = require('express');
const router = express.Router();
const Party = require('../models/Party');
const { initCaptcha, searchGST } = require('../gstScraper');

// Get all parties
router.get('/', async (req, res) => {
  try {
    const parties = await Party.find().sort({ createdAt: -1 });
    res.json(parties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize CAPTCHA for GST verification
router.get('/gst/init-captcha', async (req, res) => {
  try {
    const result = await initCaptcha();
    res.json(result);
  } catch (error) {
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
    res.status(500).json({
      success: false,
      error: 'Failed to verify GST'
    });
  }
});

// Create party
router.post('/', async (req, res) => {
  try {
    const party = new Party(req.body);
    const savedParty = await party.save();
    res.status(201).json(savedParty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update party
router.put('/:id', async (req, res) => {
  try {
    const party = await Party.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(party);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete party
router.delete('/:id', async (req, res) => {
  try {
    await Party.findByIdAndDelete(req.params.id);
    res.json({ message: 'Party deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;