# Rishi Seeds - Seed Management & HRMS Platform

## Overview
A full-stack web application for managing seed inventory, HRMS (Human Resource Management), employee tracking, and dispatch operations for Rishi Seeds. Built with Express + React + TypeScript.

## Architecture
- **Frontend**: React 18 + Vite, TypeScript, TailwindCSS, shadcn/ui, Wouter routing
- **Backend**: Express 5 (Node.js), TypeScript, served via `tsx` in dev mode
- **Database**: PostgreSQL via Drizzle ORM (`node-postgres`)
- **Auth**: Passport.js (local strategy), express-session
- **Build**: Vite for frontend, esbuild for backend (`script/build.ts`)
- **Dev server**: Combined - Express serves both the API and Vite middleware on port 5000

## Key Features
- Seed lot/batch tracking (inward, processing, outward, returns)
- Stock management with location-wise balances
- HRMS: employees, attendance, payroll
- Trip tracking with GPS check-in/out
- Customer visit tracking
- Role-based access control
- Push notifications (web-push)
- File uploads (multer)

## Project Layout
```
client/          # React frontend (Vite root)
  src/
    pages/       # Route-level pages
    components/  # Shared UI components
    hooks/       # Custom React hooks
server/          # Express backend
  index.ts       # App entry point
  routes.ts      # API routes
  db.ts          # Drizzle DB connection
  storage.ts     # Data access layer
  vite.ts        # Dev Vite middleware setup
shared/
  schema.ts      # Drizzle schema (shared between client & server)
  routes.ts      # Shared route definitions
```

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `PORT` - Server port (default: 5000)
- `SESSION_SECRET` - Express session secret

## Development
```bash
npm run dev       # Start dev server (port 5000)
npm run build     # Build for production
npm run db:push   # Push schema changes to database
```

## Deployment
- Target: Autoscale
- Build: `npm run build`
- Run: `node ./dist/index.cjs`
