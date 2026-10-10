const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Get seller analytics
router.get('/dashboard', auth, async (req, res) => {
  try {
    // 1. Get seller's own product IDs first (needed to filter orders correctly)
    const sellerProducts = await Product.find({ seller: req.user.id }).select('_id');
    const productIds = sellerProducts.map(p => p._id);

    // 2. Run all queries in parallel for performance
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalProducts,
      orders,
      productsByCategory,
      topProducts,
      monthlySales
    ] = await Promise.all([
      // Total products count
      Product.countDocuments({ seller: req.user.id }),

      // Orders containing any of this seller's products
      Order.find({ 'products.product': { $in: productIds } }),

      // Products grouped by category
      Product.aggregate([
        { $match: { seller: req.user.id } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),

      // Top 5 products by available quantity
      Product.find({ seller: req.user.id })
        .sort({ availableQty: -1 })
        .limit(5)
        .select('name price availableQty imageUrl'),

      // Monthly order volume for last 6 months
      Order.aggregate([
        {
          $match: {
            'products.product': { $in: productIds },
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
      ])
    ]);

    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

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
