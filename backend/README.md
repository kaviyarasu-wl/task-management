# Task SaaS Backend

Multi-tenant Task Management REST API with real-time capabilities.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20, TypeScript |
| HTTP | Express.js |
| Database | MongoDB (Mongoose) |
| Cache | Redis (ioredis) |
| Queue | BullMQ |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Testing | Jest + Supertest |

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (32+ chars)

# Start MongoDB + Redis
docker compose -f docker/docker-compose.yml up -d

# Run dev server
npm run dev
# → http://localhost:3000/health
```

## Scripts

```bash
npm run dev              # Dev server (tsx watch)
npm run build            # Compile TypeScript
npm run start            # Production server
npm test                 # All tests
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run lint             # ESLint
npm run typecheck        # Type check
```

## API Endpoints

### Auth
```
POST   /api/v1/auth/register   Create account + organization
POST   /api/v1/auth/login      Login (returns tokens)
POST   /api/v1/auth/refresh    Refresh access token
POST   /api/v1/auth/logout     Invalidate refresh token
GET    /api/v1/auth/me         Current user
```

### Users
```
GET    /api/v1/users           List users in tenant
GET    /api/v1/users/me        My profile
PATCH  /api/v1/users/me        Update my profile
GET    /api/v1/users/:id       Get user
```

### Tenants
```
GET    /api/v1/tenants/me                      Get organization
PATCH  /api/v1/tenants/me/settings             Update settings
GET    /api/v1/tenants/me/members              List members
PATCH  /api/v1/tenants/me/members/:id/role     Change role
DELETE /api/v1/tenants/me/members/:id          Remove member
```

### Projects & Tasks
```
GET|POST        /api/v1/projects       List/Create projects
GET|PATCH|DEL   /api/v1/projects/:id   Get/Update/Delete project
GET|POST        /api/v1/tasks          List/Create tasks
GET|PATCH|DEL   /api/v1/tasks/:id      Get/Update/Delete task
```

## Architecture

```
src/
├── api/             # Routes, middleware, validators
├── modules/         # Business domains
│   ├── auth/
│   ├── user/
│   ├── tenant/
│   ├── project/
│   ├── task/
│   └── notification/
├── core/            # EventBus, errors, context
├── infrastructure/  # DB, cache, queue, websocket
└── config/          # Environment config
```

### Key Patterns

- **EventBus**: Cross-module communication without direct imports
- **Repository Pattern**: Data access abstraction
- **RequestContext**: AsyncLocalStorage for tenant/user context
- **Graceful Shutdown**: Proper cleanup of connections and workers
