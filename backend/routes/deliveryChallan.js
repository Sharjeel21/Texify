// backend/routes/deliveryChallan.js - FIXED Available Route
const express = require('express');
const router = express.Router();
const DeliveryChallan = require('../models/DeliveryChallan');
const Quality = require('../models/Quality');
const Deal = require('../models/Deal');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const { 
  secureCreate, 
  secureUpdate, 
  verifyOwnership,
  verifyRelatedOwnership 
} = require('../middleware/dataAccess');

// ============================================
// ALL ROUTES PROTECTED
// ============================================

// Get all delivery challans (user's own only)
router.get('/', authenticate, async (req, res) => {
  try {
    const challans = await DeliveryChallan.find({ user: req.userId })
      .populate('quality')
      .sort({ createdAt: -1 });
    res.json(challans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get challans by quality (user's own only)
router.get('/by-quality/:qualityId', 
  authenticate,
  async (req, res) => {
    try {
      // Verify quality belongs to user
      const quality = await Quality.findOne({ 
        _id: req.params.qualityId,
        user: req.userId 
      });
      
      if (!quality) {
        return res.status(404).json({ message: 'Quality not found or access denied' });
      }

      const challans = await DeliveryChallan.find({ 
        user: req.userId,
        quality: req.params.qualityId
      })
        .populate('quality')
        .sort({ createdAt: -1 });
      res.json(challans);
    } catch (error) {
      console.error('Error in by-quality route:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Get incomplete challans by quality
router.get('/incomplete/:qualityId', 
  authenticate,
  async (req, res) => {
    try {
      // Verify quality belongs to user
      const quality = await Quality.findOne({ 
        _id: req.params.qualityId,
        user: req.userId 
      });
      
      if (!quality) {
        return res.status(404).json({ message: 'Quality not found or access denied' });
      }

      const challans = await DeliveryChallan.find({ 
        user: req.userId,
        quality: req.params.qualityId,
        status: 'incomplete',
        isSold: false
      })
        .populate('quality')
        .sort({ createdAt: -1 });
      res.json(challans);
    } catch (error) {
      console.error('Error in incomplete route:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Get available challans for billing (complete and not sold) - FIXED
router.get('/available/:qualityId', 
  authenticate,
  async (req, res) => {
    try {
      console.log('Fetching available challans for quality:', req.params.qualityId);
      console.log('User ID:', req.userId);
      
      // Validate qualityId
      if (!mongoose.Types.ObjectId.isValid(req.params.qualityId)) {
        return res.status(400).json({ message: 'Invalid quality ID format' });
      }

      // Verify quality exists and belongs to user
      const quality = await Quality.findOne({ 
        _id: req.params.qualityId,
        user: req.userId 
      });
      
      if (!quality) {
        console.log('Quality not found for ID:', req.params.qualityId);
        return res.status(404).json({ message: 'Quality not found or access denied' });
      }

      console.log('Quality found:', quality.name);

      // Find available challans
      const challans = await DeliveryChallan.find({ 
        user: req.userId,
        quality: req.params.qualityId,
        status: 'complete',
        isSold: false
      })
        .populate('quality')
        .sort({ createdAt: -1 });
      
      console.log(`Found ${challans.length} available challans`);
      res.json(challans);
    } catch (error) {
      console.error('Error in available route:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// Get single challan by ID
router.get('/:id', authenticate, verifyOwnership(DeliveryChallan), async (req, res) => {
  try {
    const challan = await DeliveryChallan.findOne({ 
      _id: req.params.id,
      user: req.userId 
    }).populate('quality');
    
    if (!challan) {
      return res.status(404).json({ message: 'Delivery challan not found' });
    }
    res.json(challan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new delivery challan (with optional deal linkage)
router.post('/', 
  authenticate, 
  secureCreate,
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { quality, dealId } = req.body;
      
      const qualityDoc = await Quality.findOne({ 
        _id: quality, 
        user: req.userId 
      }).session(session);
      
      if (!qualityDoc) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Quality not found' });
      }

      // Use atomic increment for challan number
      const updatedQuality = await Quality.findOneAndUpdate(
        { _id: quality, user: req.userId },
        { $inc: { currentChallanNumber: 1 } },
        { new: true, session }
      );

      const challan = new DeliveryChallan({
        user: req.userId,
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
        const deal = await Deal.findOne({ 
          _id: dealId, 
          user: req.userId 
        }).session(session);
        
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
      console.log(`✅ Challan created: ${savedChallan.challanNumber} by user ${req.userId}`);
      res.status(201).json(savedChallan);
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({ message: error.message });
    } finally {
      session.endSession();
    }
  }
);

// Add bales to existing challan
router.post('/:id/add-bales', 
  authenticate,
  verifyOwnership(DeliveryChallan),
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { bales, dealId } = req.body;
      
      const challan = await DeliveryChallan.findOne({ 
        _id: req.params.id,
        user: req.userId 
      })
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

      const qualityDoc = await Quality.findOne({ 
        _id: challan.quality._id,
        user: req.userId 
      }).session(session);

      // Process and add new bales with atomic bale number generation
      const processedBales = [];
      
      for (const bale of bales) {
        // Use atomic increment for bale number
        const updatedQuality = await Quality.findOneAndUpdate(
          { _id: challan.quality._id, user: req.userId },
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
      
      console.log(`Challan status after save: ${challan.status}`);
      console.log(`Bales count: ${challan.bales.length}/${challan.expectedBalesCount}`);
      
      // If challan just became complete and linked to a deal, update deal
      if (previousStatus === 'incomplete' && challan.status === 'complete' && dealId) {
        const deal = await Deal.findOne({ 
          _id: dealId,
          user: req.userId 
        }).session(session);
        
        if (deal && deal.challanIds.includes(challan._id)) {
          deal.completedBilties += 1;
          await deal.save({ session });
        }
      }

      await session.commitTransaction();
      
      const updatedChallan = await DeliveryChallan.findOne({ 
        _id: req.params.id,
        user: req.userId 
      }).populate('quality');
      
      console.log(`✅ Bales added to challan ${challan.challanNumber} by user ${req.userId}`);
      res.json(updatedChallan);
    } catch (error) {
      await session.abortTransaction();
      console.error('Error adding bales:', error);
      res.status(400).json({ message: error.message });
    } finally {
      session.endSession();
    }
  }
);

// Update specific bale
router.put('/:id/bales/:baleId', 
  authenticate,
  verifyOwnership(DeliveryChallan),
  async (req, res) => {
    try {
      const { baleId } = req.params;
      const { date, cloths } = req.body;
      
      const challan = await DeliveryChallan.findOne({ 
        _id: req.params.id,
        user: req.userId 
      });
      
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

      const updatedChallan = await DeliveryChallan.findOne({ 
        _id: req.params.id,
        user: req.userId 
      }).populate('quality');
      
      res.json(updatedChallan);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete specific bale
router.delete('/:id/bales/:baleId', 
  authenticate,
  verifyOwnership(DeliveryChallan),
  async (req, res) => {
    try {
      const { baleId } = req.params;
      
      const challan = await DeliveryChallan.findOne({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      if (!challan) {
        return res.status(404).json({ message: 'Delivery challan not found' });
      }

      if (challan.isSold) {
        return res.status(400).json({ message: 'Cannot modify sold challan' });
      }

      challan.bales.pull(baleId);
      await challan.save();

      const updatedChallan = await DeliveryChallan.findOne({ 
        _id: req.params.id,
        user: req.userId 
      }).populate('quality');
      
      res.json(updatedChallan);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete delivery challan
router.delete('/:id', 
  authenticate,
  verifyOwnership(DeliveryChallan),
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const challan = await DeliveryChallan.findOne({ 
        _id: req.params.id,
        user: req.userId 
      }).session(session);
      
      if (!challan) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Challan not found' });
      }
      
      if (challan.isSold) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Cannot delete sold challan' });
      }

      // Remove from any associated deals (user's own deals only)
      await Deal.updateMany(
        { 
          user: req.userId,
          challanIds: req.params.id 
        },
        { 
          $pull: { challanIds: req.params.id },
          $inc: { completedBilties: challan?.status === 'complete' ? -1 : 0 }
        },
        { session }
      );

      await DeliveryChallan.findOneAndDelete({ 
        _id: req.params.id,
        user: req.userId 
      }).session(session);
      
      await session.commitTransaction();
      console.log(`✅ Challan deleted by user ${req.userId}`);
      res.json({ message: 'Delivery challan deleted' });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ message: error.message });
    } finally {
      session.endSession();
    }
  }
);

module.exports = router;