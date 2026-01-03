// backend/routes/party.js - SECURED
const express = require('express');
const router = express.Router();
const Party = require('../models/Party');
const { initCaptcha, searchGST } = require('../gstScraper');
const { authenticate } = require('../middleware/auth');
const { 
  secureCreate, 
  secureUpdate, 
  verifyOwnership 
} = require('../middleware/dataAccess');

// ============================================
// GST Verification Routes (No auth needed)
// ============================================
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

// ============================================
// PROTECTED ROUTES
// ============================================

// Get all parties (user's own only)
router.get('/', authenticate, async (req, res) => {
  try {
    const parties = await Party.find({ user: req.userId })
      .sort({ createdAt: -1 });
    res.json(parties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single party
router.get('/:id', authenticate, verifyOwnership(Party), async (req, res) => {
  try {
    const party = await Party.findOne({ 
      _id: req.params.id,
      user: req.userId 
    });
    
    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }
    
    res.json(party);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create party
router.post('/', authenticate, secureCreate, async (req, res) => {
  try {
    // Check for duplicate GST number for this user
    if (req.body.gstNumber) {
      const existingParty = await Party.findOne({ 
        user: req.userId,
        gstNumber: req.body.gstNumber 
      });
      
      if (existingParty) {
        return res.status(400).json({ 
          message: 'A party with this GST number already exists' 
        });
      }
    }
    
    const party = new Party(req.body);
    const savedParty = await party.save();
    
    console.log(`✅ Party created: ${party.name} by user ${req.userId}`);
    
    res.status(201).json(savedParty);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'A party with this GST number already exists' 
      });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update party
router.put('/:id', 
  authenticate, 
  secureUpdate,
  verifyOwnership(Party),
  async (req, res) => {
    try {
      const party = await Party.findOne({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      if (!party) {
        return res.status(404).json({ message: 'Party not found' });
      }
      
      // Check for duplicate GST if changing it
      if (req.body.gstNumber && req.body.gstNumber !== party.gstNumber) {
        const duplicateParty = await Party.findOne({ 
          user: req.userId,
          gstNumber: req.body.gstNumber,
          _id: { $ne: req.params.id }
        });
        
        if (duplicateParty) {
          return res.status(400).json({ 
            message: 'A party with this GST number already exists' 
          });
        }
      }
      
      Object.assign(party, req.body);
      await party.save();
      
      console.log(`✅ Party updated: ${party.name} by user ${req.userId}`);
      
      res.json(party);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ 
          message: 'A party with this GST number already exists' 
        });
      }
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete party
router.delete('/:id', 
  authenticate,
  verifyOwnership(Party),
  async (req, res) => {
    try {
      await Party.findOneAndDelete({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      console.log(`✅ Party deleted by user ${req.userId}`);
      
      res.json({ message: 'Party deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;