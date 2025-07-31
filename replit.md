# TaskFlow - Task Management & Performance Tracking System

## Overview
TaskFlow is a comprehensive task management and performance tracking system designed for Internet Service Provider (ISP) operations. It provides a complete solution for managing tasks, customers, and performance metrics, including user authentication and role-based access control. The project aims to streamline ISP operations, enhance customer service, and improve field engineer efficiency through real-time data synchronization and mobile accessibility. It supports advanced reporting and analytics, internal chat, and robust security features, making it a complete portal solution for IT support.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript.
- **UI/UX**: shadcn/ui components leveraging Radix UI primitives, styled with Tailwind CSS for a modern light theme with colored icons. The application features responsive design, smooth animations, and enhanced typography.
- **State Management**: TanStack Query for server state.
- **Forms**: React Hook Form with Zod validation.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript.
- **Database**: MS SQL Server as the primary data store, with Drizzle ORM for type-safe queries.
- **Authentication**: Custom username/password authentication with session management and role-based access control (admin, manager, engineer).
- **Core Features**:
    - Comprehensive task management with assignment, priority, duration tracking, and full audit trails.
    - Customer management with service details and import functionality (Excel/CSV).
    - User and role management.
    - Performance metrics and analytics dashboard with interactive charts and KPI monitoring.
    - Internal chat system for engineers.
    - Real-time SQL Server synchronization for data consistency.
    - Automated database creation and setup wizard for easy deployment.

### Mobile
- **Platform**: React Native (using Expo) and Capacitor-wrapped WebView applications.
- **Feature Parity**: Full feature parity with the web version, including task management, customer views, user profiles, and chat.
- **Field Engineer Specifics**: Dedicated mobile interface for field engineers with assigned task views, status updates, file attachments, and real-time GPS location tracking.
- **Deployment**: Supports APK generation via multiple methods (EAS Build, Android Studio, online builders) and Progressive Web App (PWA) installation.

## External Dependencies

### Database
- **MS SQL Server**: Primary relational database.

### Authentication
- Custom session-based authentication system.

### UI/UX
- **Radix UI**: Headless component primitives for UI.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework for styling.

### Development & Deployment Tools
- **Vite**: Fast build tool and development server.
- **TypeScript**: Language for type safety.
- **Drizzle ORM**: ORM for database interaction.
- **PM2**: Process manager for production scaling.
- **Docker**: Containerization for deployment.
- **Nginx**: Reverse proxy for production environments.