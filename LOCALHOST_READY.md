# Wizone IT Support Portal - Localhost Ready! 🚀

Your complete npm package configuration is now ready for localhost development.

## ⚡ Quick Start (One Command Setup)

```bash
# Run this single command to setup everything:
chmod +x LOCAL_SETUP_COMMANDS.sh && ./LOCAL_SETUP_COMMANDS.sh
```

## 📋 Manual Setup (Step by Step)

```bash
# 1. Copy local package configuration
cp package-local.json package.json

# 2. Copy local Vite configuration  
cp vite.config.local.ts vite.config.ts

# 3. Setup environment
cp .env.example .env
# Edit .env and update your DATABASE_URL

# 4. Install dependencies
npm install

# 5. Setup database
npm run db:push
npm run db:seed

# 6. Start development
npm run dev
```

## 🌐 Application URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | React application with HMR |
| Backend API | http://localhost:5000 | Express server and API |
| Database Studio | http://localhost:4983 | Visual database manager |
| Production Preview | http://localhost:4173 | Production build preview |

## 🛠️ Available NPM Commands

### Development
```bash
npm run dev          # Start both frontend (3000) + backend (5000)
npm run dev:server   # Start only backend on port 5000
npm run dev:client   # Start only frontend on port 3000
npm run dev:full     # Start integrated mode (like Replit)
```

### Build & Production
```bash
npm run build        # Build both frontend and backend
npm run build:client # Build only React frontend
npm run build:server # Build only Express backend
npm run start        # Start production server
npm run serve        # Build and start production
npm run preview      # Preview production build
```

### Database Management
```bash
npm run db:check     # Test database connection
npm run db:push      # Create/update database schema
npm run db:studio    # Open visual database manager
npm run db:seed      # Add sample data
npm run db:migrate   # Run database migrations
```

### Code Quality
```bash
npm run check        # TypeScript type checking
npm run type-check   # Same as check
npm run lint         # ESLint with auto-fix
npm run lint:check   # ESLint check only
npm run format       # Prettier formatting
```

### Utilities
```bash
npm run setup        # Run setup wizard
npm run setup:env    # Copy environment template
npm run setup:db     # Setup database schema + seed
npm run clean        # Clean build cache
npm run clean:all    # Clean everything including node_modules
npm run reinstall    # Full clean reinstall
npm run health       # Check if server is running
npm run logs         # View application logs
```

## 🔑 Default Login Credentials

- **Username:** `admin`
- **Password:** `admin123`

## 🗄️ Database Configuration

Update your `.env` file with your PostgreSQL credentials:

```env
# Local PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/wizone_db

# Remote PostgreSQL  
DATABASE_URL=postgresql://username:password@host:port/database_name
```

## 🔧 Features Configured

✅ **Frontend Development**
- React with TypeScript
- Vite with HMR on localhost:3000
- TailwindCSS with custom animations
- Shadcn/ui components

✅ **Backend Development** 
- Express server on localhost:5000
- PostgreSQL with Drizzle ORM
- Session-based authentication
- File uploads and API routes

✅ **Database Management**
- Drizzle Studio on localhost:4983
- Automatic schema migrations
- Sample data seeding
- Connection testing

✅ **Development Tools**
- TypeScript type checking
- ESLint with auto-fixing
- Prettier code formatting
- Concurrent development servers

✅ **Production Ready**
- Optimized builds with chunking
- Production server mode
- Health checks and monitoring
- Static file serving

## 🚨 Troubleshooting

### Missing build command error:
```bash
cp package-local.json package.json
npm install
```

### Database connection issues:
```bash
# Check connection
npm run db:check

# Reset database
npm run db:push
npm run db:seed
```

### Port already in use:
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Clean restart:
```bash
npm run clean:all
npm install
npm run setup:db
npm run dev
```

## 🎉 You're Ready!

Your Wizone IT Support Portal is now fully configured for localhost development with all npm commands working perfectly!