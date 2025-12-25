const express = require('express');
const router = express.Router();
const DeliveryChallan = require('../models/DeliveryChallan');

// Get stock by quality
router.get('/:qualityId', async (req, res) => {
  try {
    const challans = await DeliveryChallan.find({ 
      quality: req.params.qualityId,
      isSold: false 
    }).populate('quality');

    const stock = challans.flatMap(challan => 
      challan.bales.map(bale => ({
        challanId: challan._id,
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
});

module.exports = router;