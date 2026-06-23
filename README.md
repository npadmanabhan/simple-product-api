# simple-product-api

A REST API for managing products, built with Node.js, Express, and MongoDB.

## Stack

- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: MongoDB via Mongoose 9
- **Testing**: Jest + Supertest + mongodb-memory-server

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set MONGO_URI to your MongoDB connection string

# 3. Run in development mode
npm run dev

# 4. Run in production
npm start
```

## Environment Variables

| Variable    | Description                | Default                                 |
|-------------|----------------------------|-----------------------------------------|
| `PORT`      | Port the server listens on | `3000`                                  |
| `MONGO_URI` | MongoDB connection string  | `mongodb://localhost:27017/product-api` |

## API Reference

### Product Schema

| Field      | Type    | Required | Constraints             |
|------------|---------|----------|-------------------------|
| `name`     | string  | yes      | non-empty               |
| `sku`      | string  | yes      | unique, stored uppercase|
| `price`    | number  | yes      | >= 0                    |
| `quantity` | integer | yes      | >= 0                    |

---

### POST /api/products

Create a new product.

**Request**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget","sku":"WGT-001","price":9.99,"quantity":50}'
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Widget",
    "sku": "WGT-001",
    "price": 9.99,
    "quantity": 50,
    "createdAt": "2026-06-22T10:00:00.000Z",
    "updatedAt": "2026-06-22T10:00:00.000Z"
  }
}
```

---

### GET /api/products

Return all products, sorted by most recently created.

**Response `200`**
```json
{
  "success": true,
  "count": 2,
  "data": [ { ... }, { ... } ]
}
```

---

### GET /api/products/:id

Return a single product by its MongoDB ID.

**Response `200`**
```json
{
  "success": true,
  "data": { "_id": "...", "name": "Widget", "sku": "WGT-001", "price": 9.99, "quantity": 50 }
}
```

---

### PUT /api/products/:id

Partially update a product. All fields are optional; only provided fields are changed.

**Request**
```bash
curl -X PUT http://localhost:3000/api/products/664f1a2b3c4d5e6f7a8b9c0d \
  -H "Content-Type: application/json" \
  -d '{"price":14.99,"quantity":200}'
```

**Response `200`**
```json
{
  "success": true,
  "data": { "_id": "...", "name": "Widget", "sku": "WGT-001", "price": 14.99, "quantity": 200 }
}
```

---

### DELETE /api/products/:id

Delete a product by ID.

**Response `200`**
```json
{ "success": true, "data": {} }
```

---

## Error Responses

| Status | Cause                                  |
|--------|----------------------------------------|
| `400`  | Missing/invalid fields or invalid ID   |
| `404`  | Product not found                      |
| `409`  | Duplicate SKU                          |
| `500`  | Unexpected server error                |

**Error body**
```json
{ "success": false, "error": "description of the problem" }
```

---

## Testing

Tests use `mongodb-memory-server` — no running MongoDB instance needed.

```bash
npm test
```

20 tests covering all endpoints, validation rules, and error cases.
