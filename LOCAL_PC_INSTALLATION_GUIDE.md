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

### 2. Install SQL Server Database
**Option A: SQL Server Express (Recommended)**
- Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- Choose "Express" edition (free)
- During installation:
  - Enable "Mixed Mode Authentication"
  - Set password for 'sa' user (remember this!)
  - Default port: 1433

**Option B: Docker SQL Server (Cross-platform)**
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
   -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2022-latest
```

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
```sql
-- Using SQL Server Management Studio or sqlcmd
CREATE DATABASE wizone_db;
```

2. **Automatic Setup**:
The application will automatically:
- Connect to your SQL Server
- Create all required tables 
- Insert sample data
- Set up default users

No manual table creation needed!

### Step 4: Configure Environment
1. Copy environment template:
```bash
cp .env.example .env
```

2. Edit `.env` file with your database details:
```env
# SQL Server Database Configuration
SQL_SERVER_HOST=localhost
SQL_SERVER_PORT=1433
SQL_SERVER_USER=sa
SQL_SERVER_PASSWORD=YOUR_PASSWORD
SQL_SERVER_DATABASE=wizone_db

# Session Security
SESSION_SECRET=your-super-secret-session-key-change-this

# Server Configuration
PORT=5000
NODE_ENV=production
```

**Important**: Replace `YOUR_PASSWORD` with your SQL Server 'sa' password!

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