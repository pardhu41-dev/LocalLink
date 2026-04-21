const express = require('express');
const router = express.Router();
const Barter = require('../models/Barter');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Create barter offer
router.post('/offer', auth, async (req, res) => {
  try {
    const { requestedProductId, offeredProductId, message } = req.body;

    const requestedProduct = await Product.findById(requestedProductId).populate('seller');
    if (!requestedProduct) {
      return res.status(404).json({ msg: 'Requested product not found' });
    }

    const offeredProduct = await Product.findById(offeredProductId);
    if (!offeredProduct || offeredProduct.seller.toString() !== req.user.id) {
      return res.status(400).json({ msg: 'Invalid offered product' });
    }

    const barter = new Barter({
      requester: req.user.id,
      owner: requestedProduct.seller._id,
      requestedProduct: requestedProductId,
      offeredProduct: offeredProductId,
      message
    });

    await barter.save();
    await barter.populate('requestedProduct', 'name imageUrl price');
    await barter.populate('offeredProduct', 'name imageUrl price');
    await barter.populate('requester', 'name');

    res.json(barter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get received barter offers
router.get('/received', auth, async (req, res) => {
  try {
    const offers = await Barter.find({ owner: req.user.id })
      .populate('requestedProduct', 'name imageUrl price')
      .populate('offeredProduct', 'name imageUrl price')
      .populate('requester', 'name email')
      .sort({ createdAt: -1 });

    res.json(offers);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get sent barter offers
router.get('/sent', auth, async (req, res) => {
  try {
    const offers = await Barter.find({ requester: req.user.id })
      .populate('requestedProduct', 'name imageUrl price')
      .populate('offeredProduct', 'name imageUrl price')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json(offers);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Accept/Reject barter
router.put('/:barterId/:action', auth, async (req, res) => {
  try {
    const { barterId, action } = req.params;
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ msg: 'Invalid action' });
    }

    const barter = await Barter.findById(barterId);
    if (!barter || barter.owner.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Barter offer not found' });
    }

    barter.status = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
    await barter.save();

    await barter.populate('requestedProduct', 'name imageUrl price');
    await barter.populate('offeredProduct', 'name imageUrl price');
    await barter.populate('requester', 'name');

    res.json(barter);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
