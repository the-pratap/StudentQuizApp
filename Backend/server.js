require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/Database');

const PORT = process.env.PORT || 5000;

// Catch unexpected crashes to prevent cPanel 503
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start listening immediately so cPanel / Phusion Passenger connects without 503 timeout
const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` Student Quiz & Exam System Server Started`);
  console.log(` Running on Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(` Server Time: ${new Date().toISOString()}`);
  console.log(`=============================================`);
});

// Connect to MongoDB Atlas in background
connectDB()
  .then(() => {
    console.log('[Database] Ready for examination requests');
  })
  .catch((err) => {
    console.error('[Database] MongoDB connection issue:', err.message);
  });

module.exports = server;
