# Wizone IT Support Portal - Production Deployment Package

## Package Contents

This production package contains everything needed to deploy the Wizone IT Support Portal on any server:

### 📁 Core Application Files
- `dist/` - Compiled production build
- `server/` - Backend server code
- `shared/` - Shared schemas and types
- `uploads/` - File upload directory
- `node_modules/` - All dependencies included

### ⚙️ Configuration Files
- `package.json` - Production dependencies and scripts
- `ecosystem.config.js` - PM2 cluster configuration
- `nginx.conf.example` - Nginx reverse proxy setup
- `docker-compose.yml` - Docker containerization
- `Dockerfile` - Container build instructions

### 🗄️ Database Setup
- `wizone_database_schema.sql` - Complete database structure
- `wizone_sample_data.sql` - Sample data for testing
- `drizzle.config.ts` - Database migration configuration

### 🚀 Deployment Scripts
- `deploy.sh` - Automated deployment script
- `start-local.sh` - Local development startup
- `LOCAL_SETUP_COMMANDS.sh` - Quick setup commands

## Quick Start Deployment

### Option 1: Direct Node.js Deployment
```bash
# Extract the package
unzip wizone-portal-production.zip
cd wizone-portal-production

# Install dependencies (if not included)
npm install --production

# Set environment variables
cp .env.example .env
# Edit .env with your database credentials

# Start the application
npm start
```

### Option 2: PM2 Cluster Deployment
```bash
# Install PM2 globally
npm install -g pm2

# Start with cluster mode
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit
```

### Option 3: Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d

# Check status
docker-compose ps
```

## Environment Configuration

Create `.env` file with these variables:
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/wizone_db

# Session Configuration
SESSION_SECRET=your-super-secret-session-key

# Server Configuration
PORT=5000
NODE_ENV=production

# Optional: Custom Domain
DOMAIN=your-domain.com
```

## Database Setup

1. **PostgreSQL Database**:
   ```sql
   CREATE DATABASE wizone_db;
   ```

2. **Run Schema**:
   ```bash
   psql -U postgres -d wizone_db -f wizone_database_schema.sql
   ```

3. **Add Sample Data** (optional):
   ```bash
   psql -U postgres -d wizone_db -f wizone_sample_data.sql
   ```

## Default Login Credentials

### Admin Access
- **Username**: admin
- **Password**: admin123

### Field Engineer Access
- **Username**: RAVI
- **Password**: admin123

### Backend Engineer Access
- **Username**: helpdesk
- **Password**: admin123

## Features Included

✅ Complete task management system
✅ Field engineer portal with mobile-optimized interface
✅ Customer management with Excel import
✅ Real-time chat system
✅ Performance analytics and reporting
✅ Telegram/WhatsApp notifications
✅ File upload capabilities
✅ Role-based access control
✅ Mobile APK generation system
✅ SQL connection management
✅ Bot configuration system

## Production Optimizations

- **Performance**: Compiled with esbuild for optimal speed
- **Security**: Session-based authentication with encrypted passwords
- **Scalability**: PM2 cluster mode for multiple CPU cores
- **Monitoring**: Built-in health checks and logging
- **Caching**: Query optimization and response caching
- **Assets**: Optimized static file serving

## Support & Documentation

- `APK-BUILD-GUIDE.md` - Mobile app generation
- `HOSTING_MIGRATION_GUIDE.md` - Server migration steps
- `LOCAL_DEVELOPMENT_GUIDE.md` - Development setup
- `CUSTOM_DOMAIN_SETUP.md` - Domain configuration

## System Requirements

- **Node.js**: v18+ or v20+
- **PostgreSQL**: v12+ 
- **Memory**: 2GB+ RAM recommended
- **Storage**: 5GB+ free space
- **OS**: Linux, Windows, or macOS

## Deployment Verification

1. **Health Check**: `curl http://localhost:5000/health`
2. **Login Test**: Access `http://localhost:5000/login`
3. **Portal Test**: Login as field engineer and access portal
4. **Database Test**: Create a test task and verify storage

## Production Ready ✅

This package is production-ready with:
- Zero downtime deployment capability
- Automatic error recovery
- Comprehensive logging
- Security best practices
- Performance optimizations
- Mobile responsiveness
- Cross-browser compatibility

**Ready to deploy anywhere! 🚀**