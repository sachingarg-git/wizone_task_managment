# SQL Server Setup Guide - Wizone IT Support Portal

## SQL Server Installation

### Option 1: Microsoft SQL Server Express (Free)
1. Download SQL Server Express from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. Choose "Express" edition (free)
3. During installation:
   - Enable "Mixed Mode Authentication"
   - Set a password for 'sa' user
   - Note the server instance name

### Option 2: SQL Server Management Studio (SSMS)
1. Download SSMS from: https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
2. Install and connect to your SQL Server instance

### Option 3: Docker SQL Server (Cross-platform)
```bash
# Pull SQL Server Docker image
docker pull mcr.microsoft.com/mssql/server:2022-latest

# Run SQL Server container
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
   -p 1433:1433 --name sqlserver --hostname sqlserver \
   -d mcr.microsoft.com/mssql/server:2022-latest
```

## Database Configuration

### 1. Create Database
Using SQL Server Management Studio or sqlcmd:
```sql
CREATE DATABASE wizone_db;
```

### 2. Configure Environment
Update your `.env` file:
```env
# SQL Server Database Configuration
SQL_SERVER_HOST=localhost
SQL_SERVER_PORT=1433
SQL_SERVER_USER=sa
SQL_SERVER_PASSWORD=YourStrong@Passw0rd
SQL_SERVER_DATABASE=wizone_db
```

### 3. Automatic Table Creation
The application will automatically create all required tables when you start it for the first time.

## Connection Testing

Test your SQL Server connection:
```bash
# Using sqlcmd (if installed)
sqlcmd -S localhost -U sa -P YourStrong@Passw0rd -Q "SELECT @@VERSION"

# Or start the application - it will test connection automatically
npm start
```

## Default SQL Server Configuration

- **Server**: localhost
- **Port**: 1433
- **Authentication**: SQL Server Authentication
- **User**: sa
- **Database**: wizone_db

## Firewall Configuration

Ensure SQL Server port is accessible:
- **Windows**: Add firewall rule for port 1433
- **Linux**: Configure iptables or ufw
- **Docker**: Port mapping handled automatically

## Features Included

✅ **Automatic Database Creation**: No manual table creation needed
✅ **Schema Migration**: Tables created automatically on first run
✅ **Sample Data**: Default users and test data included
✅ **Connection Pooling**: Optimized for performance
✅ **Error Handling**: Comprehensive connection error management

## Troubleshooting

### Connection Issues
1. Verify SQL Server is running
2. Check firewall settings
3. Confirm user credentials
4. Test network connectivity

### Authentication Problems
```sql
-- Enable SQL Server authentication
ALTER LOGIN sa ENABLE;
ALTER LOGIN sa WITH PASSWORD = 'NewPassword';
```

### Port Issues
- Default port: 1433
- Named instances: Use `hostname\instance,port`
- Docker: Map ports correctly

## System Requirements

- **SQL Server**: 2016+ (Express, Standard, or Enterprise)
- **Memory**: 2GB minimum for SQL Server
- **Storage**: 5GB free space
- **OS**: Windows, Linux, or macOS (Docker)

**Ready to use with just SQL Server - no PostgreSQL needed! 🚀**