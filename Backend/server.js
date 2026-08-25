require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/Database');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=============================================`);
      console.log(` Student Quiz & Exam System Server Started`);
      console.log(` Running on Port: ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Server Time: ${new Date().toISOString()}`);
      console.log(`=============================================`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  });
