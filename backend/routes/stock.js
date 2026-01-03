// backend/routes/stock.js - SECURED
const express = require('express');
const router = express.Router();
const DeliveryChallan = require('../models/DeliveryChallan');
const Quality = require('../models/Quality');
const { authenticate } = require('../middleware/auth');
const { verifyRelatedOwnership } = require('../middleware/dataAccess');

// ============================================
// ALL ROUTES PROTECTED WITH AUTHENTICATION
// ============================================

// Get stock by quality (user's own stock only)
router.get('/:qualityId', 
  authenticate,
  verifyRelatedOwnership(Quality, 'qualityId'),
  async (req, res) => {
    try {
      // Verify quality belongs to user
      const quality = await Quality.findOne({ 
        _id: req.params.qualityId,
        user: req.userId 
      });
      
      if (!quality) {
        return res.status(404).json({ message: 'Quality not found' });
      }
      
      // Get unsold challans for this quality (user's own only)
      const challans = await DeliveryChallan.find({ 
        user: req.userId, // CRITICAL: Filter by user
        quality: req.params.qualityId,
        isSold: false 
      }).populate('quality');

      // Flatten bales into stock items
      const stock = challans.flatMap(challan => 
        challan.bales.map(bale => ({
          challanId: challan._id,
          challanNumber: challan.challanNumber,
          baleNumber: bale.baleNumber,
          date: bale.date,
          numberOfPieces: bale.numberOfPieces,
          totalMeter: bale.totalMeter,
          totalWeight: bale.totalWeight
        }))
      );

      res.json(stock);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get overall stock summary (all qualities for user)
router.get('/', authenticate, async (req, res) => {
  try {
    // Get all user's qualities
    const qualities = await Quality.find({ user: req.userId });
    
    const stockSummary = [];
    
    for (const quality of qualities) {
      // Get unsold challans for this quality
      const challans = await DeliveryChallan.find({ 
        user: req.userId,
        quality: quality._id,
        isSold: false 
      });

      let totalBales = 0;
      let totalPieces = 0;
      let totalMeters = 0;
      let totalWeight = 0;

      challans.forEach(challan => {
        totalBales += challan.bales.length;
        challan.bales.forEach(bale => {
          totalPieces += bale.numberOfPieces;
          totalMeters += bale.totalMeter;
          totalWeight += bale.totalWeight;
        });
      });

      if (totalBales > 0) {
        stockSummary.push({
          qualityId: quality._id,
          qualityName: quality.name,
          hsnCode: quality.hsnCode,
          totalBales,
          totalPieces,
          totalMeters: parseFloat(totalMeters.toFixed(2)),
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          challansCount: challans.length
        });
      }
    }

    res.json(stockSummary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;