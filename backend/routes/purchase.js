// backend/routes/purchase.js - SECURED
const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const PurchaseDelivery = require('../models/PurchaseDelivery');
const Party = require('../models/Party');
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

// Get all purchases (user's own only)
router.get('/', authenticate, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.userId })
      .populate('party')
      .sort({ purchaseDate: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single purchase by ID
router.get('/:id', authenticate, verifyOwnership(Purchase), async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ 
      _id: req.params.id,
      user: req.userId 
    }).populate('party');
    
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new purchase
router.post('/', 
  authenticate, 
  secureCreate,
  verifyRelatedOwnership(Party, 'party'),
  async (req, res) => {
    try {
      const partyDoc = await Party.findOne({ 
        _id: req.body.party,
        user: req.userId 
      });
      
      if (!partyDoc) {
        return res.status(404).json({ message: 'Party not found' });
      }

      // Get next purchase number for this user
      const lastPurchase = await Purchase.findOne({ user: req.userId })
        .sort({ purchaseNumber: -1 });
      const nextPurchaseNumber = lastPurchase ? lastPurchase.purchaseNumber + 1 : 1;

      const purchase = new Purchase({
        ...req.body,
        user: req.userId, // CRITICAL: Set user
        purchaseNumber: nextPurchaseNumber,
        partyName: partyDoc.name,
        totalActualWeight: 0,
        totalDeductedWeight: 0
      });

      const savedPurchase = await purchase.save();
      const populatedPurchase = await Purchase.findById(savedPurchase._id)
        .populate('party');
      
      console.log(`✅ Purchase created: ${purchase.purchaseNumber} by user ${req.userId}`);
      res.status(201).json(populatedPurchase);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Update purchase
router.put('/:id', 
  authenticate, 
  secureUpdate,
  verifyOwnership(Purchase),
  async (req, res) => {
    try {
      const purchase = await Purchase.findOne({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      if (!purchase) {
        return res.status(404).json({ message: 'Purchase not found' });
      }

      // Check if deliveries exist (only for this user's purchase)
      const deliveryCount = await PurchaseDelivery.countDocuments({ 
        purchase: req.params.id,
        user: req.userId 
      });
      
      if (deliveryCount > 0) {
        const restrictedFields = ['approxQuantity', 'ratePerKg', 'godownChargesPerKg'];
        const hasRestrictedChanges = restrictedFields.some(field => 
          req.body[field] !== undefined && req.body[field] !== purchase[field]
        );
        
        if (hasRestrictedChanges) {
          return res.status(400).json({ 
            message: 'Cannot change quantity, rate, or godown charges after deliveries are recorded.' 
          });
        }
      }

      // Update fields (excluding protected fields)
      Object.keys(req.body).forEach(key => {
        if (!['purchaseNumber', 'totalActualWeight', 'totalDeductedWeight', 'user'].includes(key)) {
          purchase[key] = req.body[key];
        }
      });

      await purchase.save();
      
      const updatedPurchase = await Purchase.findById(req.params.id)
        .populate('party');
      
      console.log(`✅ Purchase updated: ${purchase.purchaseNumber} by user ${req.userId}`);
      res.json(updatedPurchase);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete purchase
router.delete('/:id', 
  authenticate,
  verifyOwnership(Purchase),
  async (req, res) => {
    try {
      // Check if deliveries exist (only for this user's purchase)
      const deliveryCount = await PurchaseDelivery.countDocuments({ 
        purchase: req.params.id,
        user: req.userId 
      });
      
      if (deliveryCount > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete purchase with deliveries.' 
        });
      }

      await Purchase.findOneAndDelete({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      console.log(`✅ Purchase deleted by user ${req.userId}`);
      res.json({ message: 'Purchase deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;