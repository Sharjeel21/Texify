// backend/routes/quality.js - SECURED
const express = require('express');
const router = express.Router();
const Quality = require('../models/Quality');
const { authenticate } = require('../middleware/auth');
const { 
  secureCreate, 
  secureUpdate, 
  verifyOwnership 
} = require('../middleware/dataAccess');

// ============================================
// ALL ROUTES PROTECTED WITH AUTHENTICATION
// ============================================

// Get all qualities (user's own only)
router.get('/', authenticate, async (req, res) => {
  try {
    const qualities = await Quality.find({ user: req.userId })
      .sort({ createdAt: -1 });
    res.json(qualities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single quality by ID
router.get('/:id', authenticate, verifyOwnership(Quality), async (req, res) => {
  try {
    const quality = await Quality.findOne({ 
      _id: req.params.id,
      user: req.userId 
    });
    
    if (!quality) {
      return res.status(404).json({ message: 'Quality not found' });
    }
    
    res.json(quality);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create quality
router.post('/', authenticate, secureCreate, async (req, res) => {
  try {
    const quality = new Quality({
      ...req.body,
      user: req.userId // CRITICAL: Set user
    });
    
    const savedQuality = await quality.save();
    
    console.log(`✅ Quality created: ${quality.name} by user ${req.userId}`);
    res.status(201).json(savedQuality);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update quality
router.put('/:id', 
  authenticate, 
  secureUpdate,
  verifyOwnership(Quality),
  async (req, res) => {
    try {
      const quality = await Quality.findOne({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      if (!quality) {
        return res.status(404).json({ message: 'Quality not found' });
      }
      
      // Update fields (excluding user field)
      Object.keys(req.body).forEach(key => {
        if (key !== 'user') {
          quality[key] = req.body[key];
        }
      });
      
      await quality.save();
      
      console.log(`✅ Quality updated: ${quality.name} by user ${req.userId}`);
      res.json(quality);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete quality
router.delete('/:id', 
  authenticate,
  verifyOwnership(Quality),
  async (req, res) => {
    try {
      await Quality.findOneAndDelete({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      console.log(`✅ Quality deleted by user ${req.userId}`);
      res.json({ message: 'Quality deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;