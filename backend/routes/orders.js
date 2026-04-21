const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { products, total } = req.body;
    const order = new Order({
      user: req.user.id,
      products,
      total,
      trackingUpdates: [{
        status: 'Pending',
        message: 'Order placed successfully',
        timestamp: new Date()
      }]
    });
    await order.save();
    res.json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ msg: err.message });
  }
});

// Get user orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('products.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ msg: err.message });
  }
});

// Update order status (admin/seller)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, message } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    order.status = status;
    order.trackingUpdates.push({
      status,
      message: message || `Order status updated to ${status}`,
      timestamp: new Date()
    });
    
    await order.save();
    res.json(order);
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
