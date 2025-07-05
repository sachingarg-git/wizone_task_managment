# TaskFlow - Task Management & Performance Tracking System

## Overview

TaskFlow is a comprehensive task management and performance tracking system built for ISP (Internet Service Provider) operations. The application provides a complete solution for managing tasks, customers, and performance metrics with user authentication and role-based access control.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Neon serverless)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store

### Database Architecture
- **ORM**: Drizzle ORM with type-safe queries
- **Database**: PostgreSQL with serverless connection pooling
- **Schema**: Centralized schema definition in shared directory
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication with PostgreSQL session store
- Role-based access control (admin, manager, engineer)
- Middleware for protected routes

### Core Entities
1. **Users**: User profiles with roles and departments
2. **Customers**: ISP customer management with service details
3. **Tasks**: Work order management with assignments and priorities
4. **Performance Metrics**: User performance tracking and scoring

### Frontend Components
- **Layout**: Fixed sidebar navigation with responsive design
- **Forms**: Modal-based forms for data entry
- **Tables**: Sortable, filterable data tables
- **Dashboard**: Statistics cards and recent activity views
- **UI Components**: Comprehensive component library with consistent styling

## Data Flow

### Request Flow
1. Client makes request through React Query
2. Request goes through authentication middleware
3. Express routes handle business logic
4. Drizzle ORM executes database queries
5. Response flows back through the same chain

### Authentication Flow
1. User accesses protected route
2. Middleware checks session validity
3. If unauthorized, redirects to Replit Auth
4. Successful auth creates user session
5. User data stored in PostgreSQL users table

### Form Submission Flow
1. Frontend validates data with Zod schemas
2. React Hook Form handles form state
3. TanStack Query mutations send data to API
4. Backend validates and processes request
5. Database updated via Drizzle ORM
6. UI updated with optimistic updates

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection Pooling**: @neondatabase/serverless for efficient connections

### Authentication
- **Replit Auth**: OpenID Connect provider
- **Session Storage**: PostgreSQL-backed session management

### UI Dependencies
- **Radix UI**: Headless component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety and developer experience
- **ESBuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development
- Vite dev server with HMR
- Express server with middleware mode
- Environment variables for database connection
- Replit development banner integration

### Production Build
1. Vite builds React application to `dist/public`
2. ESBuild bundles Express server to `dist/index.js`
3. Static files served from Express
4. Database migrations run via Drizzle Kit

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit authentication identifier
- `ISSUER_URL`: OpenID Connect provider URL

## Changelog
- July 04, 2025. Initial setup
- July 04, 2025. Added Backend Engineer and Field Engineer roles to task management
- July 04, 2025. Implemented hyperlinked task IDs with inline update modal
- July 04, 2025. Added task duration tracking, created/resolved timestamps, and comprehensive task details view
- July 04, 2025. Complete task history and audit system implemented:
  - Added task_updates table for full audit trail tracking
  - Created comprehensive tabbed task modal (Details, History, Update, Files)
  - Implemented file upload capabilities with image and document support
  - Added automatic audit logging for all task changes (status, notes, files)
  - Enhanced history display with timestamps, engineer attribution, and file attachments
  - Integrated real-time update tracking with proper user identification
- July 04, 2025. Advanced reporting and analytics system implemented:
  - Created comprehensive analytics dashboard with interactive charts
  - Added 5 key analytics sections: Overview, Performance, Trends, Engineers, Customers
  - Implemented real-time KPI monitoring with growth indicators
  - Added visual data representation using charts (pie, bar, line, area)
  - Created engineer performance tracking with completion rates and response times
  - Implemented customer analytics with satisfaction ratings and resolution times
  - Added flexible time range filtering (7 days to 1 year)
  - Integrated export capabilities for reporting
- July 04, 2025. Custom domain hosting system implemented:
  - Created comprehensive domain management infrastructure with database support
  - Added domain validation middleware and CORS setup for multiple domains
  - Implemented domain management UI with create, update, delete functionality
  - Added SSL certificate configuration and status tracking
  - Created domain statistics dashboard with active/pending/inactive counts
  - Integrated domain ownership and authentication controls
  - Added support for custom domains and wildcard domain matching
  - Implemented domain-based access control and validation system
- July 05, 2025. Traditional username/password authentication system implemented:
  - Replaced Replit Auth with traditional login panel using username and password
  - Created beautiful login form with password visibility toggle and demo credentials
  - Implemented secure password hashing using scrypt algorithm
  - Added username and password fields to users database table
  - Created session-based authentication with PostgreSQL session storage
  - Updated all authentication endpoints (/api/auth/login, /api/auth/user, /api/auth/logout)
  - Added authentication middleware for protected routes
  - Set up admin user with credentials: admin/admin123
- July 05, 2025. Complete branding update to "Wizone IT Support Portal":
  - Updated application branding from "TaskFlow" to "Wizone IT Support Portal"
  - Integrated official Wizone logo throughout the application (sidebar and login page)
  - Updated color theme to cyan-blue color scheme (hsl(195, 85%, 41%))
  - Fixed logout functionality to properly redirect to /login page
  - Added comprehensive meta tags and page title
  - Enhanced user creation form with username and password fields
  - Updated all authentication flows to work with new branding
- July 05, 2025. Critical database and functionality fixes completed:
  - Fixed missing 'title' column in tasks table with SQL migration
  - Renamed 'notes' to 'note' column in task_updates table for consistency
  - Resolved authentication middleware user object structure issues
  - Fixed task creation form by adding required title field to frontend form
  - Corrected all field name inconsistencies between schema and implementation
  - Fixed user creation functionality with proper ES6 imports for crypto functions
  - Resolved all major database schema synchronization issues
- July 05, 2025. SQL Connection Setup Module implemented:
  - Created comprehensive database schema for external SQL server connections
  - Added secure credential management with password encryption in storage
  - Implemented complete CRUD operations for SQL connections (create, read, update, delete)
  - Built connection testing functionality with status tracking (success/failed/pending/never_tested)
  - Created responsive frontend interface with form validation and secure credential input
  - Added SQL Connections navigation item accessible from main navigation for admin users
  - Integrated connection statistics dashboard with active connections, SSL status, and test results
  - Implemented secure API endpoints with password hiding in responses for security
  - Added support for multiple database types (PostgreSQL, MySQL, SQL Server, SQLite)
  - Created comprehensive connection management UI with test, edit, and delete capabilities
- July 05, 2025. Automatic Database Creation System completed:
  - Fixed SQL Server connection format to use proper host:port separation instead of comma format
  - Implemented automatic database creation - system checks if database exists and creates it automatically
  - Added live database execution capability - no manual script running required
  - Successfully connected to live SQL Server (122.176.151.226:1440) and created complete table structure
  - Automatically created 6 tables: users, customers, tasks, task_updates, performance_metrics, sessions
  - Implemented automatic sample data seeding with 5 records (admin user, customers, field engineers)
  - Fixed mssql package import issues with proper ConnectionPool destructuring
  - System now production-ready for automatic database provisioning on any SQL Server
- July 05, 2025. Login authentication and password reset fixes:
  - Fixed critical password hashing inconsistency between user creation and authentication systems
  - Resolved "require is not defined" errors in ES module environment by using proper dynamic imports
  - Updated all password operations to use consistent hashing format (hash.salt)
  - Cleaned up duplicate admin users with conflicting password formats
  - Fixed user "manpreet" login credentials to work with password "admin123"
  - Updated both user creation and password reset endpoints to use unified hashPassword function
  - Exported hashPassword function from auth module for consistent usage across application
- July 05, 2025. Username management functionality implemented:
  - Added username field to user edit form with admin-only access restrictions
  - Implemented username validation and duplicate checking in backend API
  - Created secure username editing capability with proper form validation
  - Updated user management interface to display usernames for identification
  - Added role-based access control for username modification features
- July 05, 2025. Complete mobile application development:
  - Created comprehensive React Native mobile app with Expo framework
  - Implemented full feature parity with web version including all core functionality
  - Built 6 complete screens: Login, Dashboard, Tasks, Customers, Users, Profile
  - Integrated React Native Paper for Material Design UI components
  - Added React Navigation with bottom tab navigation and stack navigation
  - Implemented TanStack Query for server state management and caching
  - Created authentication context with AsyncStorage for credential persistence
  - Added comprehensive API integration layer connecting to existing backend
  - Built responsive layouts optimized for mobile devices with pull-to-refresh
  - Implemented role-based access control matching web application security
  - Added direct call and email integration for customer contact features
  - Created performance statistics display and user profile management
  - Included comprehensive error handling and loading states throughout app
  - Added TypeScript configuration and complete project documentation

## User Preferences

Preferred communication style: Simple, everyday language.