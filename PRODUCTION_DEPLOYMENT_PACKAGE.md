# Wizone IT Support Portal - Production Deployment Package

## Desktop Installation & Live Deployment

यह complete production-ready package है जो आपके desktop पर run होगा और live भी हो सकेगा।

## 🚀 Desktop Setup Commands

### Step 1: Initial Setup
```bash
# Copy production package configuration
cp package-local.json package.json

# Install all dependencies
npm install

# Setup environment for production
cp .env.example .env
```

### Step 2: Configure Database (.env file)
```env
# Production Database (Update with your credentials)
DATABASE_URL=postgresql://username:password@localhost:5432/wizone_production

# Production Settings
NODE_ENV=production
HOST=0.0.0.0
PORT=5000

# Security
SESSION_SECRET=your-secure-random-secret-key

# Application
VITE_API_URL=http://your-domain.com
VITE_APP_NAME=Wizone IT Support Portal
```

### Step 3: Build for Production
```bash
# Build complete application
npm run build

# Create database tables
npm run db:push

# Add sample data (optional)
npm run db:seed
```

### Step 4: Start Production Server
```bash
# Start production server
npm run start

# Or use PM2 for production (recommended)
npm install -g pm2
pm2 start ecosystem.config.js
```

## 🌐 Live Deployment Options

### Option 1: Traditional Hosting (Recommended)
```bash
# Upload files to your server
scp -r dist/ user@your-server.com:/var/www/wizone/
scp package.json user@your-server.com:/var/www/wizone/
scp .env user@your-server.com:/var/www/wizone/

# On server, install and start
cd /var/www/wizone
npm install --production
npm run start
```

### Option 2: Docker Deployment
```bash
# Build Docker image
docker build -t wizone-portal .

# Run container
docker run -d \
  --name wizone-app \
  -p 5000:5000 \
  --env-file .env \
  wizone-portal
```

### Option 3: VPS Deployment
```bash
# On Ubuntu/CentOS server
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib nginx

# Clone and setup
git clone <your-repo> /var/www/wizone
cd /var/www/wizone
npm install
npm run build

# Setup Nginx reverse proxy
sudo cp nginx.conf.example /etc/nginx/sites-available/wizone
sudo ln -s /etc/nginx/sites-available/wizone /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 📁 Production File Structure
```
wizone-portal/
├── dist/
│   ├── index.js          # Compiled server
│   └── public/           # Built frontend
├── uploads/              # File uploads
├── logs/                 # Application logs
├── package.json          # Production dependencies
├── .env                  # Environment config
├── ecosystem.config.js   # PM2 configuration
└── nginx.conf.example    # Nginx config
```

## 🔧 Production Dependencies (All Included)
- **Runtime**: Node.js 18+ with all compiled dependencies
- **Database**: PostgreSQL with connection pooling
- **Frontend**: Pre-built React application
- **Server**: Express with production optimizations
- **Process Manager**: PM2 for clustering and monitoring
- **Reverse Proxy**: Nginx configuration included

## 🛡️ Security Features
- ✅ Password hashing with scrypt
- ✅ Session-based authentication
- ✅ CORS protection
- ✅ File upload validation
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ Rate limiting

## 📊 Performance Optimizations
- ✅ Code splitting and chunking
- ✅ Static file compression
- ✅ Database connection pooling
- ✅ Memory caching
- ✅ Asset optimization
- ✅ Cluster mode with PM2

## 🔍 Monitoring & Health Checks
```bash
# Health check endpoint
curl http://localhost:5000/health

# Application logs
npm run logs

# Process monitoring
pm2 monit

# Database monitoring
npm run db:studio
```

## 🌍 Domain & SSL Setup

### For Live Website:
1. **Point Domain**: Update DNS A record to server IP
2. **SSL Certificate**: Use Let's Encrypt or Cloudflare
3. **Update Environment**: Change VITE_API_URL to your domain
4. **Nginx Config**: Update server_name in nginx.conf

### Example Domain Setup:
```env
# For live website
VITE_API_URL=https://support.wizoneit.com
```

## 📱 Mobile APK Generation
After deployment, mobile APK can be generated using:
- Website2APK.com (instant)
- Progressive Web App installation
- Android Studio build (included project files)

## 🆘 Troubleshooting

### Common Issues:
```bash
# Port already in use
sudo lsof -i :5000
sudo kill -9 <PID>

# Database connection
npm run db:check

# Rebuild application
npm run clean
npm run build

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

### Log Locations:
- Application: `logs/app.log`
- PM2: `~/.pm2/logs/`
- Nginx: `/var/log/nginx/`
- Database: Check PostgreSQL logs

## 🎯 Ready for Production

आपका Wizone IT Support Portal अब completely production-ready है:

- ✅ **Desktop Installation**: सभी dependencies compiled
- ✅ **Database Setup**: PostgreSQL with sample data
- ✅ **Security**: Production-grade authentication
- ✅ **Performance**: Optimized builds and caching
- ✅ **Monitoring**: Health checks and logging
- ✅ **Deployment**: Multiple hosting options
- ✅ **SSL Ready**: HTTPS configuration included
- ✅ **Mobile Ready**: APK generation system

**Commands to Go Live:**
1. `cp package-local.json package.json && npm install`
2. Update `.env` with production database
3. `npm run build`
4. `npm run start` (or deploy to server)

Your application will be live and ready for users!