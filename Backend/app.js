const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/Database');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes');
const otpRoutes = require('./routes/otpRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Ensure database is ready before processing API queries
app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/api/health') return next();
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (err) {
    next();
  }
});

// Root & Health check endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Quiz Application Backend API is operational',
    healthEndpoint: '/api/health',
    serverTime: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1
      ? 'CONNECTED'
      : mongoose.connection.readyState === 2
      ? 'CONNECTING'
      : 'DISCONNECTED';

  res.status(200).json({
    success: true,
    message: 'Quiz App Backend API is healthy and operational',
    database: dbStatus,
    serverTime: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api', questionRoutes);
app.use('/api', otpRoutes);
app.use('/api', attemptRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);

// Catch 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
    error: 'NOT_FOUND',
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
