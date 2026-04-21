const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

// Start or get existing chat
router.post('/start', auth, async (req, res) => {
  try {
    const { productId, sellerId } = req.body;
    
    let chat = await Chat.findOne({
      product: productId,
      buyer: req.user.id,
      seller: sellerId
    })
    .populate('messages.sender', 'name')
    .populate('product', 'name imageUrl');

    if (!chat) {
      chat = new Chat({
        product: productId,
        buyer: req.user.id,
        seller: sellerId,
        messages: []
      });
      await chat.save();
      await chat.populate('messages.sender', 'name');
      await chat.populate('product', 'name imageUrl');
    }

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Send message
router.post('/message', auth, async (req, res) => {
  try {
    const { chatId, message } = req.body;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    chat.messages.push({
      sender: req.user.id,
      message,
      timestamp: new Date()
    });
    chat.lastMessage = new Date();
    await chat.save();

    await chat.populate('messages.sender', 'name');
    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user's chats
router.get('/my-chats', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [{ buyer: req.user.id }, { seller: req.user.id }],
      isActive: true
    })
    .populate('product', 'name imageUrl price')
    .populate('buyer', 'name email')
    .populate('seller', 'name email')
    .populate('messages.sender', 'name')
    .sort({ lastMessage: -1 });

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
