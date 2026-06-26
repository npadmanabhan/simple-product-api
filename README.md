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

| Variable          | Description                                      | Default                                 |
|-------------------|--------------------------------------------------|-----------------------------------------|
| `PORT`            | Port the server listens on                       | `3000`                                  |
| `MONGO_URI`       | MongoDB connection string (**required**)         | —                                       |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins     | `http://localhost:5173`                 |
| `NODE_ENV`        | Runtime environment (`development`/`production`) | `development`                           |
| `LOG_LEVEL`       | Log verbosity (`error`/`warn`/`info`/`debug`)    | `info`                                  |

## Docker

### Build

```bash
docker build -t product-api .
```

### Run locally

Requires a reachable MongoDB instance. `host.docker.internal` resolves to the host machine on Docker Desktop (Mac/Windows/WSL2).

```bash
docker run --rm \
  -e MONGO_URI=mongodb://host.docker.internal:27017/product-api \
  -e ALLOWED_ORIGINS=http://localhost:8080 \
  -p 3000:3000 \
  product-api
```

Verify the container is healthy:

```bash
curl http://localhost:3000/health
# {"status":"ok","db":"connected"}
```

### Cloud Run

Cloud Run injects a `PORT` environment variable automatically — the server reads it via `process.env.PORT`. Set the remaining variables as Cloud Run environment variables or Secret Manager references:

| Variable          | Where to set              |
|-------------------|---------------------------|
| `MONGO_URI`       | Secret Manager (sensitive)|
| `ALLOWED_ORIGINS` | Cloud Run env var         |
| `LOG_LEVEL`       | Cloud Run env var         |

The `/health` endpoint returns `200` when MongoDB is reachable and `503` when it is not — configure it as the Cloud Run health check path.

---

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

---

## CI/CD

The pipeline (`.github/workflows/ci.yml`) runs on every push and pull request to `master`:

1. **Test** — `npm ci` + `npm test` (runs on PRs and pushes)
2. **Build & Push** — builds the Docker image and pushes to Google Artifact Registry (pushes to `master` only)

Images are tagged `latest` and `sha-<short>` (e.g. `sha-a1b2c3d`) for immutable rollbacks.

### Required GitHub configuration

Set the following in **Settings → Secrets and variables → Actions**:

| Name | Type | Value |
|------|------|-------|
| `WIF_PROVIDER` | Secret | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `WIF_SERVICE_ACCOUNT` | Secret | `github-actions@PROJECT_ID.iam.gserviceaccount.com` |
| `GCP_PROJECT_ID` | Variable | your GCP project ID |
| `GAR_REGION` | Variable | Artifact Registry region, e.g. `us-central1` |
| `GAR_REPO` | Variable | Artifact Registry repository name, e.g. `product-images` |

### One-time GCP setup

```bash
export PROJECT_ID=<your-project-id>
export REGION=us-central1
export REPO=product-images
export SA=github-actions

# Artifact Registry repository
gcloud artifacts repositories create $REPO \
  --repository-format=docker --location=$REGION --project=$PROJECT_ID

# Service account
gcloud iam service-accounts create $SA --project=$PROJECT_ID

# Grant push access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Workload Identity Pool
gcloud iam workload-identity-pools create github-pool \
  --location=global --project=$PROJECT_ID

# GitHub OIDC provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --project=$PROJECT_ID

# Allow this repo to impersonate the service account
POOL_RESOURCE=$(gcloud iam workload-identity-pools describe github-pool \
  --location=global --project=$PROJECT_ID --format='value(name)')

gcloud iam service-accounts add-iam-policy-binding \
  $SA@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/$POOL_RESOURCE/attribute.repository/npadmanabhan/simple-product-api"
```

Retrieve the values for the GitHub secrets:

```bash
# WIF_PROVIDER
gcloud iam workload-identity-pools providers describe github-provider \
  --location=global --workload-identity-pool=github-pool \
  --project=$PROJECT_ID --format='value(name)'

# WIF_SERVICE_ACCOUNT
echo "$SA@$PROJECT_ID.iam.gserviceaccount.com"
```
