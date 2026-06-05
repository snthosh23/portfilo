const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  issuer: {
    type: String,
    required: true,
    trim: true
  },
  issueDate: {
    type: String,
    required: true
  },
  credentialUrl: {
    type: String,
    trim: true
  },
  downloadUrl: {
    type: String,
    trim: true
  },
  credentialId: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: '/images/default-certificate.jpg'
  }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', CertificateSchema);
