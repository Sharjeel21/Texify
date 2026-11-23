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
  async (req, res) => {
    try {
      // Get unsold challans for this quality (user's own only)
      const challans = await DeliveryChallan.find({ 
        user: req.userId,
        quality: req.params.qualityId,
        isSold: false 
      }).lean();

      // Flatten bales into stock items
      const stock = challans.flatMap(challan => 
        (challan.bales || []).map(bale => ({
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
    const challans = await DeliveryChallan.find({ 
      user: req.userId,
      isSold: false 
    }).populate('quality', 'name hsnCode').lean();

    const summaryMap = new Map();

    for (const challan of challans) {
      if (!challan.bales || challan.bales.length === 0 || !challan.quality) continue;

      const qId = challan.quality._id.toString();
      if (!summaryMap.has(qId)) {
        summaryMap.set(qId, {
          qualityId: challan.quality._id,
          qualityName: challan.quality.name || challan.qualityName,
          hsnCode: challan.quality.hsnCode || '',
          totalBales: 0,
          totalPieces: 0,
          totalMeters: 0,
          totalWeight: 0,
          challansCount: 0
        });
      }

      const item = summaryMap.get(qId);
      item.challansCount += 1;
      item.totalBales += challan.bales.length;
      for (const bale of challan.bales) {
        item.totalPieces += (bale.numberOfPieces || 0);
        item.totalMeters += (bale.totalMeter || 0);
        item.totalWeight += (bale.totalWeight || 0);
      }
    }

    const stockSummary = Array.from(summaryMap.values()).map(item => ({
      ...item,
      totalMeters: parseFloat(item.totalMeters.toFixed(2)),
      totalWeight: parseFloat(item.totalWeight.toFixed(2))
    }));

    res.json(stockSummary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;