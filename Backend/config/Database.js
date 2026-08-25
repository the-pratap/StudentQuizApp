const mongoose = require('mongoose');

// Universal Direct ReplicaSet connection URI (bypasses cPanel DNS SRV lookup restrictions)
const DIRECT_MONGO_URI =
  'mongodb://chandrapratap5926_db_user:u452POBlLZCQZIrr@ac-uol21pb-shard-00-00.ltgr9uw.mongodb.net:27017,ac-uol21pb-shard-00-01.ltgr9uw.mongodb.net:27017,ac-uol21pb-shard-00-02.ltgr9uw.mongodb.net:27017/quizapp?ssl=true&replicaSet=atlas-lau29g-shard-0&authSource=admin&retryWrites=true&w=majority';

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || DIRECT_MONGO_URI;

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[MongoDB] Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Primary URI connection attempt failed (${error.message}). Retrying with Direct ReplicaSet URI...`);
    try {
      const fallbackConn = await mongoose.connect(DIRECT_MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`[MongoDB] Fallback Direct URI Connected Successfully: ${fallbackConn.connection.host}`);
      return fallbackConn;
    } catch (fallbackError) {
      console.error(`[MongoDB] Fatal Connection Error: ${fallbackError.message}`);
      return null;
    }
  }
};

module.exports = connectDB;
