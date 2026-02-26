# Task SaaS Frontend

React SPA for the Task Management application.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18 |
| Language | TypeScript |
| Build | Vite |
| Styling | TailwindCSS |
| State | Zustand |
| Data Fetching | TanStack React Query |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |
| Real-time | Socket.io Client |
| Drag & Drop | dnd-kit |

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_URL (default: http://localhost:3000)

# Run dev server
npm run dev
# → http://localhost:5173
```

## Scripts

```bash
npm run dev       # Dev server with HMR
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
```

## Project Structure

```
src/
├── app/          # App configuration
│   ├── providers/    # React Query, Router setup
│   └── router/       # Route definitions
├── features/     # Feature modules
│   ├── auth/
│   ├── projects/
│   └── tasks/
├── pages/        # Route pages
├── layouts/      # Page layouts
├── shared/       # Shared utilities
│   ├── api/          # API client
│   ├── components/   # UI components
│   ├── hooks/        # Custom hooks
│   ├── stores/       # Zustand stores
│   └── types/        # TypeScript types
├── index.css     # Global styles
└── main.tsx      # Entry point
```

## Environment Variables

```env
VITE_API_URL=http://localhost:3000
```
