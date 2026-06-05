const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Load environment variables
require('dotenv').config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploads folder statically (local fallback storage)
const uploadsPath = path.join(__dirname, '../frontend/images/uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/images/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Serve clean HTML routing (e.g. /about -> about.html)
app.get('/admin/:page', (req, res, next) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, '../frontend/admin', `${page}.html`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, '../frontend', `${page}.html`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// Serve frontend assets statically
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback to home (index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
