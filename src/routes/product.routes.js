'use strict';

const router = require('express').Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { validateProduct, validateProductUpdate } = require('../middleware/validate');

router.route('/').get(getAllProducts).post(validateProduct, createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(validateProductUpdate, updateProduct)
  .delete(deleteProduct);

module.exports = router;
