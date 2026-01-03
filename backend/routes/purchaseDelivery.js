// backend/routes/purchaseDelivery.js - SECURED
const express = require('express');
const router = express.Router();
const PurchaseDelivery = require('../models/PurchaseDelivery');
const Purchase = require('../models/Purchase');
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

// Get all deliveries (user's own only)
router.get('/', authenticate, async (req, res) => {
  try {
    const deliveries = await PurchaseDelivery.find({ user: req.userId })
      .populate({ 
        path: 'purchase', 
        populate: { path: 'party' } 
      })
      .sort({ deliveryDate: -1 });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get deliveries by purchase (user's own only)
router.get('/by-purchase/:purchaseId', 
  authenticate,
  verifyRelatedOwnership(Purchase, 'purchaseId'),
  async (req, res) => {
    try {
      const deliveries = await PurchaseDelivery.find({ 
        user: req.userId,
        purchase: req.params.purchaseId 
      })
        .populate({ 
          path: 'purchase', 
          populate: { path: 'party' } 
        })
        .sort({ deliveryDate: -1 });
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get single delivery by ID
router.get('/:id', authenticate, verifyOwnership(PurchaseDelivery), async (req, res) => {
  try {
    const delivery = await PurchaseDelivery.findOne({ 
      _id: req.params.id,
      user: req.userId 
    })
      .populate({ 
        path: 'purchase', 
        populate: { path: 'party' } 
      });
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create purchase delivery
router.post('/', 
  authenticate, 
  secureCreate,
  verifyRelatedOwnership(Purchase, 'purchase'),
  async (req, res) => {
    try {
      const { purchase: purchaseId, actualWeight, deductFromDeal, deliveryDate } = req.body;
      
      const purchase = await Purchase.findOne({ 
        _id: purchaseId,
        user: req.userId 
      });
      
      if (!purchase) {
        return res.status(404).json({ message: 'Purchase not found' });
      }

      // Convert to numbers
      const actualWeightNum = parseFloat(actualWeight);
      const deductFromDealNum = parseFloat(deductFromDeal);

      if (isNaN(actualWeightNum) || actualWeightNum <= 0) {
        return res.status(400).json({ message: 'Invalid actual weight' });
      }

      if (isNaN(deductFromDealNum) || deductFromDealNum <= 0) {
        return res.status(400).json({ message: 'Invalid deduct amount' });
      }

      const remainingQty = purchase.remainingApproxQuantity || 0;
      if (deductFromDealNum > remainingQty + 0.001) {
        return res.status(400).json({ 
          message: `Deduct amount (${deductFromDealNum}T) exceeds remaining (${remainingQty.toFixed(3)}T)` 
        });
      }

      // Get next delivery number for this user
      const lastDelivery = await PurchaseDelivery.findOne({ 
        user: req.userId,
        purchase: purchaseId 
      }).sort({ deliveryNumber: -1 });
      
      const nextDeliveryNumber = lastDelivery ? lastDelivery.deliveryNumber + 1 : 1;

      const deliveryDateObj = new Date(deliveryDate);
      const paymentDueDate = new Date(deliveryDateObj);
      paymentDueDate.setDate(paymentDueDate.getDate() + purchase.paymentDays);

      const delivery = new PurchaseDelivery({
        user: req.userId, // CRITICAL: Set user
        purchase: purchaseId,
        deliveryNumber: nextDeliveryNumber,
        deliveryDate,
        actualWeight: actualWeightNum,
        deductFromDeal: deductFromDealNum,
        ratePerKg: purchase.ratePerKg,
        godownChargesPerKg: purchase.godownChargesPerKg || 0,
        paymentDueDate,
        supplierChallanNumber: req.body.supplierChallanNumber,
        notes: req.body.notes
      });

      await delivery.save();

      // Update purchase with numbers (not strings)
      purchase.totalActualWeight = (purchase.totalActualWeight || 0) + actualWeightNum;
      purchase.totalDeductedWeight = (purchase.totalDeductedWeight || 0) + deductFromDealNum;
      await purchase.save();

      const populatedDelivery = await PurchaseDelivery.findById(delivery._id)
        .populate({ 
          path: 'purchase', 
          populate: { path: 'party' } 
        });

      console.log(`✅ Purchase delivery created: ${delivery.deliveryNumber} by user ${req.userId}`);
      res.status(201).json(populatedDelivery);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Add payment to delivery
router.put('/:id/payment', 
  authenticate,
  verifyOwnership(PurchaseDelivery),
  async (req, res) => {
    try {
      const { amount, paymentMethod, chequeNumber, chequeDate, bankName, transactionId, notes, paymentDate } = req.body;
      
      const delivery = await PurchaseDelivery.findOne({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ message: 'Invalid payment amount' });
      }

      // Check if total would exceed net amount
      const totalPaid = (delivery.amountPaid || 0) + amountNum;
      if (totalPaid > delivery.netAmount + 0.01) {
        return res.status(400).json({ 
          message: `Total payment (₹${totalPaid.toFixed(2)}) cannot exceed net amount (₹${delivery.netAmount.toFixed(2)})` 
        });
      }

      // Validate payment method specific fields
      if (paymentMethod === 'Cheque') {
        if (!chequeNumber || !chequeDate) {
          return res.status(400).json({ 
            message: 'Cheque number and date are required for cheque payments' 
          });
        }
      } else if (paymentMethod === 'RTGS') {
        if (!transactionId) {
          return res.status(400).json({ 
            message: 'Transaction ID is required for RTGS payments' 
          });
        }
      }

      // Add payment record
      const paymentRecord = {
        paymentDate: paymentDate || new Date(),
        amount: amountNum,
        paymentMethod,
        chequeNumber: paymentMethod === 'Cheque' ? chequeNumber : undefined,
        chequeDate: paymentMethod === 'Cheque' ? chequeDate : undefined,
        bankName: paymentMethod === 'Cheque' ? bankName : undefined,
        transactionId: paymentMethod === 'RTGS' ? transactionId : undefined,
        notes
      };

      delivery.payments.push(paymentRecord);
      delivery.amountPaid = totalPaid;
      
      await delivery.save();

      const updated = await PurchaseDelivery.findById(req.params.id)
        .populate({ 
          path: 'purchase', 
          populate: { path: 'party' } 
        });

      console.log(`✅ Payment added to delivery by user ${req.userId}`);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete delivery
router.delete('/:id', 
  authenticate,
  verifyOwnership(PurchaseDelivery),
  async (req, res) => {
    try {
      const delivery = await PurchaseDelivery.findOne({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      // Update purchase totals
      const purchase = await Purchase.findOne({ 
        _id: delivery.purchase,
        user: req.userId 
      });
      
      if (purchase) {
        purchase.totalActualWeight = Math.max(0, (purchase.totalActualWeight || 0) - delivery.actualWeight);
        purchase.totalDeductedWeight = Math.max(0, (purchase.totalDeductedWeight || 0) - delivery.deductFromDeal);
        await purchase.save();
      }

      await PurchaseDelivery.findOneAndDelete({ 
        _id: req.params.id,
        user: req.userId 
      });
      
      console.log(`✅ Purchase delivery deleted by user ${req.userId}`);
      res.json({ message: 'Delivery deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;