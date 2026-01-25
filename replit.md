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

### January 25, 2026 (Latest)
- **Admin Notifications System**: Bell icon in admin sidebar shows real-time notifications for employee activities. Tracks punch in/out, inward, processing, packing, stock movement, and outward operations. Unread count badge, mark as read, and mark all read functionality.
- **Created By Tracking**: All plant operations records (Inward, Processing, Packing, Stock Movement, Outward) now store createdBy employee ID. Admin portal displays "Created By" column showing employee names. Employee portal automatically populates createdBy when creating new records.
- **Complete Employee CRUD**: All 5 plant operations pages (Inward, Processing, Packing, Stock Movement, Outward) now have complete Add/Edit/Delete functionality with working dialogs, form validation, and proper state management
- **Edit Functionality**: Each page has handleEdit function with form pre-population, updateMutation for PUT requests, and dynamic dialog titles based on create/edit mode
- **Employee Portal Action Buttons**: All 5 plant operations pages now show Add/Edit/Delete buttons based on employee's role permissions
- **Role-Based Employee Portal**: Employee sidebar now displays menu items based on their role permissions (configured in Roles page)
- **Employee Permissions API**: New endpoint `/api/employee/permissions` returns permissions based on employee's role from roles table
- **Employee Portal Plant Operations**: Added Inward, Processing, Packing, Stock Movement, and Outward pages to employee portal with collapsible sidebar section
- **Production Database Seeding**: Script to seed Neon production database with 22 locations/warehouses and 67 product varieties from Telangana license document
- **Responsive Employee Sidebar**: Collapsible Plant Operations section with all seed operations pages
- **Inward Edit Fix**: Fixed edit button text to show "Save Changes" when editing and proper disabled state using `isUpdating`
- **State-Based Destinations**: Added state codes (AP, TS, MP, UP, KA, CG) as destination types in Outward/Dispatch
- **Variety Field in Dispatch**: Added product variety field to outward/dispatch records for better tracking
- **Employee Portal**: Separate login page at `/employee-login` for employees to access their dashboard
- **Punch In/Out System**: Employees can punch in/out for attendance tracking with real-time status
- **Employee Attendance History**: Employees can view their complete attendance history
- **Downloadable Payslips**: Employees can download payslips as HTML (with HTML sanitization for security)
- **Role Management**: New Roles page at `/roles` for creating and managing custom roles with granular permissions
- **Permission Matrix**: Roles can have view/create/edit/delete permissions for all resources
- **Administration Section**: New sidebar section with Users and Roles links

### January 2026
- **New Lot Number Format**: Lot numbers now follow format MA-[variety last 2 digits]-26-001 (e.g., MA-S5-26-001)
- **Inward Edit Feature**: Added Edit button to Inward page for updating lot details (source, quantity, dates, remarks)
- **Stock Balance on Inward**: Creating an inward entry now automatically creates a stock_balance record with correct location
- **Variety Display**: All pages (Stock Movement, Packaging, Processing, Outward) now show lot number with product variety
- **Processing Dropdowns Updated**:
  - Processing Type: Cleaning, Processing, Drying (removed Grading and Treatment)
  - Processed By: Old Machine, New Machine (dropdown instead of text input)
- **Stock Forms Renamed**: "Loose" renamed to "Raw Seeds", added "Cobs" as new option
- **Stock Movement uses Lots**: Stock Movement page now uses Lot Numbers instead of Batches, with auto-display of product name and received quantity when a lot is selected
- **Comprehensive Stock Reports**: Updated Reports page with 5 report types - Lot Stock, Variety-wise, Location-wise, Outward Log, and Processing reports with CSV export
- **Stock Validation on Outward**: Server-side validation prevents dispatching more stock than available
- **New Operator Roles**: Added Godown Operator, Production Operator, and Dispatch Operator roles with specific permissions
- **Packaging Size Master**: New master data screen for managing standard package sizes (1kg, 5kg, 25kg, etc.)
- **Plant Operations**: Renamed "Seed Operations" to "Plant Operations" in sidebar navigation
- **Inward Enhancements**: Added Source/Supplier name field and Tons/KG quantity conversion (stored in KG)
- **Processing Workflow**: Complete processing with input lot, output quantity, waste tracking, and auto-generation of output lot
- **Packaging Improvements**: Uses Lots, integrates with Packaging Sizes master, shows remaining loose stock

### January 2026
- **Granular Role Privileges**: Implemented resource-based permission system (view, create, edit, delete) per role:
  - Admin: Full access to all resources
  - Manager: Full access to plant operations (lots, locations, stock, packaging, products); view-only for HRMS
  - HR: Full access to HRMS (employees, attendance, payroll); view-only for plant operations
- **Permissions API**: New `/api/auth/permissions` endpoint returns user's role and permissions matrix
- **Permission-Based UI**: Delete buttons conditionally shown based on user's delete permission for each resource
- **Warehouse Rename**: "Locations" renamed to "Warehouses" throughout the UI for better business context
- **Stock Movement Delete**: Added ability to delete stock movements with confirmation dialog
- **Packaging Delete**: Added ability to delete packaging records with confirmation dialog
- **User Management**: Admin-only Users & Roles page with CRUD operations for managing system users and role assignments (admin/manager/hr)
- **Products Page**: Complete product/crop management with 67 varieties (notified + private research) from license document
- **Reports Page**: Comprehensive reporting with Stock, Movements, Locations, and Batch Summary reports with CSV export and print functionality
- **Collapsible Sidebar**: Modern sidebar with nested navigation (Seed Operations, HRMS, Finance) that collapses from 260px to 72px
- **Modern UI Design**: Borderless cards with subtle shadows, gradient stat cards, glassmorphism for modals
- **Batch Management**: Full CRUD operations (Create, Read, Update, Delete) with confirmation dialogs
- **Stock Movement Validation**: Server-side validation prevents moving more stock than available in a batch
- **Packaging Output**: New page for recording packaging production with waste tracking
- **Error Handling**: Improved error propagation from server to UI with toast notifications
- **IStorage Interface**: Added updateBatch, deleteBatch, getProducts, createProduct, getUsers, updateUser, deleteUser, deleteLocation, updateStockMovement, deleteStockMovement, updatePackagingOutput, deletePackagingOutput methods
- **Zod Validation**: User creation and update routes use Zod schemas for input validation and role enum enforcement

## Default Admin Credentials
- Username: `admin`
- Password: `admin123`

## Employee Portal Credentials
- Login URL: `/employee-login`
- Employee ID: The employee's assigned ID (e.g., EMP001)
- Password: Same as Employee ID if not explicitly set