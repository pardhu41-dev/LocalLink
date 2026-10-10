const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  buyer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  messages: [{
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    message: { 
      type: String, 
      required: true 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  lastMessage: { 
    type: Date, 
    default: Date.now 
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Unique index prevents duplicate chats (also used by upsert in routes/chat.js)
chatSchema.index({ product: 1, buyer: 1, seller: 1 }, { unique: true });
// For sorting the chat list by most recent activity
chatSchema.index({ lastMessage: -1 });

module.exports = mongoose.model('Chat', chatSchema);
