const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jsonDb = require('../config/jsonDb');

// Helper to sign JWT token
const signToken = (userId, userEmail, res) => {
  const payload = {
    user: {
      id: userId
    }
  };

  const tokenSecret = process.env.JWT_SECRET || 'supersecretportfoliojwtkey12345';
  
  jwt.sign(
    payload,
    tokenSecret,
    { expiresIn: '24h' },
    (err, token) => {
      if (err) throw err;
      
      // Save in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        token,
        user: {
          id: userId,
          email: userEmail
        }
      });
    }
  );
};

// @route   POST api/auth/login
// @desc    Authenticate admin & get token
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const user = data.users.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      return signToken(user._id, user.email, res);
    }

    // Check if user exists in MongoDB
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    return signToken(user.id, user.email, res);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/auth/verify
// @desc    Verify if token is active
// @access  Private
exports.verifyToken = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const user = data.users.find(u => u._id === req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      return res.json({ valid: true, user: userWithoutPassword });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ valid: true, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/auth/update
// @desc    Update admin email and/or password
// @access  Private
exports.updateAdmin = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const userIndex = data.users.findIndex(u => u._id === req.user.id);
      if (userIndex === -1) {
        return res.status(404).json({ message: 'Admin user not found' });
      }

      const user = data.users[userIndex];
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }

      if (email) user.email = email;
      if (newPassword) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
      }

      data.users[userIndex] = user;
      jsonDb.write(data);
      return res.json({ message: 'Admin credentials updated successfully' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    if (email) {
      user.email = email;
    }

    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    res.json({ message: 'Admin credentials updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
