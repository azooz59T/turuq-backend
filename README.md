# Turuq Backend — User Data Handling API

A modular, secure RESTful API for managing user profiles (CRUD) with JWT
authentication, built on **Node.js + Express + Mongoose (MongoDB Atlas)**.
Built for the Turuq backend assessment, delivered incrementally via feature
branches → pull requests.

- **Live API:** _add after deploying — see [Deployment](#deployment)_
- **Interactive API docs (Swagger):** `<base-url>/api-docs`
- **Task 2 — delivery-slot pseudocode:** [DELIVERY_SLOTS_PSEUDOCODE.md](./DELIVERY_SLOTS_PSEUDOCODE.md)
- **Setup notes & challenges faced:** [CHALLENGES.md](./CHALLENGES.md)

---

## Features

- **User profile CRUD** — name, unique email, optional age, auto timestamps
- **JWT authentication** — register/login issue tokens; every `/users` route is protected
- **Validation & security** — Zod request validation, NoSQL-injection sanitization, bcrypt password hashing, helmet, CORS
- **Pagination & filtering** — `GET /users?page=&limit=&minAge=&maxAge=`, backed by indexes and efficient queries
- **Consistent error handling** — one JSON error envelope, correct status codes (400/401/404/409/500)
- **OpenAPI/Swagger docs** — interactive UI + a spec importable into Insomnia/Postman
- **Automated tests** — Vitest + Supertest against an in-memory MongoDB

---

## Tech stack

| Concern          | Choice                                             |
| ---------------- | -------------------------------------------------- |
| Runtime          | Node.js (ESM, `"type": "module"`)                  |
| Web framework    | Express 5                                          |
| Database / ODM   | MongoDB (Atlas) / Mongoose 9                        |
| Authentication   | JWT (`jsonwebtoken`) + `bcryptjs`                  |
| Validation       | Zod                                                |
| Security         | helmet, cors, request sanitization                 |
| API docs         | swagger-jsdoc + swagger-ui-express                 |
| Testing          | Vitest + Supertest + mongodb-memory-server         |
| Logging / config | morgan / dotenv                                    |

---

## Project structure

```
turuq-backend/
├── src/
│   ├── config/         env.js · db.js · swagger.js
│   ├── controllers/    auth.controller.js · user.controller.js
│   ├── middleware/     auth.js · validate.js · sanitize.js · errorHandler.js · notFound.js
│   ├── models/         account.model.js · user.model.js
│   ├── routes/         index.js · auth.routes.js · user.routes.js
│   ├── services/       auth.service.js · user.service.js
│   ├── utils/          ApiError.js · jwt.js
│   ├── validators/     auth.validation.js · user.validation.js
│   ├── app.js          Express app (middleware + routes), no `listen`
│   └── server.js       Entry point: connect DB → listen → graceful shutdown
├── tests/              setup.js · helpers.js · *.test.js
├── .env.example        Documented environment variables
├── render.yaml         Render deployment blueprint
├── vitest.config.js
├── DELIVERY_SLOTS_PSEUDOCODE.md   Task 2
├── CHALLENGES.md
└── package.json
```

Layers are separated on purpose — **routes → validation → controllers → services
→ models** — so business logic is testable in isolation and easy to extend.

---

## Prerequisites

- **Node.js ≥ 18** (developed on v22)
- A **MongoDB** database — **MongoDB Atlas** (free tier, recommended) or a local `mongod`

---

## Setup & run locally

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file and fill in the required values
cp .env.example .env
#   → set MONGODB_URI (Atlas connection string or local mongod URI)
#   → set JWT_SECRET  (any long random string)

# 3. Run
npm run dev      # development, auto-reload via nodemon
# or
npm start        # production-style start
```

On success:

```
✅ MongoDB connected
🚀 Server listening on http://localhost:5000 [development]
```

Quick check: open <http://localhost:5000/health> → `{"status":"ok",...}`.

> **Note on MongoDB Atlas:** the `mongodb+srv://` connection string needs a DNS
> TXT lookup that some networks/ISPs block (`queryTxt ETIMEOUT`). If you hit that,
> use the **standard seed-list** connection string instead — details in
> [CHALLENGES.md](./CHALLENGES.md).

---

## Environment variables

| Variable         | Required          | Default       | Description                                        |
| ---------------- | ----------------- | ------------- | -------------------------------------------------- |
| `NODE_ENV`       | no                | `development` | `development` \| `production` \| `test`            |
| `PORT`           | no                | `5000`        | HTTP port (Render sets this automatically)         |
| `MONGODB_URI`    | **yes**           | —             | MongoDB connection string                          |
| `JWT_SECRET`     | **yes**           | —             | Secret for signing JWTs (app won't boot without it)|
| `JWT_EXPIRES_IN` | no                | `1d`          | Token lifetime                                     |
| `API_PUBLIC_URL` | no (prod)         | —             | Deployed base URL, so Swagger targets the live API |

---

## Authentication

All `/users` endpoints require a **Bearer JWT**. Get one from `/auth`:

1. `POST /auth/register` (or `POST /auth/login`) with `{ email, password }` → returns a `token`.
2. Send it on every `/users` request: `Authorization: Bearer <token>`.

Accounts are stored separately from user profiles (email + **bcrypt-hashed**
password); the hash is never returned, and login gives a generic error to avoid
user enumeration.

---

## API reference

| Method | Path             | Auth | Description                                  |
| ------ | ---------------- | :--: | -------------------------------------------- |
| POST   | `/auth/register` |  —   | Create an account, receive a JWT             |
| POST   | `/auth/login`    |  —   | Log in, receive a JWT                        |
| POST   | `/users`         |  ✓   | Create a user profile                        |
| GET    | `/users`         |  ✓   | List users (pagination + optional age filter)|
| GET    | `/users/:id`     |  ✓   | Fetch a user by id                           |
| PUT    | `/users/:id`     |  ✓   | Update a user (name/email/age)               |
| DELETE | `/users/:id`     |  ✓   | Delete a user                                |
| GET    | `/health`        |  —   | Health probe (no DB dependency)              |
| GET    | `/api-docs`      |  —   | Swagger UI                                   |

### Example requests

```bash
# 1) Register (or /auth/login) to get a token
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}'
# → { "success": true, "data": { "account": { ... }, "token": "<JWT>" } }

TOKEN="<paste the JWT>"

# 2) Create a user
curl -X POST http://localhost:5000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Sara","email":"sara@example.com","age":30}'

# 3) List with pagination + age filter
curl "http://localhost:5000/users?page=1&limit=10&minAge=18&maxAge=40" \
  -H "Authorization: Bearer $TOKEN"

# 4) Fetch / update / delete by id
curl http://localhost:5000/users/<id> -H "Authorization: Bearer $TOKEN"
curl -X PUT http://localhost:5000/users/<id> \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"age":31}'
curl -X DELETE http://localhost:5000/users/<id> -H "Authorization: Bearer $TOKEN"
```

---

## API documentation (Swagger)

- **Interactive UI:** `<base-url>/api-docs` — click **Authorize**, paste a token, then use **Try it out** on any endpoint.
- **Raw OpenAPI spec:** `<base-url>/api-docs.json` — import into **Insomnia** or **Postman** (Import → From URL) for a ready-made request collection.

---

## Testing

```bash
npm test
```

Runs the Vitest suite against an **in-memory MongoDB** (no Atlas required, wiped
between tests): unit tests for model validation, plus integration tests for auth
(register/login, duplicates, wrong credentials) and the full protected `/users`
flow (CRUD, validation, pagination, age filter, 401 protection).

---

## Deployment

Deployed on **Render** (free tier). A [`render.yaml`](./render.yaml) blueprint is
included.

**Steps:**

1. Push this repo to GitHub.
2. Render → **New + → Blueprint** → connect the repo (Render reads `render.yaml`),
   or **New + → Web Service** with Build `npm install` and Start `npm start`.
3. Set the secret environment variables in the dashboard:
   - `MONGODB_URI` — your Atlas connection string
   - `JWT_SECRET` — a long random string
   - `API_PUBLIC_URL` — the service URL (after the first deploy), so the live Swagger works
4. Ensure Atlas **Network Access** allows `0.0.0.0/0` (already configured) so Render can connect.

> Free-tier services sleep after inactivity, so the first request after idle can
> take ~30–50s to wake.

---

## Task 2 — delivery slot allocation

Detailed pseudocode for dynamic, overbooking-safe delivery-slot allocation
(atomic conditional update as the concurrency guard, alternative-slot suggestion,
and transaction/saga escalation notes) is in
[DELIVERY_SLOTS_PSEUDOCODE.md](./DELIVERY_SLOTS_PSEUDOCODE.md).

---

## License

MIT
