// backend/routes/dashboard.js - High Performance Dashboard Aggregation
const express = require('express');
const router = express.Router();
const DeliveryChallan = require('../models/DeliveryChallan');
const TaxInvoice = require('../models/TaxInvoice');
const Quality = require('../models/Quality');
const Party = require('../models/Party');
const Deal = require('../models/Deal');
const Purchase = require('../models/Purchase');
const { authenticate } = require('../middleware/auth');

// Get aggregated dashboard statistics (single lightweight query)
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const [
      totalChallans,
      incompleteChallans,
      totalInvoices,
      totalQualities,
      totalParties,
      activeDeals,
      activePurchases,
      recentChallans,
      recentInvoices
    ] = await Promise.all([
      DeliveryChallan.countDocuments({ user: userId }),
      DeliveryChallan.countDocuments({ user: userId, status: 'incomplete' }),
      TaxInvoice.countDocuments({ user: userId }),
      Quality.countDocuments({ user: userId }),
      Party.countDocuments({ user: userId }),
      Deal.countDocuments({ user: userId, status: 'active' }),
      Purchase.countDocuments({ user: userId, status: { $ne: 'completed' } }),
      DeliveryChallan.find({ user: userId })
        .select('challanNumber qualityName status createdAt')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      TaxInvoice.find({ user: userId })
        .select('billNumber partyDetails.name date createdAt')
        .sort({ createdAt: -1 })
        .limit(2)
        .lean()
    ]);

    const recentActivity = [
      ...recentChallans.map(c => ({
        type: 'challan',
        title: `Challan ${c.challanNumber}`,
        subtitle: `${c.qualityName} - ${c.status}`,
        date: c.createdAt,
        status: c.status
      })),
      ...recentInvoices.map(i => ({
        type: 'invoice',
        title: `Invoice ${i.billNumber}`,
        subtitle: `${i.partyDetails?.name || 'Party'}`,
        date: i.date || i.createdAt,
        status: 'complete'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    res.json({
      totalChallans,
      incompleteChallans,
      totalInvoices,
      totalQualities,
      totalParties,
      activeDeals,
      activePurchases,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
