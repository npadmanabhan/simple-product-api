'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Fail fast if required environment variables are missing
const required = ['MONGO_URI'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  logger.error('Missing required environment variables', { missing });
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      logger.info('Server started', { port: PORT, env: process.env.NODE_ENV || 'development' });
    });

    const shutdown = (signal) => {
      logger.info('Shutdown signal received', { signal });
      server.close(async () => {
        try {
          await mongoose.connection.close();
          logger.info('Graceful shutdown complete');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown', { error: err.message });
          process.exit(1);
        }
      });

      // Force-kill if graceful close takes too long
      setTimeout(() => {
        logger.error('Shutdown timed out, forcing exit');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    logger.error('Database connection failed', { error: err.message });
    process.exit(1);
  });
