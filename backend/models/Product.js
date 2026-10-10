const mongoose = require('mongoose');

// Re-export Listing model to ensure 100% synchronization and shared 'products' collection
const Listing = require('./Listing');

module.exports = Listing;
