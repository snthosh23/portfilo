const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/', profileController.getProfile);
router.put('/', authMiddleware, upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), profileController.updateProfile);

module.exports = router;
