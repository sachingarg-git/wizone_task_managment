# Wizone IT Support Portal - Simple Installation Guide (SQL Server Only)

## What You Need

1. **Node.js** (Download from: https://nodejs.org/)
2. **SQL Server** (Download SQL Server Express - Free from Microsoft)

## Quick 5-Step Setup

### Step 1: Install Node.js
- Download Node.js v18 or v20 from https://nodejs.org/
- Run installer, accept defaults

### Step 2: Install SQL Server Express (Free)
- Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- Choose "Express" edition
- During setup: Enable "Mixed Mode Authentication", set 'sa' password

### Step 3: Extract and Setup
```bash
# Extract downloaded file
tar -xzf wizone-portal-sqlserver-only.tar.gz
cd wizone-portal-sqlserver-only

# Install dependencies
npm install
```

### Step 4: Configure Database
```bash
# Copy environment file
cp .env.example .env

# Edit .env file - update these lines:
SQL_SERVER_HOST=localhost
SQL_SERVER_PORT=1433
SQL_SERVER_USER=sa
SQL_SERVER_PASSWORD=your_sa_password_here
SQL_SERVER_DATABASE=wizone_db
```

### Step 5: Create Database & Start
```sql
-- Open SQL Server Management Studio or sqlcmd
CREATE DATABASE wizone_db;
```

```bash
# Start the application
npm start
```

## Access Your Portal

- **URL**: http://localhost:5000
- **Admin Login**: admin / admin123
- **Field Engineer**: RAVI / admin123

## Features Ready to Use

✅ **Complete Task Management** - Create, assign, track tickets  
✅ **Field Engineer Portal** - Mobile-optimized interface  
✅ **Customer Management** - Add customers, Excel import  
✅ **Performance Analytics** - Charts and reporting  
✅ **Real-time Chat** - Team communication  
✅ **File Uploads** - Attach documents to tasks  
✅ **Role-based Access** - Admin, Manager, Field Engineer roles  
✅ **APK Generation** - Create mobile apps  
✅ **Automatic Setup** - Tables created automatically  

## Advantages of SQL Server Version

🚀 **No PostgreSQL Required** - Only need SQL Server  
🚀 **Automatic Database Setup** - Creates tables automatically  
🚀 **Works Offline** - No internet database dependencies  
🚀 **Free SQL Server Express** - No licensing costs  
🚀 **Windows Native** - Optimized for Windows environments  
🚀 **Enterprise Ready** - Can scale to full SQL Server  

## System Requirements

- **OS**: Windows 10+, Windows Server 2016+
- **RAM**: 4GB minimum (2GB for SQL Server + 2GB for app)
- **Storage**: 10GB free space
- **Network**: Not required (works completely offline)

## Troubleshooting

**SQL Server Connection Issues:**
1. Verify SQL Server is running (Services → SQL Server)
2. Check Windows Firewall (allow port 1433)
3. Verify 'sa' user password
4. Ensure "SQL Server and Windows Authentication mode" is enabled

**Application Issues:**
```bash
# Check Node.js version
node --version  # Should be v18+ or v20+

# Reinstall dependencies
rm -rf node_modules
npm install

# Check SQL Server connection
sqlcmd -S localhost -U sa -P your_password -Q "SELECT @@VERSION"
```

## Production Deployment

For production servers:
```bash
# Use PM2 for production
npm install -g pm2
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit
```

## Database Backup

```sql
-- Create backup
BACKUP DATABASE wizone_db TO DISK = 'C:\Backups\wizone_db.bak'

-- Restore backup
RESTORE DATABASE wizone_db FROM DISK = 'C:\Backups\wizone_db.bak'
```

**Your Wizone IT Support Portal is now running with SQL Server! 🎯**

No PostgreSQL, no complex setup - just Node.js + SQL Server Express!