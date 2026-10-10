const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: { type: String },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  category: { type: String, default: 'General' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    address: { type: String, default: 'Local Area' }
  },
  listingType: { type: String, enum: ['SELL', 'BUY', 'SHARE', 'SERVICE'], default: 'SELL' },
  imageUrl: { type: String, default: '' },
  images: [{ type: String }],
  availableQty: { type: Number, default: 0 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sellerPhone: { type: String, default: '' },
  sellerUpiId: { type: String, default: '' },
  isEcoFriendly: { type: Boolean, default: false },
  localPickupAvailable: { type: Boolean, default: false },
  borrowRequesters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Sync title and name if one is supplied but not the other
listingSchema.pre('validate', function(next) {
  if (this.title && !this.name) this.name = this.title;
  if (this.name && !this.title) this.title = this.name;
  next();
});

// GeoJSON 2dsphere index for location-based sorting
listingSchema.index({ location: '2dsphere' });
listingSchema.index({ seller: 1 });
listingSchema.index({ category: 1, listingType: 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ title: 'text', name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.models.Listing || mongoose.model('Listing', listingSchema, 'products');
