const Achievement = require('../models/Achievement');
const { uploadToCloudinaryOrLocal } = require('../config/cloudinary');
const jsonDb = require('../config/jsonDb');
const fs = require('fs');
const path = require('path');

// @route   GET api/achievements
// @desc    Get all achievements
// @access  Public
exports.getAchievements = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const sorted = (data.achievements || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return res.json(sorted);
    }

    const achievements = await Achievement.find().sort({ createdAt: -1 });
    res.json(achievements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/achievements/:id
// @desc    Get achievement by ID
// @access  Public
exports.getAchievementById = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const achievement = data.achievements.find(a => a._id === req.params.id);
      if (!achievement) {
        return res.status(404).json({ message: 'Achievement not found' });
      }
      return res.json(achievement);
    }

    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    res.json(achievement);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   POST api/achievements
// @desc    Create a new achievement
// @access  Private
exports.createAchievement = async (req, res) => {
  const { title, category, description, date, organization } = req.body;

  try {
    let imageUrl = '/images/default-achievement.jpg';
    if (req.file) {
      imageUrl = await uploadToCloudinaryOrLocal(req.file);
    }

    if (global.dbFallback) {
      const data = jsonDb.read();
      const newAchievement = {
        _id: 'ach-' + Date.now(),
        title,
        category,
        description,
        date,
        organization,
        image: imageUrl,
        createdAt: new Date().toISOString()
      };
      data.achievements.push(newAchievement);
      jsonDb.write(data);
      return res.json(newAchievement);
    }

    const newAchievement = new Achievement({
      title,
      category,
      description,
      date,
      organization,
      image: imageUrl
    });

    const achievement = await newAchievement.save();
    res.json(achievement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/achievements/:id
// @desc    Update an achievement
// @access  Private
exports.updateAchievement = async (req, res) => {
  const { title, category, description, date, organization } = req.body;

  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const index = data.achievements.findIndex(a => a._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Achievement not found' });
      }

      const achievement = data.achievements[index];
      if (title) achievement.title = title;
      if (category) achievement.category = category;
      if (description) achievement.description = description;
      if (date) achievement.date = date;
      if (organization) achievement.organization = organization;

      if (req.file) {
        const imageUrl = await uploadToCloudinaryOrLocal(req.file);
        achievement.image = imageUrl;
      }

      data.achievements[index] = achievement;
      jsonDb.write(data);
      return res.json(achievement);
    }

    let achievement = await Achievement.findById(req.params.id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    if (title) achievement.title = title;
    if (category) achievement.category = category;
    if (description) achievement.description = description;
    if (date) achievement.date = date;
    if (organization) achievement.organization = organization;

    if (req.file) {
      const imageUrl = await uploadToCloudinaryOrLocal(req.file);
      achievement.image = imageUrl;
    }

    await achievement.save();
    res.json(achievement);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/achievements/:id
// @desc    Delete an achievement
// @access  Private
exports.deleteAchievement = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const index = data.achievements.findIndex(a => a._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Achievement not found' });
      }

      const achievement = data.achievements[index];
      if (achievement.image && achievement.image.startsWith('/images/uploads/')) {
        const localFilePath = path.join(__dirname, '../../frontend', achievement.image);
        if (fs.existsSync(localFilePath)) {
          try {
            fs.unlinkSync(localFilePath);
          } catch (err) {
            console.error('Error deleting local file:', err.message);
          }
        }
      }

      data.achievements.splice(index, 1);
      jsonDb.write(data);
      return res.json({ message: 'Achievement removed successfully' });
    }

    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    // Try deleting local file
    if (achievement.image && achievement.image.startsWith('/images/uploads/')) {
      const localFilePath = path.join(__dirname, '../../frontend', achievement.image);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (err) {
          console.error('Error deleting local file:', err.message);
        }
      }
    }

    await Achievement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Achievement removed successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    res.status(500).send('Server error');
  }
};
