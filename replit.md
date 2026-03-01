# Rishi Seeds Admin Panel

## Overview

This is an internal admin panel for **Rishi Seeds**, a seed dealer/agricultural business. The application manages seed operations (storage, packaging, and stock movement) along with HRMS and payroll functions. It is designed for internal organizational use only—no public signup or login features are required.

The system tracks seed batches at the batch and location level, manages employees and attendance, generates payroll, and provides audit-ready movement records for inspections.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom agricultural theme (green primary color scheme)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Charts**: Recharts for dashboard visualizations

### Backend Architecture
- **Framework**: Express.js 5 on Node.js
- **Language**: TypeScript with ESM modules
- **API Design**: REST API with typed routes defined in `shared/routes.ts`
- **Session Management**: Express-session with MemoryStore (development) or connect-pg-simple (production)
- **Build Tool**: esbuild for server bundling, Vite for client

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Migrations**: Managed via drizzle-kit with `npm run db:push`

### Authentication
- **Method**: Session-based authentication (no JWT)
- **Storage**: Server-side sessions with user ID stored in session
- **Protected Routes**: Client-side route guards redirect unauthenticated users to login
- **Roles**: Supports admin, manager, and HR roles (defined in users table)

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # UI components including shadcn/ui
│       ├── hooks/        # Custom React hooks for data fetching
│       ├── pages/        # Page components (Dashboard, Batches, etc.)
│       └── lib/          # Utilities and query client setup
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client and server
│   ├── schema.ts     # Drizzle database schema definitions
│   └── routes.ts     # API route type definitions with Zod schemas
└── migrations/       # Database migration files
```

### Key Design Patterns
- **Shared Types**: Schema and route definitions in `shared/` ensure type safety between frontend and backend
- **Storage Interface**: `IStorage` interface in `server/storage.ts` abstracts database operations
- **Custom Hooks**: Domain-specific hooks (`use-inventory.ts`, `use-hrms.ts`) encapsulate API calls and caching logic

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database toolkit for TypeScript with PostgreSQL dialect

### UI Libraries
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component collection using Radix + Tailwind
- **Lucide React**: Icon library
- **Recharts**: Charting library for dashboard visualizations

### Development Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Fast server bundling for production
- **TypeScript**: Type checking across the full stack

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SESSION_SECRET`: Session encryption secret (required)

## Recent Changes

### March 1, 2026
- **Product Search (Combobox)**: Replaced standard `Select` components with a searchable `Combobox` in Stock, Processing, Packaging, and Outward pages to handle 262+ product varieties efficiently.
- **Product Uniqueness**: Added `.unique()` constraint to `products.variety` in `shared/schema.ts`.
- **Database Seeding**: Successfully seeded the database with the complete list of 262+ product varieties and standard packaging sizes (100g to 50kg).
- **Backend Enhancements**: Implemented full CRUD for Packaging Sizes in `IStorage` and verified API routes with role-based permission checks.
- **Project Build**: Verified project builds and starts correctly after schema changes.

### January 25, 2026
- **Product Variety Uniqueness**: Added `.unique()` constraint to `products.variety` in schema.
- **Enhanced Seed Data**: Updated seed script with complete list of 18 Maize, 3 Paddy, and 3 Cotton varieties.
- **Product & Employee CRUD**: Implemented full CRUD (Create, Read, Update, Delete) for Products and Employees in backend storage and routes.
- **Frontend Inventory Hooks**: Added `useCreateProduct`, `useUpdateProduct`, and `useDeleteProduct` hooks.
- **Location Detail Fixes**: Resolved 401 Unauthorized errors by adding auth headers to all fetch calls in `LocationDetail.tsx`.
- **Method Consistency**: Updated location and batch update hooks to use `PATCH` method to match server routes.

## Default Admin Credentials
- Username: `admin`
- Password: `admin123`

## Employee Portal Credentials
- Login URL: `/employee-login`
- Employee ID: The employee's assigned ID (e.g., EMP001)
- Password: Same as Employee ID if not explicitly set
