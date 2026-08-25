const mongoose = require('mongoose');

// Universal Direct ReplicaSet connection URI (bypasses cPanel DNS SRV and IPv6 routing restrictions)
const DIRECT_MONGO_URI =
  'mongodb://chandrapratap5926_db_user:u452POBlLZCQZIrr@ac-uol21pb-shard-00-00.ltgr9uw.mongodb.net:27017,ac-uol21pb-shard-00-01.ltgr9uw.mongodb.net:27017,ac-uol21pb-shard-00-02.ltgr9uw.mongodb.net:27017/quizapp?ssl=true&replicaSet=atlas-lau29g-shard-0&authSource=admin&retryWrites=true&w=majority';

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const primaryUri = process.env.MONGODB_URI || DIRECT_MONGO_URI;

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
      family: 4, // Force IPv4 to prevent cPanel IPv6 routing timeouts
    });
    console.log(`[MongoDB] Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Primary connection failed (${error.message}). Retrying with Direct IPv4 ReplicaSet...`);
    try {
      const fallbackConn = await mongoose.connect(DIRECT_MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        family: 4, // Force IPv4
      });
      console.log(`[MongoDB] Fallback Direct Connected: ${fallbackConn.connection.host}`);
      return fallbackConn;
    } catch (fallbackError) {
      console.error(`[MongoDB] Connection Failed: ${fallbackError.message}`);
      return null;
    }
  }
};

module.exports = connectDB;
