const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  listingType: { type: String, enum: ['SELL', 'BUY', 'SHARE'], default: 'SELL' },
  imageUrl: { type: String, default: '' },
  availableQty: { type: Number, default: 0 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isEcoFriendly: { type: Boolean, default: false }, // NEW
  localPickupAvailable: { type: Boolean, default: false }, // NEW
  borrowRequesters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });



module.exports = mongoose.model('Product', productSchema);
