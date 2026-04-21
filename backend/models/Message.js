const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Optional: link to product
});

module.exports = mongoose.model('Message', messageSchema);
