const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Local disk storage fallback
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'listing-' + uniqueSuffix + ext);
  }
});

// Check if valid Cloudinary credentials are provided
const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

let storage = diskStorage;

if (hasCloudinary) {
  try {
    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'locallink_products',
        format: 'webp',
        transformation: [
          { width: 800, height: 600, crop: 'limit' }
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']
      }
    });
  } catch (err) {
    console.warn('Failed to initialize Cloudinary storage, using local disk storage:', err.message);
    storage = diskStorage;
  }
}

// Multer upload middleware configured for up to 4 images
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB per file limit
    files: 4
  }
});

module.exports = upload;
