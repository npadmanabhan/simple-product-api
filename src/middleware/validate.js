'use strict';

const validateProduct = (req, res, next) => {
  const { name, sku, price, quantity } = req.body;
  const errors = [];

  if (name === undefined || name === null || String(name).trim() === '') {
    errors.push('name is required');
  }
  if (sku === undefined || sku === null || String(sku).trim() === '') {
    errors.push('sku is required');
  }
  if (price === undefined || price === null) {
    errors.push('price is required');
  } else if (typeof price !== 'number' || isNaN(price) || price < 0) {
    errors.push('price must be a non-negative number');
  }
  if (quantity === undefined || quantity === null) {
    errors.push('quantity is required');
  } else if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0) {
    errors.push('quantity must be a non-negative integer');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join(', ') });
  }
  return next();
};

const validateProductUpdate = (req, res, next) => {
  const { name, sku, price, quantity } = req.body;
  const errors = [];

  if (name !== undefined && String(name).trim() === '') {
    errors.push('name cannot be empty');
  }
  if (sku !== undefined && String(sku).trim() === '') {
    errors.push('sku cannot be empty');
  }
  if (price !== undefined && (typeof price !== 'number' || isNaN(price) || price < 0)) {
    errors.push('price must be a non-negative number');
  }
  if (quantity !== undefined && (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0)) {
    errors.push('quantity must be a non-negative integer');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join(', ') });
  }
  return next();
};

module.exports = { validateProduct, validateProductUpdate };
