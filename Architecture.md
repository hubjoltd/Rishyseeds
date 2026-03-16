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

### March 16, 2026 (Push Notifications & Admin Leave Management)
- **Push Notifications (full stack)**: Web push notifications fully wired end-to-end.
  - `web-push` initialized in `server/routes.ts` with VAPID keys; `sendPushToEmployee()` helper used on all approval/rejection routes.
  - Push triggers added to: leave approve/reject, expense approve/reject, trip approve/reject.
  - `GET /api/push/vapid-public-key`, `POST /api/employee/push/subscribe`, `DELETE /api/employee/push/subscribe` routes added.
  - `client/src/lib/pushNotifications.ts` utility handles service worker registration, permission request, VAPID subscribe, and server save.
  - `EmployeeLayout.tsx` registers push notifications via `useEffect` after employee authenticates.
  - `client/public/sw.js` service worker handles push events and notification click navigation.
- **Admin Leave Management page** (`client/src/pages/AdminLeave.tsx`): Two-tab admin page.
  - **Leave Requests tab**: Filter by status (pending/approved/rejected/all), approve with one click, reject with inline reason input, push notification fires to employee on action.
  - **Leave Configuration tab**: Select employee from searchable list, configure annual quotas (SL/CL/PL/EL) and work schedule (weekly off, working hours), save via `POST /api/employee-config`.
  - Added to admin sidebar under HRMS section with `CalendarDays` icon.
  - Route `/admin-leave` added to `App.tsx`.
- **Files Modified**: `server/routes.ts`, `client/src/pages/AdminLeave.tsx` (new), `client/src/lib/pushNotifications.ts` (new), `client/src/pages/employee/EmployeeLayout.tsx`, `client/src/components/Sidebar.tsx`, `client/src/App.tsx`

### March 3, 2026 (Location in Punch Sharing & Attendance)
- **Location in WhatsApp Share**: Punch in/out WhatsApp share messages and Open Graph share pages now include the GPS location captured during punch.
- **Employee Attendance Location Column**: Employee's own attendance history page now shows a Location column with the check-in location for each record.
- **Share Page Location**: The `/punch-share/:filename` OG preview page includes location in both the meta description and visible body text.
- **data-testid attributes**: Added to location display elements in Attendance and EmployeeAttendance pages.
- **Files Modified**: `client/src/pages/employee/EmployeeDashboard.tsx`, `client/src/pages/employee/EmployeeAttendance.tsx`, `client/src/pages/Attendance.tsx`, `server/routes.ts`

### March 1, 2026 (Warehouse & Product Seeding)
- **License-Based Seeding**: Wired `seedProductsAndWarehouses()` from `server/seed-data.ts` into the startup `seedDatabase()` function so all warehouses and products from the Telangana seed dealer license are automatically seeded on app start.
- **20 Warehouses**: Includes main office, plant, cold storage facilities (Gubba, GNR, Himalaya, etc.), and processing/packing locations across Medchal-Malkajigiri, Karimnagar, and Medak districts.
- **80+ Products**: Seeded with correct types — `notified` for government-notified varieties and `private_research` for Rishi's proprietary hybrids.
- **Type Fix**: Corrected product type from `private` to `private_research` to match frontend expectations in `Products.tsx`.
- **36 Employees Seeded**: All real employee data from the December 2025 salary sheet, with EMP001-EMP036 IDs, proper roles, departments, salary breakdowns (Basic+DA, HRA, other allowances), work locations, phone numbers, and email addresses. Departments include Management, Administration, Accounts, Quality, Production, Sales, Research, Packaging, Field, and Operations.
- **Files Modified**: `server/routes.ts`, `server/seed-data.ts`

### March 1, 2026 (Trip Tracking)
- **Trip Tracking & Expense Management**: Full feature with GPS capture, photo uploads, map visualization (Leaflet+OpenStreetMap), and admin approval workflow.
  - Schema: `trips` and `trip_visits` tables in `shared/schema.ts`
  - Backend: Storage methods in `server/storage.ts`, API routes with multer file uploads in `server/routes.ts`
  - Employee Portal: `client/src/pages/employee/EmployeeTrips.tsx` - start trips, add visits, end & submit
  - Admin Portal: `client/src/pages/Trips.tsx` - view all trips, map visualization, approve/reject
  - Navigation: Trip links added to both admin sidebar and employee sidebar
  - Dependencies: `leaflet`, `react-leaflet@4.2.1`, `@types/leaflet`, `multer`, `@types/multer`
  - File uploads stored in `uploads/` directory, served statically at `/uploads/`
  - Trip lifecycle: started → in_progress → submitted → approved/rejected
  - Role-based auth on admin trip routes (admin/manager only)

### March 1, 2026 (Earlier)
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
