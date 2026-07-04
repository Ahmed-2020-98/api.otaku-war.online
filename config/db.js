const mongoose = require("mongoose");
const config = require("./config");

// Temporary diagnostic: capture the last connection error so /health can surface
// why Mongo won't connect (e.g. IP not whitelisted vs bad auth) without needing logs.
let lastError = null;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoURI, {
      // Optimize connection pool for free tier with caching
      maxPoolSize: 5, // Optimized for free tier - supports 30-50 concurrent users with 50-70% cache hit rate
      minPoolSize: 2, // Keep 2 connections warm
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 60000, // 60 seconds
      connectTimeoutMS: 30000, // 30 seconds

      bufferCommands: false,

      // Performance optimizations
    });
    // display database name
    console.log(
      `MongoDB Connected: ${conn.connection.host} on ${conn.connection.name}`
    );
  } catch (error) {
    lastError = error.message;
    console.error(`Error: ${error.message}`);
  }
};

connectDB.isConfigured = () => Boolean(config.mongoURI);
connectDB.getLastError = () => lastError;

module.exports = connectDB;
