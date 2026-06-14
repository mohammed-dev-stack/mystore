/**
 * Entry point for the backend application
 */
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/database.js';
import logger from './utils/logger.js';

// الآن TypeScript سيعرف جميع الخصائص التي عرفتها في env.d.ts
const PORT = process.env.PORT || '5000';
const NODE_ENV = 'development';

let server: ReturnType<typeof import('http').createServer> | null = null;

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      const mongoose = await import('mongoose');
      await mongoose.disconnect();
      logger.info('MongoDB disconnected.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    logger.info('✅ Database connected successfully');

    const http = await import('http');
    server = http.createServer(app).listen(PORT, () => {
      logger.info(`🚀 HTTP Server running on port ${PORT} (${NODE_ENV})`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();