const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/', certificateController.getCertificates);
router.get('/:id', certificateController.getCertificateById);

router.post('/', authMiddleware, upload.single('image'), certificateController.createCertificate);
router.put('/:id', authMiddleware, upload.single('image'), certificateController.updateCertificate);
router.delete('/:id', authMiddleware, certificateController.deleteCertificate);

module.exports = router;
