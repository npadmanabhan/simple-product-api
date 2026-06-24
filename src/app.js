'use strict';

const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/product.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/products', productRoutes);

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
