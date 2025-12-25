//backend/routes/quality.js
const express = require('express');
const router = express.Router();
const Quality = require('../models/Quality');

// Get all qualities
router.get('/', async (req, res) => {
  try {
    const qualities = await Quality.find().sort({ createdAt: -1 });
    res.json(qualities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create quality
router.post('/', async (req, res) => {
  try {
    const quality = new Quality(req.body);
    const savedQuality = await quality.save();
    res.status(201).json(savedQuality);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update quality
router.put('/:id', async (req, res) => {
  try {
    const quality = await Quality.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(quality);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete quality
router.delete('/:id', async (req, res) => {
  try {
    await Quality.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quality deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;