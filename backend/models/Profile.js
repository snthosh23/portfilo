const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'John Doe'
  },
  role: {
    type: String,
    default: 'Full Stack Developer'
  },
  bio: {
    type: String,
    default: 'A passionate developer specializing in Node.js, Express, MongoDB, and modern web interfaces.'
  },
  profileImage: {
    type: String,
    default: '/images/default-profile.jpg'
  },
  resumeUrl: {
    type: String,
    default: '#'
  },
  githubUrl: {
    type: String,
    default: 'https://github.com'
  },
  linkedinUrl: {
    type: String,
    default: 'https://linkedin.com'
  },
  whatsappNumber: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: 'developer@example.com'
  },
  visitorsCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);
