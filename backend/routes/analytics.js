const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Get seller analytics
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Total products
    const totalProducts = await Product.countDocuments({ seller: req.user.id });

    // Total orders/sales
    const orders = await Order.find({ 'products.product.seller': req.user.id });
    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    // Products by category
    const productsByCategory = await Product.aggregate([
      { $match: { seller: req.user.id } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Top products
    const topProducts = await Product.find({ seller: req.user.id })
      .sort({ availableQty: -1 })
      .limit(5)
      .select('name price availableQty imageUrl');

    // Monthly sales (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          'products.product.seller': req.user.id,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalProducts,
      totalSales,
      totalRevenue,
      productsByCategory,
      topProducts,
      monthlySales
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
