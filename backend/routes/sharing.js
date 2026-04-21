const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

// Request to borrow a shared item
router.post('/:id/request-borrow', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });
  
    if (product.listingType !== "SHARE")
      return res.status(400).json({ msg: "Not a shared item" });
  
    if (product.borrowRequesters && product.borrowRequesters.includes(req.user.userId))
      return res.status(400).json({ msg: "Already requested" });
  
    product.borrowRequesters = product.borrowRequesters || [];
    product.borrowRequesters.push(req.user.userId);
    await product.save();
  
    res.json({ msg: "Request to borrow sent" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Approve a borrow request (owner only)
router.post('/:id/approve-borrow/:userId', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });
    if (product.seller.toString() !== req.user.userId)
      return res.status(401).json({ msg: "Unauthorized" });
  
    const { userId } = req.params;
  
    if (!product.borrowRequesters || !product.borrowRequesters.includes(userId))
      return res.status(400).json({ msg: "User did not request borrow" });
  
    product.borrower = userId;
    product.borrowRequesters = product.borrowRequesters.filter(id => id !== userId);
  
    await product.save();
    res.json({ msg: "Borrow request approved" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
