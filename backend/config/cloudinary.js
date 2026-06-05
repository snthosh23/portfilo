const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure local storage path
const uploadDir = path.join(__dirname, '../../frontend/images/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and pdfs are allowed (jpeg, jpg, png, gif, webp, pdf)'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit (useful for resumes)
});

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary storage engine configured.');
} else {
  console.log('Cloudinary credentials missing. Uploads will fall back to local disk storage (/images/uploads/).');
}

/**
 * Uploads a local file to Cloudinary if configured; otherwise returns local URL path.
 * @param {Object} file - The file object from Multer (req.file)
 * @returns {Promise<string>} The URL (Cloudinary secure_url or local path)
 */
const uploadToCloudinaryOrLocal = async (file) => {
  if (!file) return '';
  
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'portfolio',
        resource_type: 'auto'
      });
      // Delete local file after upload
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to delete temp local file:', err.message);
      }
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed, using local storage fallback:', error.message);
      return `/images/uploads/${file.filename}`;
    }
  } else {
    return `/images/uploads/${file.filename}`;
  }
};

module.exports = {
  upload,
  uploadToCloudinaryOrLocal
};
