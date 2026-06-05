const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Award', 'Hackathon', 'Internship', 'Other'],
    default: 'Award'
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  organization: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: '/images/default-achievement.jpg'
  }
}, { timestamps: true });

module.exports = mongoose.model('Achievement', AchievementSchema);
