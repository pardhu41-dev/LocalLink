const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

// Send a message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, listingId } = req.body;
    if (!content) return res.status(400).json({ msg: "Content required" });

    const message = new Message({
      sender: req.user.userId,
      content,
      listingId,
    });
    await message.save();
    
    // Populate sender info before sending response
    const populatedMessage = await Message.findById(message._id).populate('sender', 'name');
    res.json(populatedMessage);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get messages (optionally filtered by listingId)
router.get('/', async (req, res) => {
  try {
    const { listingId } = req.query;
    let filter = {};
    if (listingId) filter.listingId = listingId;

    const messages = await Message.find(filter)
      .populate('sender', 'name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
