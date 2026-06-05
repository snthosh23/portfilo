const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);

router.post('/', authMiddleware, upload.single('image'), projectController.createProject);
router.put('/:id', authMiddleware, upload.single('image'), projectController.updateProject);
router.delete('/:id', authMiddleware, projectController.deleteProject);

module.exports = router;
