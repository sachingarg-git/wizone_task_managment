# TaskFlow - Task Management & Performance Tracking System

## Overview
TaskFlow is a comprehensive task management and performance tracking system for ISP operations, managing tasks, customers, and performance metrics. It features user authentication, role-based access control, and real-time synchronization. The project includes both a web portal and a **native mobile application** built with React and Capacitor for field engineer operations.

## Recent Changes (January 2025)
- **COMPLETE MOBILE SOLUTION ACHIEVED** (January 13, 2025): Pure HTML mobile app with real-time task management fully operational
- **Task Display Issue FIXED**: Enhanced task filtering logic with comprehensive field name matching for engineer-specific tasks
- **Professional UI Upgrade**: Branded with "WIZONE IT NETWORK INDIA PVT LIMITED", blue "Wizone Field Engineer" title, hidden debug info
- **Real-time Functionality**: Auto-refresh tasks every 30 seconds with live status indicator
- **Login Form Stability**: Fixed JavaScript syntax errors that were causing form field resets
- **Mobile Dashboard Excellence**: User profile header, task statistics cards, and beautiful task cards with status colors
- **Native Mobile Experience**: No web view redirects - pure mobile interface with logout functionality
- **API Integration Success**: Direct connection to backend server (http://194.238.19.19:5000) with comprehensive error handling
- **Build Optimization**: Pure HTML approach (20.21 kB) for maximum WebView compatibility

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI/UX**: Modern light theme with a clean white background, colored icons, enhanced typography, redesigned sidebar, modernized login page, light-themed dashboard and header, enhanced stats cards with colored icons, and animated navigation.
- **Styling**: Tailwind CSS with CSS variables.
- **State Management**: TanStack Query (React Query) for server state.
- **Forms**: React Hook Form with Zod validation.
- **Routing**: Wouter for client-side routing.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules.
- **Authentication**: Custom username/password authentication with secure scrypt hashing and session-based management, including role-based access control (admin, manager, engineer).
- **Core Entities**: Users, Customers, Tasks, Performance Metrics.

### Database Architecture
- **Primary Database**: MS SQL Server.
- **ORM**: Drizzle ORM for schema definition.
- **Schema**: Centralized schema definition with automated table creation and sample data seeding.
- **Data Synchronization**: Real-time bidirectional synchronization between the web portal and SQL Server for users and tasks.

### Mobile Application
- **Platform**: Capacitor-based hybrid Android app with native React interface (no longer WebView).
- **Architecture**: React 18 + TypeScript + Vite with responsive mobile-first design.
- **UI/UX**: Modern mobile interface with bottom tab navigation, touch-optimized components, and gradient designs.
- **Authentication**: Secure token-based authentication with localStorage persistence and proper error handling.
- **Screens**: Login, Dashboard, Tasks, Customers, Users (admin), and Profile with full mobile responsiveness.
- **API Integration**: Direct connection to existing backend at http://194.238.19.19:5000.
- **Build Process**: Vite build → Capacitor sync → Android APK generation.

### System Design Choices
- **Authentication System**: Traditional username/password authentication with secure session management.
- **Task Management**: Comprehensive work order management with assignments, priorities, duration tracking, history, and audit trails.
- **Analytics**: Comprehensive dashboard with interactive charts, KPI monitoring, and engineer/customer performance tracking.
- **Customer Management**: Includes customer import functionality via Excel/CSV.
- **Internal Chat System**: Real-time messaging with user directory for internal engineer communication.
- **Deployment**: Designed for portability, supporting GoDaddy hosting, PM2 cluster, Nginx, and Docker containerization. Automated setup wizard for local SQL Server installation.
- **User Interface**: Focus on modern aesthetics with a light theme, colored icons, and smooth animations.
- **Real-time System**: WebSocket server with authentication, real-time broadcasting, mobile WebSocket service with auto-reconnection and live notifications, and real-time monitoring dashboard for admin portal including live user connections, task activity, and location tracking.

## External Dependencies
- **Database**: MS SQL Server.
- **UI/UX**: Radix UI (headless components), Lucide React (icons), Tailwind CSS.
- **Development Tools**: Vite, TypeScript, ESBuild.
- **Other Libraries**: `scrypt` for password hashing, `multer` for file uploads, `csv-parse` for CSV processing, Capacitor (for mobile WebView).