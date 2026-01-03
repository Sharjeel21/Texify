// backend/routes/taxInvoice.js - SECURED
const express = require('express');
const router = express.Router();
const TaxInvoice = require('../models/TaxInvoice');
const Party = require('../models/Party');
const Quality = require('../models/Quality');
const DeliveryChallan = require('../models/DeliveryChallan');
const Deal = require('../models/Deal');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const { 
  secureCreate, 
  verifyOwnership,
  verifyRelatedOwnership 
} = require('../middleware/dataAccess');

// Helper function to remove trailing zeros
const formatNumber = (num) => {
  return Math.round(num * 100) / 100; // 2 decimal precision
};

// ============================================
// ALL ROUTES PROTECTED WITH AUTHENTICATION
// ============================================

// Get next bill number (for current user)
router.get('/next-bill-number', authenticate, async (req, res) => {
  try {
    const lastInvoice = await TaxInvoice.findOne({ user: req.userId })
      .sort({ billNumber: -1 });
    const nextBillNumber = lastInvoice ? lastInvoice.billNumber + 1 : 1;
    res.json({ nextBillNumber });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all tax invoices (user's own only)
router.get('/', authenticate, async (req, res) => {
  try {
    const invoices = await TaxInvoice.find({ user: req.userId })
      .populate('party')
      .populate('quality')
      .populate('dealId')
      .sort({ createdAt: -1 });
    
    const invoicesWithBales = [];
    
    for (let invoice of invoices) {
      const invoiceObj = invoice.toObject();
      
      if (invoiceObj.challanDetails && invoiceObj.challanDetails.length > 0) {
        for (let i = 0; i < invoiceObj.challanDetails.length; i++) {
          const challanDetail = invoiceObj.challanDetails[i];
          // CRITICAL: Only fetch user's own challans
          const challan = await DeliveryChallan.findOne({ 
            _id: challanDetail.challanId,
            user: req.userId 
          });
          
          if (challan && challan.bales) {
            invoiceObj.challanDetails[i].bales = challan.bales.map(bale => ({
              baleNumber: bale.baleNumber,
              numberOfPieces: bale.numberOfPieces,
              totalMeter: formatNumber(bale.totalMeter),
              totalWeight: formatNumber(bale.totalWeight)
            }));
          }
        }
      }
      
      invoicesWithBales.push(invoiceObj);
    }
    
    res.json(invoicesWithBales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single invoice by ID
router.get('/:id', authenticate, verifyOwnership(TaxInvoice), async (req, res) => {
  try {
    const invoice = await TaxInvoice.findOne({ 
      _id: req.params.id,
      user: req.userId 
    })
      .populate('party')
      .populate('quality')
      .populate('dealId');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoiceObj = invoice.toObject();
    
    // Fetch bale details for each challan (user's own only)
    if (invoiceObj.challanDetails && invoiceObj.challanDetails.length > 0) {
      for (let i = 0; i < invoiceObj.challanDetails.length; i++) {
        const challanDetail = invoiceObj.challanDetails[i];
        const challan = await DeliveryChallan.findOne({ 
          _id: challanDetail.challanId,
          user: req.userId 
        });
        
        if (challan && challan.bales) {
          invoiceObj.challanDetails[i].bales = challan.bales.map(bale => ({
            baleNumber: bale.baleNumber,
            numberOfPieces: bale.numberOfPieces,
            totalMeter: formatNumber(bale.totalMeter),
            totalWeight: formatNumber(bale.totalWeight)
          }));
        }
      }
    }
    
    res.json(invoiceObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create tax invoice (with optional deal)
router.post('/', 
  authenticate, 
  secureCreate,
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { party, quality, challanIds, ratePerMeter, discountPercentage, dealId } = req.body;
      
      let partyDoc, qualityDoc, actualRate;
      let deal = null;
      
      // If dealId is provided, use deal details
      if (dealId) {
        deal = await Deal.findOne({ 
          _id: dealId,
          user: req.userId // CRITICAL: Verify deal belongs to user
        })
          .populate('party')
          .populate('quality')
          .session(session);
        
        if (!deal) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Deal not found or access denied' });
        }
        
        if (deal.status !== 'active') {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Deal is not active' });
        }
        
        partyDoc = deal.party;
        qualityDoc = deal.quality;
        actualRate = deal.ratePerMeter;
      } else {
        // Manual invoice creation - verify party and quality belong to user
        partyDoc = await Party.findOne({ 
          _id: party,
          user: req.userId 
        }).session(session);
        
        qualityDoc = await Quality.findOne({ 
          _id: quality,
          user: req.userId 
        }).session(session);
        
        actualRate = parseFloat(ratePerMeter);
      }
      
      if (!partyDoc) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Party not found or access denied' });
      }
      
      if (!qualityDoc) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Quality not found or access denied' });
      }
      
      // Verify challans belong to user
      const challans = await DeliveryChallan.find({ 
        _id: { $in: challanIds },
        user: req.userId // CRITICAL: Only user's own challans
      }).session(session);
      
      if (challans.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'No challans selected or access denied' });
      }

      if (challans.length !== challanIds.length) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: 'Some challans not found or access denied' 
        });
      }

      const incompleteChallan = challans.find(c => c.status === 'incomplete');
      if (incompleteChallan) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: `Challan ${incompleteChallan.challanNumber} is incomplete. Please complete it before billing.` 
        });
      }

      const soldChallan = challans.find(c => c.isSold);
      if (soldChallan) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: `Challan ${soldChallan.challanNumber} is already sold.` 
        });
      }

      // For deal-based invoices, verify quality matches
      if (dealId && deal) {
        const wrongQualityChallan = challans.find(c => 
          c.quality.toString() !== deal.quality._id.toString()
        );
        
        if (wrongQualityChallan) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: `Challan ${wrongQualityChallan.challanNumber} has different quality than the deal. Deal quality: ${deal.qualityDetails.name}` 
          });
        }
      }

      let totalPieces = 0;
      let totalMeters = 0;
      const challanDetails = [];

      challans.forEach(challan => {
        let challanPieces = 0;
        let challanMeters = 0;

        const baleDetails = challan.bales.map(bale => ({
          baleNumber: bale.baleNumber,
          numberOfPieces: bale.numberOfPieces,
          totalMeter: formatNumber(bale.totalMeter),
          totalWeight: formatNumber(bale.totalWeight)
        }));

        challan.bales.forEach(bale => {
          challanPieces += bale.numberOfPieces;
          challanMeters += bale.totalMeter;
        });

        totalPieces += challanPieces;
        totalMeters += challanMeters;

        challanDetails.push({
          challanId: challan._id,
          challanNumber: challan.challanNumber,
          numberOfBales: challan.bales.length,
          totalPieces: challanPieces,
          totalMeters: formatNumber(challanMeters),
          bales: baleDetails
        });
      });

      // Calculate discounted rate
      const originalRate = actualRate;
      const discount = parseFloat(discountPercentage) || 0;
      const discountedRate = formatNumber(originalRate - (originalRate * discount / 100));
      
      // Calculate amounts using discounted rate
      const subtotal = totalMeters * discountedRate;
      const discountAmount = formatNumber((totalMeters * originalRate) - subtotal);

      // Calculate GST
      let cgst = 0, sgst = 0, igst = 0;
      const gstRate = 0.05;
      
      if (partyDoc.stateCode !== '27') {
        igst = subtotal * gstRate;
      } else {
        cgst = (subtotal * gstRate) / 2;
        sgst = (subtotal * gstRate) / 2;
      }

      // Calculate total with round off
      const totalBeforeRounding = subtotal + cgst + sgst + igst;
      const totalAmount = Math.round(totalBeforeRounding);
      const roundOff = formatNumber(totalAmount - totalBeforeRounding);

      // Create party details object
      const partyDetails = {
        name: partyDoc.name,
        address: partyDoc.address,
        gstNumber: partyDoc.gstNumber,
        state: partyDoc.state,
        stateCode: partyDoc.stateCode
      };

      const invoice = new TaxInvoice({
        ...req.body,
        user: req.userId, // CRITICAL: Set user
        party: partyDoc._id,
        quality: qualityDoc._id,
        dealId: dealId || null,
        partyDetails,
        qualityName: qualityDoc.name,
        hsnCode: qualityDoc.hsnCode,
        challanDetails,
        totalPieces,
        totalMeters: formatNumber(totalMeters),
        ratePerMeter: originalRate,
        discountedRate,
        discountPercentage: discount,
        discountAmount,
        subtotal: parseFloat(subtotal.toFixed(2)),
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        igst: parseFloat(igst.toFixed(2)),
        roundOff,
        totalAmount
      });

      const savedInvoice = await invoice.save({ session });

      // Mark challans as sold (only user's own challans)
      await DeliveryChallan.updateMany(
        { 
          _id: { $in: challanIds },
          user: req.userId 
        },
        { 
          $set: { 
            isSold: true,
            invoiceId: savedInvoice._id
          } 
        },
        { session }
      );
      
      // If deal-based invoice, update deal progress
      if (dealId && deal) {
        deal.invoiceIds.push(savedInvoice._id);
        deal.completedBilties = deal.invoiceIds.length;
        
        challans.forEach(challan => {
          if (!deal.challanIds.includes(challan._id)) {
            deal.challanIds.push(challan._id);
          }
        });
        
        await deal.save({ session });
      }

      await session.commitTransaction();
      console.log(`✅ Invoice created by user ${req.userId}`);
      res.status(201).json(savedInvoice);
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({ message: error.message });
    } finally {
      session.endSession();
    }
  }
);

// Delete tax invoice
router.delete('/:id', 
  authenticate,
  verifyOwnership(TaxInvoice),
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const invoice = await TaxInvoice.findOne({ 
        _id: req.params.id,
        user: req.userId 
      }).session(session);
      
      if (!invoice) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const challanIds = invoice.challanDetails.map(cd => cd.challanId);
      
      // Mark challans as not sold (only user's own)
      await DeliveryChallan.updateMany(
        { 
          _id: { $in: challanIds },
          user: req.userId 
        },
        { 
          $set: { 
            isSold: false,
            invoiceId: null
          } 
        },
        { session }
      );
      
      // Remove from deal if associated
      if (invoice.dealId) {
        const deal = await Deal.findOne({ 
          _id: invoice.dealId,
          user: req.userId 
        }).session(session);
        
        if (deal) {
          deal.invoiceIds = deal.invoiceIds.filter(
            id => id.toString() !== invoice._id.toString()
          );
          
          deal.completedBilties = deal.invoiceIds.length;
          
          if (deal.completedBilties < deal.totalBilties && deal.status === 'completed') {
            deal.status = 'active';
            deal.completionDate = null;
          }
          
          await deal.save({ session });
        }
      }

      await TaxInvoice.findOneAndDelete({ 
        _id: req.params.id,
        user: req.userId 
      }).session(session);
      
      await session.commitTransaction();
      console.log(`✅ Invoice deleted by user ${req.userId}`);
      res.json({ message: 'Tax invoice deleted' });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ message: error.message });
    } finally {
      session.endSession();
    }
  }
);

module.exports = router;