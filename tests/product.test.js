'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const validProduct = {
  name: 'Test Widget',
  sku: 'TW-001',
  price: 19.99,
  quantity: 100,
};

// ─── POST /api/products ───────────────────────────────────────────────────────

describe('POST /api/products', () => {
  it('creates a product and returns 201', async () => {
    const res = await request(app).post('/api/products').send(validProduct);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      name: validProduct.name,
      sku: validProduct.sku.toUpperCase(),
      price: validProduct.price,
      quantity: validProduct.quantity,
    });
    expect(res.body.data._id).toBeDefined();
  });

  it('returns 400 when name is missing', async () => {
    const { name, ...body } = validProduct;
    const res = await request(app).post('/api/products').send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when sku is missing', async () => {
    const { sku, ...body } = validProduct;
    const res = await request(app).post('/api/products').send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when price is missing', async () => {
    const { price, ...body } = validProduct;
    const res = await request(app).post('/api/products').send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when price is negative', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ ...validProduct, price: -5 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when quantity is a float', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ ...validProduct, quantity: 1.5 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 409 on duplicate sku', async () => {
    await request(app).post('/api/products').send(validProduct);
    const res = await request(app).post('/api/products').send(validProduct);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/products ────────────────────────────────────────────────────────

describe('GET /api/products', () => {
  it('returns empty array when no products exist', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it('returns all products', async () => {
    await request(app).post('/api/products').send(validProduct);
    await request(app)
      .post('/api/products')
      .send({ ...validProduct, sku: 'TW-002', name: 'Widget 2' });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data).toHaveLength(2);
  });
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────

describe('GET /api/products/:id', () => {
  it('returns a product by id', async () => {
    const created = await request(app).post('/api/products').send(validProduct);
    const id = created.body.data._id;

    const res = await request(app).get(`/api/products/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it('returns 404 for non-existent id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid id format', async () => {
    const res = await request(app).get('/api/products/not-an-id');
    expect(res.status).toBe(400);
  });
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────

describe('PUT /api/products/:id', () => {
  it('updates a product and returns updated data', async () => {
    const created = await request(app).post('/api/products').send(validProduct);
    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/products/${id}`)
      .send({ price: 29.99, quantity: 50 });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(29.99);
    expect(res.body.data.quantity).toBe(50);
    expect(res.body.data.name).toBe(validProduct.name);
  });

  it('returns 404 for non-existent id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).put(`/api/products/${fakeId}`).send({ price: 10 });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid id format', async () => {
    const res = await request(app).put('/api/products/bad-id').send({ price: 10 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when update has invalid price', async () => {
    const created = await request(app).post('/api/products').send(validProduct);
    const id = created.body.data._id;
    const res = await request(app).put(`/api/products/${id}`).send({ price: -1 });
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate sku update', async () => {
    await request(app).post('/api/products').send(validProduct);
    const second = await request(app)
      .post('/api/products')
      .send({ ...validProduct, sku: 'TW-002', name: 'Widget 2' });
    const id = second.body.data._id;

    const res = await request(app)
      .put(`/api/products/${id}`)
      .send({ sku: validProduct.sku });
    expect(res.status).toBe(409);
  });
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────

describe('DELETE /api/products/:id', () => {
  it('deletes a product and returns 200', async () => {
    const created = await request(app).post('/api/products').send(validProduct);
    const id = created.body.data._id;

    const res = await request(app).delete(`/api/products/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});

    const check = await request(app).get(`/api/products/${id}`);
    expect(check.status).toBe(404);
  });

  it('returns 404 for non-existent id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/api/products/${fakeId}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid id format', async () => {
    const res = await request(app).delete('/api/products/bad-id');
    expect(res.status).toBe(400);
  });
});
