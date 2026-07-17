# Turuq Backend — User Data Handling API

A modular, secure RESTful API for managing user profiles (CRUD) with JWT-based
authentication, built on **Node.js + Express + Mongoose (MongoDB)**.

---

## Tech stack

| Concern            | Choice                                  |
| ------------------ | --------------------------------------- |
| Runtime            | Node.js (ESM, `"type": "module"`)       |
| Web framework      | Express                                 |
| Database / ODM     | MongoDB / Mongoose                      |
| Config             | dotenv                                   |
| Security headers   | helmet                                   |
| CORS               | cors                                     |
| HTTP logging       | morgan                                   |
| Auth _(planned)_   | JSON Web Tokens (jsonwebtoken)          |

---

## Project structure

```
turuq-backend/
├── src/
│   ├── config/
│   │   ├── env.js          # Centralized, typed environment config
│   │   └── db.js           # Mongoose connection (connect / disconnect)
│   ├── controllers/        # Request handlers                (per-feature PRs)
│   ├── models/             # Mongoose schemas & models       (per-feature PRs)
│   ├── routes/
│   │   └── index.js        # Root + /health; feature routers mounted here
│   ├── middleware/
│   │   ├── notFound.js     # 404 catch-all
│   │   └── errorHandler.js # Central JSON error handler
│   ├── validators/         # Input validation schemas        (per-feature PRs)
│   ├── utils/
│   │   └── ApiError.js     # Operational error w/ HTTP status code
│   ├── app.js              # Express app (middleware + routes), no `listen`
│   └── server.js           # Entry point: connect DB, then listen + shutdown
├── .env.example            # Documented environment variables
├── .gitignore
├── package.json
└── README.md
```

The split between `app.js` (pure Express app) and `server.js` (process/DB
concerns) keeps the app importable by integration tests without opening a port.

---

## Prerequisites

- **Node.js ≥ 18** (developed on v22)
- A **MongoDB** database — either:
  - **MongoDB Atlas** (free tier, recommended — no local install), or
  - a local `mongod` instance on `mongodb://127.0.0.1:27017`

---

## Setup & run locally

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file and fill in the values
cp .env.example .env
#   → set MONGODB_URI to your Atlas connection string or local mongod URI

# 3. Run
npm run dev      # development, auto-reload via nodemon
# or
npm start        # plain node
```

On success you'll see:

```
✅ MongoDB connected
🚀 Server listening on http://localhost:5000 [development]
```

### Quick smoke test

```bash
curl http://localhost:5000/health
# → {"status":"ok","uptime":<seconds>}
```

---

## Environment variables

| Variable         | Required | Default       | Description                                   |
| ---------------- | -------- | ------------- | --------------------------------------------- |
| `NODE_ENV`       | no       | `development` | `development` \| `production` \| `test`       |
| `PORT`           | no       | `5000`        | HTTP port                                     |
| `MONGODB_URI`    | **yes**  | —             | MongoDB connection string                     |
| `JWT_SECRET`     | *(auth)* | —             | Secret for signing JWTs                       |
| `JWT_EXPIRES_IN` | no       | `1d`          | Token lifetime                                |

---

## API endpoints

Implemented so far:

| Method | Path      | Auth | Description                          |
| ------ | --------- | ---- | ------------------------------------ |
| GET    | `/`       | —    | Liveness message                     |
| GET    | `/health` | —    | Health probe (no DB dependency)      |

Planned (see roadmap): full `/users` CRUD with pagination, age filtering, and
JWT protection.

---

## Roadmap

Task breakdown, delivered as sequential branches → PRs:

- [x] **Scaffold** — project structure, config, DB connection, error handling
- [ ] **User model** — Mongoose schema (name, email unique, age, timestamps) + indexes
- [ ] **Users CRUD** — `POST/GET/GET:id/PUT/DELETE` controllers & routes
- [ ] **Pagination & filtering** — `GET /users?page=&limit=&minAge=&maxAge=`
- [ ] **Validation & sanitization** — required fields, unique email, NoSQL-injection safety
- [ ] **Authentication** — JWT issue + verify middleware protecting the endpoints
- [ ] **API docs** — Swagger / Postman collection
- [ ] **Tests** — unit + integration (critical paths)
- [ ] **Deployment** — live URL (Render / Heroku) + example requests

---
