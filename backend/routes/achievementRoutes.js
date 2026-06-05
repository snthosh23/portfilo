const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/', achievementController.getAchievements);
router.get('/:id', achievementController.getAchievementById);

router.post('/', authMiddleware, upload.single('image'), achievementController.createAchievement);
router.put('/:id', authMiddleware, upload.single('image'), achievementController.updateAchievement);
router.delete('/:id', authMiddleware, achievementController.deleteAchievement);

module.exports = router;
