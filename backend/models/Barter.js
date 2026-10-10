const mongoose = require('mongoose');

const barterSchema = new mongoose.Schema({
  requester: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  requestedProduct: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  offeredProduct: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'], 
    default: 'PENDING' 
  },
  message: String
}, { timestamps: true }); // Use Mongoose timestamps — provides both createdAt and updatedAt

barterSchema.index({ owner: 1, status: 1 });
barterSchema.index({ requester: 1 });

module.exports = mongoose.model('Barter', barterSchema);
