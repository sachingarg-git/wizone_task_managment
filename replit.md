# TaskFlow - Task Management & Performance Tracking System

## Overview
TaskFlow is a comprehensive task management and performance tracking system designed for ISP operations. It provides a complete solution for managing tasks, customers, and performance metrics, featuring user authentication, role-based access control, and real-time synchronization capabilities. The project aims to deliver a robust, scalable, and user-friendly platform for efficient IT support and field engineer operations, with ambitions for cross-platform availability and seamless data management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI/UX**: Modern light theme with a clean white background, colored icons, and enhanced typography. Features include a redesigned sidebar, modernized login page, light-themed dashboard and header, enhanced stats cards with colored icons, and animated navigation.
- **Styling**: Tailwind CSS with CSS variables.
- **State Management**: TanStack Query (React Query) for server state.
- **Forms**: React Hook Form with Zod validation.
- **Routing**: Wouter for client-side routing.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules.
- **Database ORM**: Drizzle ORM (previously) / MSSQL for primary storage.
- **Authentication**: Custom username/password authentication with secure scrypt hashing and session-based management. Role-based access control (admin, manager, engineer).
- **Core Entities**: Users, Customers, Tasks, Performance Metrics.

### Database Architecture
- **Primary Database**: MS SQL Server.
- **ORM**: Drizzle ORM for schema definition.
- **Schema**: Centralized schema definition with automated table creation and sample data seeding.
- **Data Synchronization**: Real-time bidirectional synchronization between the web portal and SQL Server for users and tasks.

### Mobile Application
- **Platform**: React Native (Expo) and WebView-based Android applications.
- **Feature Parity**: Full feature parity with the web version, including core functionality, authentication, task management, customer data, and analytics.
- **Specific Features**: Dedicated field engineer mobile interface with task assignment viewing, status updates, file attachments, and GPS location tracking.
- **Connectivity**: Network-resilient architecture with dynamic server detection and offline capabilities.
- **APK Generation**: Multiple methods for APK generation including Android Studio, online builders, and PWA installation.

### System Design Choices
- **Authentication System**: Traditional username/password authentication with secure session management.
- **Task Management**: Comprehensive work order management with assignments, priorities, duration tracking, history, and audit trails.
- **Analytics**: Comprehensive dashboard with interactive charts, KPI monitoring, and engineer/customer performance tracking.
- **Customer Management**: Includes customer import functionality via Excel/CSV.
- **Internal Chat System**: Real-time messaging with user directory for internal engineer communication.
- **Deployment**: Designed for portability, supporting GoDaddy hosting, PM2 cluster, Nginx, and Docker containerization. Automated setup wizard for local SQL Server installation.
- **User Interface**: Focus on modern aesthetics with a light theme, colored icons, and smooth animations.

## Recent Success (August 2, 2025)
**Mobile APK Authentication Issue - COMPLETELY RESOLVED:**
- **Mobile APK connectivity established**: Successfully connecting to production server (http://194.238.19.19:5000/)
- **Authentication system fixed**: Added missing admin login endpoint (`/api/auth/login`) with Passport authentication
- **Database integration confirmed**: Mobile login now properly authenticates against MS SQL Server database
- **Session management working**: Passport sessions correctly created and maintained for mobile WebView
- **Production testing successful**: Admin login confirmed working with credentials (admin/admin123)
- **Mobile APK package updated**: Created production-ready APK package with proper WebView settings
- **Cross-platform compatibility**: Authentication now works identically for both web portal and mobile APK

**Previous Success (August 1, 2025) - Customer Portal:**
- Fixed auto-disable issue where portal access would revert after enabling
- Database persistence now working correctly (portalAccess column properly updated)
- Frontend toggle state now sends correct values to backend
- Customer portal login functionality fully operational (200 status)
- Customer task creation issue resolved with proper customer name display
- Task update functionality completely fixed for both customer and admin portals
- Database constraint issues resolved with proper status validation
- Missing storage functions added: getCustomerByUsername, getTasksByCustomer, getTaskComments, createTaskComment

## External Dependencies
- **Database**: MS SQL Server (primary storage), Neon PostgreSQL (previously).
- **Authentication**: Replit Auth (previously).
- **UI/UX**: Radix UI (headless components), Lucide React (icons), Tailwind CSS.
- **Development Tools**: Vite, TypeScript, ESBuild.
- **Other Libraries**: `scrypt` for password hashing, `multer` for file uploads, `csv-parse` for CSV processing, Capacitor (for mobile WebView).