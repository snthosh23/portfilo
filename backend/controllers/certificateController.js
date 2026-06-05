const Certificate = require('../models/Certificate');
const { uploadToCloudinaryOrLocal } = require('../config/cloudinary');
const jsonDb = require('../config/jsonDb');
const fs = require('fs');
const path = require('path');

// @route   GET api/certificates
// @desc    Get all certificates
// @access  Public
exports.getCertificates = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const sorted = (data.certificates || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return res.json(sorted);
    }

    const certificates = await Certificate.find().sort({ createdAt: -1 });
    res.json(certificates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/certificates/:id
// @desc    Get certificate by ID
// @access  Public
exports.getCertificateById = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const certificate = data.certificates.find(c => c._id === req.params.id);
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }
      return res.json(certificate);
    }

    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.json(certificate);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   POST api/certificates
// @desc    Create a new certificate
// @access  Private
exports.createCertificate = async (req, res) => {
  const { title, issuer, issueDate, credentialUrl, downloadUrl, credentialId } = req.body;

  try {
    let imageUrl = '/images/default-certificate.jpg';
    if (req.file) {
      imageUrl = await uploadToCloudinaryOrLocal(req.file);
    }

    if (global.dbFallback) {
      const data = jsonDb.read();
      const newCertificate = {
        _id: 'cert-' + Date.now(),
        title,
        issuer,
        issueDate,
        credentialUrl,
        downloadUrl,
        credentialId,
        image: imageUrl,
        createdAt: new Date().toISOString()
      };
      data.certificates.push(newCertificate);
      jsonDb.write(data);
      return res.json(newCertificate);
    }

    const newCertificate = new Certificate({
      title,
      issuer,
      issueDate,
      credentialUrl,
      downloadUrl,
      credentialId,
      image: imageUrl
    });

    const certificate = await newCertificate.save();
    res.json(certificate);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/certificates/:id
// @desc    Update a certificate
// @access  Private
exports.updateCertificate = async (req, res) => {
  const { title, issuer, issueDate, credentialUrl, downloadUrl, credentialId } = req.body;

  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const index = data.certificates.findIndex(c => c._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      const certificate = data.certificates[index];
      if (title) certificate.title = title;
      if (issuer) certificate.issuer = issuer;
      if (issueDate) certificate.issueDate = issueDate;
      if (credentialUrl !== undefined) certificate.credentialUrl = credentialUrl;
      if (downloadUrl !== undefined) certificate.downloadUrl = downloadUrl;
      if (credentialId !== undefined) certificate.credentialId = credentialId;

      if (req.file) {
        const imageUrl = await uploadToCloudinaryOrLocal(req.file);
        certificate.image = imageUrl;
      }

      data.certificates[index] = certificate;
      jsonDb.write(data);
      return res.json(certificate);
    }

    let certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (title) certificate.title = title;
    if (issuer) certificate.issuer = issuer;
    if (issueDate) certificate.issueDate = issueDate;
    if (credentialUrl !== undefined) certificate.credentialUrl = credentialUrl;
    if (downloadUrl !== undefined) certificate.downloadUrl = downloadUrl;
    if (credentialId !== undefined) certificate.credentialId = credentialId;

    if (req.file) {
      const imageUrl = await uploadToCloudinaryOrLocal(req.file);
      certificate.image = imageUrl;
    }

    await certificate.save();
    res.json(certificate);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/certificates/:id
// @desc    Delete a certificate
// @access  Private
exports.deleteCertificate = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const index = data.certificates.findIndex(c => c._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      const certificate = data.certificates[index];
      if (certificate.image && certificate.image.startsWith('/images/uploads/')) {
        const localFilePath = path.join(__dirname, '../../frontend', certificate.image);
        if (fs.existsSync(localFilePath)) {
          try {
            fs.unlinkSync(localFilePath);
          } catch (err) {
            console.error('Error deleting local file:', err.message);
          }
        }
      }

      data.certificates.splice(index, 1);
      jsonDb.write(data);
      return res.json({ message: 'Certificate removed successfully' });
    }

    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Try deleting local file
    if (certificate.image && certificate.image.startsWith('/images/uploads/')) {
      const localFilePath = path.join(__dirname, '../../frontend', certificate.image);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (err) {
          console.error('Error deleting local file:', err.message);
        }
      }
    }

    await Certificate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Certificate removed successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(500).send('Server error');
  }
};
