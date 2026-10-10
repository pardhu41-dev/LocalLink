const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const isVerified = require('../middleware/isVerified');

// Create order — total is ALWAYS recomputed server-side to prevent price manipulation
router.post('/', [auth, isVerified], async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ msg: 'No products in order' });
    }

    // Extract all product IDs from cart items (cart uses { product: { _id }, quantity } shape)
    const productIds = products.map(item => item.product?._id || item.product);

    // Fetch actual prices from DB — never trust client-sent total
    const productDocs = await Product.find({ _id: { $in: productIds } });

    const serverTotal = products.reduce((sum, item) => {
      const id = (item.product?._id || item.product)?.toString();
      const doc = productDocs.find(d => d._id.toString() === id);
      return sum + (doc?.price || 0) * (item.quantity || 1);
    }, 0);

    if (serverTotal === 0) {
      return res.status(400).json({ msg: 'Could not compute order total — invalid products' });
    }

    const order = new Order({
      user: req.user.id,
      products: products.map(item => ({
        product: item.product?._id || item.product,
        quantity: item.quantity || 1
      })),
      total: serverTotal,
      trackingUpdates: [{
        status: 'Pending',
        message: 'Order placed successfully',
        timestamp: new Date()
      }]
    });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ msg: err.message });
  }
});

// Get user orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('products.product', 'name imageUrl price')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ msg: err.message });
  }
});

// Update order status — only the order owner or an admin can update
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, message } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Only the user who placed the order can update it (extend this for seller/admin roles)
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Forbidden: not your order' });
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
