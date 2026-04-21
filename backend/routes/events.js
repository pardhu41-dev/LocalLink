const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const authMiddleware = require('../middleware/auth');

// Create a new event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, date } = req.body;
    if (!title || !date) {
      return res.status(400).json({ msg: "Title and Date are required" });
    }
    const event = new Event({
      title,
      description,
      date,
      createdBy: req.user.userId,
      participants: [req.user.userId]
    });
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name').sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Join an event
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    if (!event.participants.includes(req.user.userId)) {
      event.participants.push(req.user.userId);
      await event.save();
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
