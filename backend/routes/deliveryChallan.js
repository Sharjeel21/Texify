//backend/routes/del
const express = require('express');
const router = express.Router();
const DeliveryChallan = require('../models/DeliveryChallan');
const Quality = require('../models/Quality');
const Deal = require('../models/Deal');
const mongoose = require('mongoose');

// Get all delivery challans
router.get('/', async (req, res) => {
  try {
    const challans = await DeliveryChallan.find().populate('quality').sort({ createdAt: -1 });
    res.json(challans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get challans by quality
router.get('/by-quality/:qualityId', async (req, res) => {
  try {
    const challans = await DeliveryChallan.find({ 
      quality: req.params.qualityId
    }).populate('quality').sort({ createdAt: -1 });
    res.json(challans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get incomplete challans by quality
router.get('/incomplete/:qualityId', async (req, res) => {
  try {
    const challans = await DeliveryChallan.find({ 
      quality: req.params.qualityId,
      status: 'incomplete',
      isSold: false
    }).populate('quality').sort({ createdAt: -1 });
    res.json(challans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available challans for billing (complete and not sold)
router.get('/available/:qualityId', async (req, res) => {
  try {
    const challans = await DeliveryChallan.find({ 
      quality: req.params.qualityId,
      status: 'complete',
      isSold: false
    }).populate('quality').sort({ createdAt: -1 });
    res.json(challans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single challan by ID
router.get('/:id', async (req, res) => {
  try {
    const challan = await DeliveryChallan.findById(req.params.id).populate('quality');
    if (!challan) {
      return res.status(404).json({ message: 'Delivery challan not found' });
    }
    res.json(challan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new delivery challan (with optional deal linkage)
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { quality, dealId } = req.body;
    
    const qualityDoc = await Quality.findById(quality).session(session);
    if (!qualityDoc) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Quality not found' });
    }

    // Use atomic increment for challan number
    const updatedQuality = await Quality.findByIdAndUpdate(
      quality,
      { $inc: { currentChallanNumber: 1 } },
      { new: true, session }
    );

    const challan = new DeliveryChallan({
      challanNumber: updatedQuality.currentChallanNumber,
      quality: quality,
      qualityName: qualityDoc.name,
      expectedBalesCount: qualityDoc.balesPerChallan,
      expectedPiecesPerBale: qualityDoc.piecesPerBale,
      bales: [],
      status: 'incomplete'
    });

    const savedChallan = await challan.save({ session });
    
    // If dealId provided, link the challan to the deal
    if (dealId) {
      const deal = await Deal.findById(dealId).session(session);
      
      if (!deal) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      if (deal.quality.toString() !== quality.toString()) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: 'Challan quality does not match deal quality' 
        });
      }
      
      if (deal.status !== 'active') {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: 'Deal is not active' 
        });
      }
      
      deal.challanIds.push(savedChallan._id);
      await deal.save({ session });
    }
    
    await session.commitTransaction();
    res.status(201).json(savedChallan);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// Add bales to existing challan
router.post('/:id/add-bales', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { bales, dealId } = req.body;
    
    const challan = await DeliveryChallan.findById(req.params.id)
      .populate('quality')
      .session(session);
      
    if (!challan) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Delivery challan not found' });
    }

    if (challan.isSold) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot modify sold challan' });
    }

    const qualityDoc = await Quality.findById(challan.quality._id).session(session);

    // Process and add new bales with atomic bale number generation
    const processedBales = [];
    
    for (const bale of bales) {
      // Use atomic increment for bale number
      const updatedQuality = await Quality.findByIdAndUpdate(
        challan.quality._id,
        { $inc: { currentBaleNumber: 1 } },
        { new: true, session }
      );

      const totalMeter = bale.cloths.reduce((sum, cloth) => sum + (parseFloat(cloth.meter) || 0), 0);
      const totalWeight = bale.cloths.reduce((sum, cloth) => sum + (parseFloat(cloth.weight) || 0), 0);
      const numberOfPieces = bale.cloths.length;
      
      processedBales.push({
        baleNumber: updatedQuality.currentBaleNumber,
        date: bale.date,
        cloths: bale.cloths,
        totalMeter,
        totalWeight,
        numberOfPieces
      });
    }

    // Add new bales
    challan.bales.push(...processedBales);
    
    const previousStatus = challan.status;
    await challan.save({ session });
    
    // If challan just became complete and linked to a deal, update deal
    if (previousStatus === 'incomplete' && challan.status === 'complete' && dealId) {
      const deal = await Deal.findById(dealId).session(session);
      if (deal && deal.challanIds.includes(challan._id)) {
        deal.completedBilties += 1;
        await deal.save({ session });
      }
    }

    await session.commitTransaction();
    
    const updatedChallan = await DeliveryChallan.findById(req.params.id).populate('quality');
    res.json(updatedChallan);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// Update specific bale
router.put('/:id/bales/:baleId', async (req, res) => {
  try {
    const { baleId } = req.params;
    const { date, cloths } = req.body;
    
    const challan = await DeliveryChallan.findById(req.params.id);
    if (!challan) {
      return res.status(404).json({ message: 'Delivery challan not found' });
    }

    if (challan.isSold) {
      return res.status(400).json({ message: 'Cannot modify sold challan' });
    }

    const bale = challan.bales.id(baleId);
    if (!bale) {
      return res.status(404).json({ message: 'Bale not found' });
    }

    bale.date = date;
    bale.cloths = cloths;
    bale.totalMeter = cloths.reduce((sum, cloth) => sum + (parseFloat(cloth.meter) || 0), 0);
    bale.totalWeight = cloths.reduce((sum, cloth) => sum + (parseFloat(cloth.weight) || 0), 0);
    bale.numberOfPieces = cloths.length;

    await challan.save();

    const updatedChallan = await DeliveryChallan.findById(req.params.id).populate('quality');
    res.json(updatedChallan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete specific bale
router.delete('/:id/bales/:baleId', async (req, res) => {
  try {
    const { baleId } = req.params;
    
    const challan = await DeliveryChallan.findById(req.params.id);
    if (!challan) {
      return res.status(404).json({ message: 'Delivery challan not found' });
    }

    if (challan.isSold) {
      return res.status(400).json({ message: 'Cannot modify sold challan' });
    }

    challan.bales.pull(baleId);
    await challan.save();

    const updatedChallan = await DeliveryChallan.findById(req.params.id).populate('quality');
    res.json(updatedChallan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete delivery challan
router.delete('/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const challan = await DeliveryChallan.findById(req.params.id).session(session);
    
    if (challan && challan.isSold) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot delete sold challan' });
    }

    // Remove from any associated deals
    await Deal.updateMany(
      { challanIds: req.params.id },
      { 
        $pull: { challanIds: req.params.id },
        $inc: { completedBilties: challan?.status === 'complete' ? -1 : 0 }
      },
      { session }
    );

    await DeliveryChallan.findByIdAndDelete(req.params.id).session(session);
    
    await session.commitTransaction();
    res.json({ message: 'Delivery challan deleted' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;