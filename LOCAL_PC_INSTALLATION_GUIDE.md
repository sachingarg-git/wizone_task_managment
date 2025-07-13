# Wizone IT Support Portal - Local PC Installation Guide

## Prerequisites (Install These First)

### 1. Install Node.js
- Download from: https://nodejs.org/
- Choose LTS version (v18 or v20)
- Run installer and follow prompts
- Verify installation:
```bash
node --version
npm --version
```

### 2. Install PostgreSQL Database
- Download from: https://www.postgresql.org/download/
- Choose your OS (Windows/Mac/Linux)
- During installation:
  - Set password for 'postgres' user (remember this!)
  - Default port: 5432
  - Install pgAdmin (database management tool)

### 3. Install Git (Optional but Recommended)
- Download from: https://git-scm.com/
- Use for version control and updates

## Installation Steps

### Step 1: Download and Extract
1. Download `wizone-portal-production.tar.gz` (377KB)
2. Extract using:
   - **Windows**: Use 7-Zip or WinRAR
   - **Mac/Linux**: `tar -xzf wizone-portal-production.tar.gz`
3. Open terminal/command prompt in extracted folder

### Step 2: Install Dependencies
```bash
# Navigate to project folder
cd wizone-portal-production

# Install all required packages
npm install

# This will download and install all dependencies
```

### Step 3: Setup Database
1. **Create Database**:
```bash
# Open PostgreSQL command line
psql -U postgres

# Create database
CREATE DATABASE wizone_db;

# Exit PostgreSQL
\q
```

2. **Import Database Schema**:
```bash
# Import table structure
psql -U postgres -d wizone_db -f wizone_database_schema.sql

# Import sample data (optional)
psql -U postgres -d wizone_db -f wizone_sample_data.sql
```

### Step 4: Configure Environment
1. Copy environment template:
```bash
cp .env.example .env
```

2. Edit `.env` file with your database details:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/wizone_db

# Session Security
SESSION_SECRET=your-super-secret-session-key-change-this

# Server Configuration
PORT=5000
NODE_ENV=production
```

**Important**: Replace `YOUR_PASSWORD` with your PostgreSQL password!

### Step 5: Start the Application
```bash
# Method 1: Using npm (recommended)
npm start

# Method 2: Using the start script directly
node start.js

# Method 3: Using tsx directly
npx tsx server/index.ts
```

You should see:
```
🚀 Starting Wizone IT Support Portal...
Environment: production
Setting up Vite development server for deployment compatibility
[express] serving on port 5000
```

### Step 6: Access Your Application
Open web browser and go to:
- **Main Application**: http://localhost:5000
- **Login Page**: http://localhost:5000/login

## Default Login Credentials

### Admin Access (Full Dashboard)
- **Username**: admin
- **Password**: admin123

### Field Engineer Access (Portal Only)
- **Username**: RAVI
- **Password**: admin123

### Backend Engineer Access
- **Username**: helpdesk
- **Password**: admin123

## Available Features

After login, you'll have access to:

✅ **Task Management**: Create, assign, and track support tickets
✅ **Customer Management**: Add customers, import from Excel
✅ **Field Engineer Portal**: Mobile-optimized task interface
✅ **Performance Analytics**: Charts and reports
✅ **Real-time Chat**: Internal team communication
✅ **File Uploads**: Attach images and documents to tasks
✅ **Telegram Notifications**: Automated alerts (configure bot)
✅ **APK Generation**: Create mobile apps
✅ **SQL Connections**: Connect to external databases

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
# Windows: Check Services for "postgresql"
# Mac: brew services list | grep postgresql
# Linux: systemctl status postgresql

# Test database connection
psql -U postgres -d wizone_db -c "SELECT COUNT(*) FROM users;"
```

### Port Already in Use
```bash
# Change port in .env file
PORT=3000

# Or kill existing process
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -ti:5000 | xargs kill
```

### Missing Dependencies
```bash
# Reinstall all packages
rm -rf node_modules package-lock.json
npm install
```

## Optional: Advanced Setup

### PM2 for Production (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# Auto-start on system boot
pm2 startup
pm2 save
```

### Enable External Access
To access from other devices on your network:

1. Find your local IP:
```bash
# Windows: ipconfig
# Mac/Linux: ifconfig | grep inet
```

2. Update `.env`:
```env
HOST=0.0.0.0
PORT=5000
```

3. Access from other devices: `http://YOUR_LOCAL_IP:5000`

## System Requirements

- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 5GB free space
- **Network**: Internet connection for initial setup

## Backup Your Data

Regularly backup your database:
```bash
# Create backup
pg_dump -U postgres wizone_db > wizone_backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres -d wizone_db -f wizone_backup_YYYYMMDD.sql
```

## Updates and Maintenance

- Keep Node.js updated to latest LTS version
- Regularly backup your database
- Monitor application logs for issues
- Update dependencies monthly: `npm update`

**Your Wizone IT Support Portal is now running locally on your PC! 🚀**

For additional support, refer to other documentation files included in the package.