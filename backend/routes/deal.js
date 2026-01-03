// backend/routes/deal.js - UPDATED WITH SECURITY
const express = require('express');
const router = express.Router();
const Deal = require('../models/Deal');
const Party = require('../models/Party');
const Quality = require('../models/Quality');
const DeliveryChallan = require('../models/DeliveryChallan');
const { authenticate } = require('../middleware/auth');
const { 
  secureCreate, 
  secureUpdate, 
  verifyOwnership,
  verifyRelatedOwnership 
} = require('../middleware/dataAccess');

// ============================================
// ALL ROUTES PROTECTED WITH AUTHENTICATION
// ============================================

// Get next deal number (for current user)
router.get('/next-deal-number', authenticate, async (req, res) => {
  try {
    const lastDeal = await Deal.findOne({ user: req.userId }).sort({ dealNumber: -1 });
    const nextDealNumber = lastDeal ? lastDeal.dealNumber + 1 : 1;
    res.json({ nextDealNumber });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all deals (only user's own deals)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, party, quality } = req.query;
    
    const filter = { user: req.userId }; // CRITICAL: Filter by user
    if (status) filter.status = status;
    if (party) filter.party = party;
    if (quality) filter.quality = quality;
    
    const deals = await Deal.find(filter)
      .populate('party')
      .populate('quality')
      .sort({ createdAt: -1 });
    
    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active deals (only user's own)
router.get('/active', authenticate, async (req, res) => {
  try {
    const deals = await Deal.find({ 
      user: req.userId, // CRITICAL: Filter by user
      status: 'active' 
    })
      .populate('party')
      .populate('quality')
      .sort({ createdAt: -1 });
    
    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single deal by ID (with ownership verification)
router.get('/:id', authenticate, verifyOwnership(Deal), async (req, res) => {
  try {
    const deal = await Deal.findOne({ 
      _id: req.params.id,
      user: req.userId // CRITICAL: Ensure ownership
    })
      .populate('party')
      .populate('quality')
      .populate('challanIds')
      .populate('invoiceIds');
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available challans for a deal
router.get('/:id/available-challans', authenticate, verifyOwnership(Deal), async (req, res) => {
  try {
    const deal = await Deal.findOne({ 
      _id: req.params.id,
      user: req.userId 
    });
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    // Get complete challans for this deal's quality that are not sold
    // CRITICAL: Only user's own challans
    const challans = await DeliveryChallan.find({
      user: req.userId, // CRITICAL: User's own challans only
      quality: deal.quality,
      status: 'complete',
      isSold: false
    }).sort({ createdAt: -1 });
    
    res.json(challans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new deal
router.post('/', 
  authenticate, 
  secureCreate,
  verifyRelatedOwnership(Party, 'party'),
  verifyRelatedOwnership(Quality, 'quality'),
  async (req, res) => {
    try {
      const { party, quality, ratePerMeter, totalBilties, notes } = req.body;
      
      // Validation
      if (!party || !quality || !ratePerMeter || !totalBilties) {
        return res.status(400).json({ 
          message: 'Party, Quality, Rate per Meter, and Total Bilties are required' 
        });
      }
      
      if (ratePerMeter <= 0) {
        return res.status(400).json({ message: 'Rate per meter must be positive' });
      }
      
      if (totalBilties <= 0) {
        return res.status(400).json({ message: 'Total bilties must be at least 1' });
      }
      
      // Fetch party and quality details (already verified to belong to user)
      const partyDoc = await Party.findOne({ _id: party, user: req.userId });
      const qualityDoc = await Quality.findOne({ _id: quality, user: req.userId });
      
      if (!partyDoc || !qualityDoc) {
        return res.status(404).json({ message: 'Party or Quality not found' });
      }
      
      // Get next deal number for this user
      const lastDeal = await Deal.findOne({ user: req.userId }).sort({ dealNumber: -1 });
      const dealNumber = lastDeal ? lastDeal.dealNumber + 1 : 1;
      
      // Create deal
      const deal = new Deal({
        user: req.userId, // CRITICAL: Set user
        dealNumber,
        party,
        partyDetails: {
          name: partyDoc.name,
          address: partyDoc.address,
          gstNumber: partyDoc.gstNumber,
          state: partyDoc.state,
          stateCode: partyDoc.stateCode
        },
        quality,
        qualityDetails: {
          name: qualityDoc.name,
          hsnCode: qualityDoc.hsnCode,
          balesPerChallan: qualityDoc.balesPerChallan,
          piecesPerBale: qualityDoc.piecesPerBale
        },
        ratePerMeter,
        totalBilties,
        notes
      });
      
      const savedDeal = await deal.save();
      
      const populatedDeal = await Deal.findById(savedDeal._id)
        .populate('party')
        .populate('quality');
      
      res.status(201).json(populatedDeal);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Update deal
router.put('/:id', 
  authenticate, 
  secureUpdate,
  verifyOwnership(Deal),
  async (req, res) => {
    try {
      const deal = await Deal.findOne({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      if (deal.status === 'completed') {
        return res.status(400).json({ 
          message: 'Cannot modify completed deal' 
        });
      }
      
      const { ratePerMeter, totalBilties, notes, status } = req.body;
      
      if (ratePerMeter !== undefined) {
        if (ratePerMeter <= 0) {
          return res.status(400).json({ message: 'Rate per meter must be positive' });
        }
        deal.ratePerMeter = ratePerMeter;
      }
      
      if (totalBilties !== undefined) {
        if (totalBilties < deal.completedBilties) {
          return res.status(400).json({ 
            message: `Cannot set total bilties below completed bilties (${deal.completedBilties})` 
          });
        }
        deal.totalBilties = totalBilties;
      }
      
      if (notes !== undefined) deal.notes = notes;
      if (status !== undefined) deal.status = status;
      
      const updatedDeal = await deal.save();
      
      const populatedDeal = await Deal.findById(updatedDeal._id)
        .populate('party')
        .populate('quality');
      
      res.json(populatedDeal);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Link challan to deal
router.post('/:id/link-challan', 
  authenticate,
  verifyOwnership(Deal),
  async (req, res) => {
    try {
      const { challanId } = req.body;
      
      const deal = await Deal.findOne({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      if (deal.status !== 'active') {
        return res.status(400).json({ 
          message: 'Can only link challans to active deals' 
        });
      }
      
      // Verify challan belongs to user
      const challan = await DeliveryChallan.findOne({ 
        _id: challanId,
        user: req.userId 
      });
      
      if (!challan) {
        return res.status(404).json({ message: 'Challan not found or access denied' });
      }
      
      if (challan.quality.toString() !== deal.quality.toString()) {
        return res.status(400).json({ 
          message: 'Challan quality does not match deal quality' 
        });
      }
      
      if (!deal.challanIds.includes(challanId)) {
        deal.challanIds.push(challanId);
        
        // Increment completed bilties if challan is complete
        if (challan.status === 'complete') {
          deal.completedBilties += 1;
        }
        
        await deal.save();
      }
      
      const populatedDeal = await Deal.findById(deal._id)
        .populate('party')
        .populate('quality');
      
      res.json(populatedDeal);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete deal
router.delete('/:id', 
  authenticate,
  verifyOwnership(Deal),
  async (req, res) => {
    try {
      const deal = await Deal.findOne({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      if (deal.invoiceIds.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete deal with associated invoices' 
        });
      }
      
      if (deal.challanIds.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete deal with associated challans. Cancel it instead.' 
        });
      }
      
      await Deal.findOneAndDelete({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      res.json({ message: 'Deal deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;