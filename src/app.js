'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const productRoutes = require('./routes/product.routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict to configured origins; default to localhost in development
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  })
);

// Rate limiting — applied to all /api/* routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api', apiLimiter);

app.use(express.json());

// HTTP request/response logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('http_request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start,
    });
  });
  next();
});

// Health check — verifies DB connectivity
app.get('/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  const status = ready ? 200 : 503;
  res.status(status).json({ status: ready ? 'ok' : 'error', db: ready ? 'connected' : 'disconnected' });
});

app.use('/api/products', productRoutes);

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
