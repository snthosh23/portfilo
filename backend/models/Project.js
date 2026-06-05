const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: '/images/default-project.jpg'
  },
  technologies: {
    type: [String],
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Full Stack', 'AI Projects', 'Web Applications', 'Academic Projects'],
    default: 'Web Applications'
  },
  githubUrl: {
    type: String,
    trim: true
  },
  liveUrl: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
