const Listing = require('../models/Listing');

// Get all listings (supports 100% free location-based sorting via GeoJSON $geoNear)
exports.getListings = async (req, res) => {
  try {
    const { lat, lng, maxDistKm, category, search, listingType } = req.query;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const hasCoordinates = !isNaN(parsedLat) && !isNaN(parsedLng);

    if (hasCoordinates) {
      const radiusKm = parseFloat(maxDistKm) || 15;
      const maxDistanceMeters = radiusKm * 1000;

      // Filter query for $geoNear stage
      const matchQuery = {};
      if (category && category !== 'ALL') {
        matchQuery.category = category;
      }
      if (listingType && listingType !== 'ALL') {
        matchQuery.listingType = listingType;
      }
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        matchQuery.$or = [
          { title: regex },
          { name: regex },
          { description: regex },
          { category: regex }
        ];
      }

      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parsedLng, parsedLat]
            },
            distanceField: 'distanceMeters',
            maxDistance: maxDistanceMeters,
            spherical: true,
            ...(Object.keys(matchQuery).length > 0 ? { query: matchQuery } : {})
          }
        },
        {
          $addFields: {
            distanceKm: {
              $round: [{ $divide: ['$distanceMeters', 1000] }, 1]
            }
          }
        }
      ];

      const listings = await Listing.aggregate(pipeline);
      // Populate seller details
      await Listing.populate(listings, { path: 'seller', select: 'name email' });

      return res.json(listings);
    }

    // Coordinates absent: Fall back to standard Listing.find().sort({ createdAt: -1 })
    const query = {};
    if (category && category !== 'ALL') query.category = category;
    if (listingType && listingType !== 'ALL') query.listingType = listingType;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { name: regex },
        { description: regex },
        { category: regex }
      ];
    }

    const listings = await Listing.find(query)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });

    return res.json(listings);
  } catch (err) {
    console.error('Error fetching listings:', err);
    return res.status(500).json({ msg: err.message, error: err.message });
  }
};

// Get single listing
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });
    return res.json(listing);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Create listing
exports.createListing = async (req, res) => {
  try {
    const {
      name,
      title,
      description,
      price,
      category,
      imageUrl,
      availableQty,
      listingType,
      lat,
      lng,
      address,
      sellerPhone,
      sellerUpiId,
      isEcoFriendly,
      localPickupAvailable
    } = req.body;

    // Map uploaded files from Multer storage (Cloudinary or local disk)
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const imageUrls = req.files && req.files.length > 0
      ? req.files.map(file => {
          if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
            return file.path;
          }
          const filename = file.filename || (file.path ? require('path').basename(file.path) : null);
          if (filename) {
            return `${baseUrl}/uploads/${filename}`;
          }
          return file.path || '';
        })
      : (req.body.images
          ? (Array.isArray(req.body.images) ? req.body.images : [req.body.images])
          : (imageUrl ? [imageUrl] : []));

    const primaryImageUrl = imageUrls[0] || imageUrl || '';

    const parsedLng = parseFloat(lng);
    const parsedLat = parseFloat(lat);
    const validCoords = !isNaN(parsedLng) && !isNaN(parsedLat) &&
      parsedLng >= -180 && parsedLng <= 180 &&
      parsedLat >= -90 && parsedLat <= 90;
    const coordinates = validCoords ? [parsedLng, parsedLat] : [0, 0];

    const listing = new Listing({
      name: name || title,
      title: title || name,
      description: description || '',
      price: Number(price) || 0,
      category: category || 'General',
      imageUrl: primaryImageUrl,
      images: imageUrls,
      availableQty: availableQty !== undefined ? Number(availableQty) : 1,
      listingType: listingType || 'SELL',
      seller: req.user.id,
      sellerPhone: (sellerPhone || '').replace(/\D/g, '').slice(-10),
      sellerUpiId: (sellerUpiId || '').trim(),
      isEcoFriendly: isEcoFriendly === true || isEcoFriendly === 'true',
      localPickupAvailable: localPickupAvailable === true || localPickupAvailable === 'true',
      location: {
        type: 'Point',
        coordinates,
        address: address || 'Local Area'
      }
    });

    await listing.save();
    return res.status(201).json(listing);
  } catch (err) {
    console.error('Error in createListing:', err);
    return res.status(500).json({ msg: err.message, error: err.message });
  }
};

// Update listing
exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });
    if (listing.seller && listing.seller.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const updates = req.body;
    if (updates.lat !== undefined && updates.lng !== undefined) {
      updates.location = {
        type: 'Point',
        coordinates: [parseFloat(updates.lng), parseFloat(updates.lat)],
        address: updates.address || listing.location?.address || 'Local Area'
      };
    }

    Object.assign(listing, updates);
    await listing.save();
    return res.json(listing);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Delete listing
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });
    if (listing.seller && listing.seller.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Listing.findByIdAndDelete(req.params.id);
    return res.json({ msg: 'Listing removed' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
