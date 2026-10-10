const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const isVerified = require('../middleware/isVerified');
const upload = require('../middleware/upload');
const listingController = require('../controllers/listingController');

// Get all products / listings (supports location sorting via ?lat=...&lng=...&maxDistKm=...)
router.get('/', listingController.getListings);

// Get single product
router.get('/:id', listingController.getListingById);

// Create product (supports multipart multi-image upload via Cloudinary)
router.post('/', [auth, isVerified, upload.array('images', 4)], listingController.createListing);

// Update product
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    if (product.seller && product.seller.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const {
      name,
      description,
      price,
      category,
      imageUrl,
      availableQty,
      lat,
      lng,
      address
    } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (availableQty !== undefined) product.availableQty = availableQty;

    if (lat !== undefined && lng !== undefined) {
      product.location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        address: address || product.location?.address || 'Local Area'
      };
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    if (product.seller && product.seller.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Product removed' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
