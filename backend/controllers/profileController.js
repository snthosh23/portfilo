const Profile = require('../models/Profile');
const { uploadToCloudinaryOrLocal } = require('../config/cloudinary');
const jsonDb = require('../config/jsonDb');

// @route   GET api/profile
// @desc    Get developer profile
// @access  Public
exports.getProfile = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      if (!req.headers.authorization) {
        data.profile.visitorsCount = (data.profile.visitorsCount || 0) + 1;
        jsonDb.write(data);
      }
      return res.json(data.profile);
    }

    let profile = await Profile.findOne();
    if (!profile) {
      // Create a default profile if none exists
      profile = new Profile();
      await profile.save();
    }
    if (!req.headers.authorization) {
      profile.visitorsCount = (profile.visitorsCount || 0) + 1;
      await profile.save();
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/profile
// @desc    Update developer profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const { name, role, bio, githubUrl, linkedinUrl, whatsappNumber, email, skills, education, experience } = req.body;

  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const profile = data.profile;

      if (name) profile.name = name;
      if (role) profile.role = role;
      if (bio) profile.bio = bio;
      if (githubUrl) profile.githubUrl = githubUrl;
      if (linkedinUrl) profile.linkedinUrl = linkedinUrl;
      if (whatsappNumber !== undefined) profile.whatsappNumber = whatsappNumber;
      if (email) profile.email = email;
      if (skills) profile.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
      if (education) profile.education = typeof education === 'string' ? JSON.parse(education) : education;
      if (experience) profile.experience = typeof experience === 'string' ? JSON.parse(experience) : experience;

      // Handle profile image upload if provided
      if (req.files && req.files.profileImage) {
        const file = req.files.profileImage[0];
        const imageUrl = await uploadToCloudinaryOrLocal(file);
        profile.profileImage = imageUrl;
      }

      // Handle resume PDF upload if provided
      if (req.files && req.files.resume) {
        const file = req.files.resume[0];
        const resumeUrl = await uploadToCloudinaryOrLocal(file);
        profile.resumeUrl = resumeUrl;
      }

      data.profile = profile;
      jsonDb.write(data);
      return res.json(profile);
    }

    let profile = await Profile.findOne();
    if (!profile) {
      profile = new Profile();
    }

    if (name) profile.name = name;
    if (role) profile.role = role;
    if (bio) profile.bio = bio;
    if (githubUrl) profile.githubUrl = githubUrl;
    if (linkedinUrl) profile.linkedinUrl = linkedinUrl;
    if (whatsappNumber !== undefined) profile.whatsappNumber = whatsappNumber;
    if (email) profile.email = email;
    if (skills) profile.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    if (education) profile.education = typeof education === 'string' ? JSON.parse(education) : education;
    if (experience) profile.experience = typeof experience === 'string' ? JSON.parse(experience) : experience;

    // Handle profile image upload if provided
    if (req.files && req.files.profileImage) {
      const file = req.files.profileImage[0];
      const imageUrl = await uploadToCloudinaryOrLocal(file);
      profile.profileImage = imageUrl;
    }

    // Handle resume PDF upload if provided
    if (req.files && req.files.resume) {
      const file = req.files.resume[0];
      const resumeUrl = await uploadToCloudinaryOrLocal(file);
      profile.resumeUrl = resumeUrl;
    }

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
