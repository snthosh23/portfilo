const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const connectDB = async () => {
  // Set fallback true by default until successfully connected
  global.dbFallback = true;
  
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portfolio');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.dbFallback = false;

    // Seed default admin if no user exists
    const adminCount = await User.countDocuments();
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@portfolio.com';
      const password = process.env.ADMIN_PASSWORD || 'admin12345';
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const defaultAdmin = new User({
        email,
        password: hashedPassword
      });

      await defaultAdmin.save();
      console.log('----------------------------------------------------');
      console.log('Default Admin Account Seeded successfully!');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log('Please change these credentials after your first login.');
      console.log('----------------------------------------------------');
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Please ensure MongoDB is running locally, or verify your MONGO_URI in .env.');
    console.log('Activating Local JSON Database fallback (/database/db.json).');
    global.dbFallback = true;
    // Do not crash the app, let it keep running so other assets can be served
  }
};

module.exports = connectDB;
