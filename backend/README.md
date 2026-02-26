# Task SaaS — Node.js + TypeScript

Multi-tenant Task Management API built with production-grade architecture.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 + TypeScript (strict) |
| HTTP | Express.js |
| Database | MongoDB + Mongoose |
| Cache / PubSub | Redis (ioredis) |
| Job Queue | BullMQ |
| Real-time | Socket.io |
| Auth | JWT (access + refresh) + bcrypt |
| Validation | Zod |
| Testing | Jest + Supertest |
| Containers | Docker + Docker Compose |

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env — set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (32+ chars each)

# 3. Start infrastructure
docker compose -f docker/docker-compose.yml up -d

# 4. Run dev server
npm run dev
# → http://localhost:3000/health
```

## API Endpoints

```
POST   /api/v1/auth/register        Create account + new org
POST   /api/v1/auth/login           Login (returns access + refresh tokens)
POST   /api/v1/auth/refresh         Refresh access token
POST   /api/v1/auth/logout          Invalidate refresh token
GET    /api/v1/auth/me              Current user from token

GET    /api/v1/tenants/me           Get your organization
PATCH  /api/v1/tenants/me/settings  Update org settings (owner/admin)
GET    /api/v1/tenants/me/members   List members
PATCH  /api/v1/tenants/me/members/:userId/role  Change role (owner/admin)
DELETE /api/v1/tenants/me/members/:userId       Remove member (owner/admin)

GET    /api/v1/users                List users in tenant
GET    /api/v1/users/me             My profile
PATCH  /api/v1/users/me             Update my profile
GET    /api/v1/users/:id            Get user by ID

GET    /api/v1/projects             List projects (cursor paginated)
POST   /api/v1/projects             Create project
GET    /api/v1/projects/:id         Get project
PATCH  /api/v1/projects/:id         Update project
DELETE /api/v1/projects/:id         Delete project (owner/admin)

GET    /api/v1/tasks                List tasks (filtered + cursor paginated)
POST   /api/v1/tasks                Create task
GET    /api/v1/tasks/:id            Get task
PATCH  /api/v1/tasks/:id            Update task
DELETE /api/v1/tasks/:id            Delete task
```

## Architecture Rules (Never Break)

1. **No cross-module direct imports** — modules communicate via EventBus only
2. **Infrastructure never imports from modules** — workers accept injected processors
3. **process.env is ONLY in `config/index.ts`** — everywhere else imports the typed config object

## Folder Structure

```
task-saas/
├── src/
│   ├── api/
│   │   ├── middleware/       auth, errorHandler, rateLimit
│   │   ├── routes/           URL definitions only
│   │   └── validators/       Zod request schemas
│   ├── modules/              Business domains
│   │   ├── auth/
│   │   ├── notification/
│   │   ├── project/
│   │   ├── task/
│   │   ├── tenant/
│   │   └── user/
│   ├── core/
│   │   ├── context/          RequestContext (AsyncLocalStorage)
│   │   ├── errors/           AppError hierarchy
│   │   ├── events/           EventBus
│   │   └── utils/            asyncWrapper
│   ├── infrastructure/
│   │   ├── database/mongodb/ Mongoose connection + base model
│   │   ├── email/            nodemailer client
│   │   ├── queue/            BullMQ queues, workers, processors
│   │   ├── redis/            ioredis client, cache, streams
│   │   └── websocket/        Socket.io server
│   ├── config/               Zod-validated env (ONLY place process.env is touched)
│   ├── types/                Global TypeScript types
│   ├── app.ts                Express app setup
│   └── server.ts             Entry point + graceful shutdown
├── tests/
│   ├── fixtures/             Test data factories
│   ├── integration/          Route tests (real app, mocked DB)
│   └── unit/                 Service tests (mocked repository)
├── docker/
│   ├── Dockerfile            Multi-stage production build
│   ├── docker-compose.yml    Local dev (MongoDB + Redis)
│   └── docker-compose.prod.yml  Full stack production
└── ...config files
```

## Commands

```bash
npm run dev          # Dev server with hot reload (tsx watch)
npm run build        # Compile TypeScript → dist/
npm run start        # Run compiled production build
npm run typecheck    # Type check without emitting
npm run lint         # ESLint
npm run lint:fix     # ESLint + auto-fix
npm test             # All tests
npm run test:unit    # Unit tests only
npm run test:integration  # Integration tests only
```

## Event Flow

```
HTTP Request
  → Route → Middleware (auth → rateLimit → validator)
  → Controller → Service → Repository → MongoDB
  → Service emits EventBus event
  → notification.listener → BullMQ job enqueued
  → email.worker processes job → email sent
  → socket.server broadcasts to tenant room → browser updates
```

## Session Progress

| Session | Topic | Status |
|---------|-------|--------|
| S01 | Project Setup + Config | ✅ |
| S02 | MongoDB + Mongoose | ✅ |
| S03 | JWT Auth System | ✅ |
| S04 | Multi-tenancy + Roles | ✅ |
| S05 | CRUD + Repository Pattern | ✅ |
| S06 | EventBus | ✅ |
| S07 | Redis + Caching + Rate Limiting | ✅ |
| S08 | BullMQ + Background Jobs | ✅ |
| S09 | WebSocket + Real-time | ✅ |
| S10 | Testing + Docker + Final Wiring | ✅ |
