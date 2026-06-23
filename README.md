# Product API

A production-quality REST API for managing products, built with Node.js, Express, and MongoDB.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set MONGO_URI to your MongoDB connection string

# 3. Run in development mode (requires nodemon)
npm run dev

# 4. Run in production
npm start
```

## Environment Variables

| Variable    | Description                         | Default                                    |
|-------------|-------------------------------------|--------------------------------------------|
| `PORT`      | Port the server listens on          | `3000`                                     |
| `MONGO_URI` | MongoDB connection string           | `mongodb://localhost:27017/product-api`    |

## API Endpoints

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | `/api/products`       | Create a product         |
| GET    | `/api/products`       | List all products        |
| GET    | `/api/products/:id`   | Get a product by ID      |
| PUT    | `/api/products/:id`   | Update a product by ID   |
| DELETE | `/api/products/:id`   | Delete a product by ID   |

### Product Schema

```json
{
  "name":     "string (required)",
  "sku":      "string (required, unique, uppercase)",
  "price":    "number (required, >= 0)",
  "quantity": "integer (required, >= 0)"
}
```

### Example Request

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget","sku":"WGT-001","price":9.99,"quantity":50}'
```

## Testing

Tests use `mongodb-memory-server` — no running MongoDB instance needed.

```bash
npm test
```
