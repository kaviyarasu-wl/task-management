# Task Management SaaS

Full-stack multi-tenant task management application.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Query, Zustand |
| Backend | Node.js 20, Express, TypeScript, MongoDB, Redis, BullMQ, Socket.io |
| Auth | JWT (access + refresh tokens) |

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MongoDB & Redis (via Docker)

## Quick Start

```bash
# 1. Clone and install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start infrastructure (MongoDB + Redis)
docker compose -f backend/docker/docker-compose.yml up -d

# 4. Start development servers
cd backend && npm run dev    # API → http://localhost:3000
cd frontend && npm run dev   # App → http://localhost:5173
```

## Project Structure

```
.
├── backend/          # REST API + WebSocket server
│   ├── src/
│   │   ├── api/          # Routes, middleware, validators
│   │   ├── modules/      # Business domains (auth, task, project, etc.)
│   │   ├── core/         # Events, errors, utilities
│   │   ├── infrastructure/   # DB, cache, queue, websocket
│   │   └── config/       # Environment configuration
│   ├── tests/
│   └── docker/
│
└── frontend/         # React SPA
    └── src/
        ├── app/          # App setup, providers, router
        ├── features/     # Feature modules
        ├── pages/        # Route pages
        ├── layouts/      # Page layouts
        └── shared/       # Components, hooks, utilities
```

## Available Scripts

### Backend

```bash
npm run dev           # Dev server with hot reload
npm run build         # Compile TypeScript
npm run start         # Run production build
npm test              # Run all tests
npm run lint          # Lint code
```

### Frontend

```bash
npm run dev           # Dev server
npm run build         # Production build
npm run preview       # Preview production build
npm run lint          # Lint code
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/*` | Authentication (register, login, refresh, logout) |
| `GET/PATCH /api/v1/users/*` | User management |
| `GET/PATCH /api/v1/tenants/*` | Organization settings & members |
| `CRUD /api/v1/projects/*` | Project management |
| `CRUD /api/v1/tasks/*` | Task management |

## Features

- Multi-tenant architecture with role-based access (owner, admin, member)
- Real-time updates via WebSocket
- Background job processing with BullMQ
- Redis caching and rate limiting
- Cursor-based pagination
- Form validation with Zod

## License

MIT
