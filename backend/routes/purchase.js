// backend/routes/purchase.js
const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const PurchaseDelivery = require('../models/PurchaseDelivery');
const Party = require('../models/Party');

router.get('/', async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('party').sort({ purchaseDate: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('party');
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const partyDoc = await Party.findById(req.body.party);
    if (!partyDoc) {
      return res.status(404).json({ message: 'Party not found' });
    }

    const lastPurchase = await Purchase.findOne().sort({ purchaseNumber: -1 });
    const nextPurchaseNumber = lastPurchase ? lastPurchase.purchaseNumber + 1 : 1;

    const purchase = new Purchase({
      ...req.body,
      purchaseNumber: nextPurchaseNumber,
      partyName: partyDoc.name,
      totalActualWeight: 0,
      totalDeductedWeight: 0
    });

    const savedPurchase = await purchase.save();
    const populatedPurchase = await Purchase.findById(savedPurchase._id).populate('party');
    
    res.status(201).json(populatedPurchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const deliveryCount = await PurchaseDelivery.countDocuments({ purchase: req.params.id });
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

    Object.keys(req.body).forEach(key => {
      if (key !== 'purchaseNumber' && key !== 'totalActualWeight' && key !== 'totalDeductedWeight') {
        purchase[key] = req.body[key];
      }
    });

    await purchase.save();
    const updatedPurchase = await Purchase.findById(req.params.id).populate('party');
    res.json(updatedPurchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deliveryCount = await PurchaseDelivery.countDocuments({ purchase: req.params.id });
    if (deliveryCount > 0) {
      return res.status(400).json({ message: 'Cannot delete purchase with deliveries.' });
    }

    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;