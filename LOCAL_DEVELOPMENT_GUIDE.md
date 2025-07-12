# Local Development Guide - Wizone IT Support Portal

## Prerequisites

1. **Node.js 18+ and npm**: Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL Database**: Either local PostgreSQL or remote database connection

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd wizone-it-support-portal

# Install all dependencies
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/wizone_db

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# Development Settings
NODE_ENV=development
PORT=5000

# Replit Settings (for compatibility - can be left empty for local)
REPL_ID=local-development
ISSUER_URL=local
```

### 3. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Ubuntu/Debian:
sudo apt update && sudo apt install postgresql postgresql-contrib

# macOS with Homebrew:
brew install postgresql

# Windows: Download from postgresql.org

# Create database
sudo -u postgres createdb wizone_db
sudo -u postgres psql -c "CREATE USER wizone WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE wizone_db TO wizone;"
```

#### Option B: Use Existing Remote Database
Update the `DATABASE_URL` in your `.env` file to point to your remote PostgreSQL instance.

### 4. Database Migration

```bash
# Push schema to database (creates all tables)
npm run db:push

# Verify database connection
npm run db:check
```

## Running the Application

### Quick Start (Recommended)
```bash
# Run the automated startup script
./start-local.sh

# This will:
# - Check system requirements
# - Verify database connection
# - Install dependencies if needed
# - Start the development server
```

### Manual Development Mode
```bash
# Start the development server manually
npm run dev

# This will:
# - Start Express server on port 5000
# - Start Vite dev server with HMR
# - Serve both frontend and backend
```

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server with HMR
npm run dev:server   # Start only the Express server
npm run dev:client   # Start only the Vite dev server

# Database
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio for database management
npm run db:check     # Check database connection

# Build & Production
npm run build        # Build application for production
npm run build:client # Build only the frontend
npm run build:server # Build only the backend
npm start           # Start production server

# Utilities
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript type checking
```

## Local URLs

- **Application**: http://localhost:5000
- **API Endpoints**: http://localhost:5000/api/*
- **Database Studio**: Run `npm run db:studio` for database management UI

## Default Login Credentials

- **Username**: admin
- **Password**: admin123

## Troubleshooting

### Database Connection Issues
1. Verify PostgreSQL is running: `sudo service postgresql status`
2. Check DATABASE_URL format: `postgresql://username:password@host:port/database`
3. Test connection: `npm run db:check`

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Module Not Found Errors
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Check TypeScript errors
npm run type-check

# Check for missing dependencies
npm audit
npm install
```

## Development Features

- **Hot Module Replacement (HMR)**: Frontend changes reload instantly
- **API Auto-restart**: Backend restarts automatically on changes
- **TypeScript**: Full type safety across frontend and backend
- **Database Studio**: Visual database management with Drizzle Studio
- **Error Handling**: Comprehensive error logging and handling

## Production Deployment

For production deployment, see:
- `DEPLOYMENT.md` - General deployment guide
- `HOSTING_MIGRATION_GUIDE.md` - Custom domain hosting
- `MOBILE_APK_GUIDE.md` - Mobile app generation

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure database is accessible and contains the required tables
4. Try clearing cache and reinstalling dependencies