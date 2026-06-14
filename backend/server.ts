// backend/src/server.ts
/**
 * Why this file?
 * - Entry point for the backend application
 * - Loads environment variables (dotenv)
 * - Connects to MongoDB before starting the server
 * - Graceful shutdown handling (SIGTERM, SIGINT)
 * - Starts HTTP server on specified port
 */

import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/database.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server: any = null;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      // Disconnect from MongoDB
      const mongoose = await import('mongoose');
      await mongoose.disconnect();
      logger.info('MongoDB disconnected.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Start server only after database connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('✅ Database connected successfully');

    // Start HTTP server
    const http = await import('http');
    server = http.createServer(app).listen(PORT, () => {
      logger.info(`🚀 HTTP Server running on port ${PORT} (${NODE_ENV})`);
    });

    // Graceful shutdown listeners
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();