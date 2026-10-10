const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const auth = require('../middleware/auth');
const isVerified = require('../middleware/isVerified');
const upload = require('../middleware/upload');

// GET /api/listings (location-aware)
router.get('/', listingController.getListings);
router.get('/:id', listingController.getListingById);
router.post('/', [auth, isVerified, upload.array('images', 4)], listingController.createListing);
router.put('/:id', auth, listingController.updateListing);
router.delete('/:id', auth, listingController.deleteListing);

module.exports = router;
