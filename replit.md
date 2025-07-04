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

## User Preferences

Preferred communication style: Simple, everyday language.