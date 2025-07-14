#!/bin/bash

# Wizone IT Support Portal - Production Package Creation Script
# This script creates a complete deployable package with all dependencies

echo "🚀 Creating Wizone IT Support Portal Production Package..."

# Create production directory
PROD_DIR="wizone-production-package"
mkdir -p $PROD_DIR

echo "📁 Copying application files..."

# Copy core application files
cp -r client/ $PROD_DIR/
cp -r server/ $PROD_DIR/
cp -r shared/ $PROD_DIR/
cp -r mobile/ $PROD_DIR/
cp -r scripts/ $PROD_DIR/
cp -r uploads/ $PROD_DIR/ 2>/dev/null || mkdir $PROD_DIR/uploads

# Copy configuration files
cp package.json $PROD_DIR/
cp package-lock.json $PROD_DIR/
cp tsconfig.json $PROD_DIR/
cp vite.config.ts $PROD_DIR/
cp postcss.config.js $PROD_DIR/
cp tailwind.config.ts $PROD_DIR/
cp components.json $PROD_DIR/
cp drizzle.config.ts $PROD_DIR/

# Copy deployment files
cp ecosystem.config.js $PROD_DIR/
cp Dockerfile $PROD_DIR/
cp docker-compose.yml $PROD_DIR/
cp nginx.conf.example $PROD_DIR/
cp deploy.sh $PROD_DIR/

# Copy documentation
cp *.md $PROD_DIR/
cp *.sql $PROD_DIR/ 2>/dev/null || true

# Copy environment files
cp .env.example $PROD_DIR/
cp production.env.example $PROD_DIR/

# Copy mobile app files
cp mobile-app.html $PROD_DIR/
cp mobile-app-sw.js $PROD_DIR/
cp mobile-app-manifest.json $PROD_DIR/

# Copy APK generation files
cp create-*.js $PROD_DIR/
cp *.gradle $PROD_DIR/ 2>/dev/null || true
cp AndroidManifest.xml $PROD_DIR/ 2>/dev/null || true
cp MainActivity.java $PROD_DIR/ 2>/dev/null || true

echo "📦 Installing production dependencies..."
cd $PROD_DIR
npm ci --production --silent

echo "🔧 Creating production scripts..."

# Create production start script
cat > start-production.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Wizone IT Support Portal in Production Mode..."

# Set production environment
export NODE_ENV=production

# Start with PM2 cluster mode
if command -v pm2 &> /dev/null; then
    echo "Starting with PM2 cluster mode..."
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
else
    echo "PM2 not found, starting with Node.js..."
    node server/index.js
fi
EOF

chmod +x start-production.sh

# Create database setup script
cat > setup-database.sh << 'EOF'
#!/bin/bash
echo "🗄️ Setting up Wizone Database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is required"
    echo "Example: export DATABASE_URL='postgresql://username:password@localhost:5432/wizone_db'"
    exit 1
fi

# Run database migrations
echo "Running database migrations..."
npx drizzle-kit push

# Check if successful
if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully"
else
    echo "❌ Database setup failed"
    exit 1
fi
EOF

chmod +x setup-database.sh

# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "🏥 Wizone Health Check..."

# Check if server is running
if curl -f -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Server is running and healthy"
    exit 0
else
    echo "❌ Server is not responding"
    exit 1
fi
EOF

chmod +x health-check.sh

cd ..

echo "📋 Creating deployment documentation..."

# Create README for production package
cat > $PROD_DIR/README-PRODUCTION.md << 'EOF'
# Wizone IT Support Portal - Production Deployment

## Quick Start

### 1. Environment Setup
```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database URL and settings

# Example .env:
DATABASE_URL=postgresql://username:password@localhost:5432/wizone_db
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secure-session-secret
```

### 2. Database Setup
```bash
# Setup database tables
./setup-database.sh
```

### 3. Start Application
```bash
# Start in production mode
./start-production.sh
```

### 4. Health Check
```bash
# Verify application is running
./health-check.sh
```

## Default Login
- **Username**: admin
- **Password**: admin123

> **Important**: Change default password after first login!

## Features Included
✅ Complete Task Management System
✅ Customer Portal with File Upload
✅ Mobile Progressive Web App (PWA)
✅ Real-time Notifications
✅ Telegram/WhatsApp Integration
✅ Analytics Dashboard
✅ User Management
✅ File Upload & Management
✅ Field Engineer Workflow
✅ Excel Import/Export

## Support
For technical support and documentation, see PRODUCTION_DEPLOYMENT_PACKAGE.md
EOF

echo "🎯 Creating package archive..."

# Create compressed package
tar -czf wizone-production-package.tar.gz $PROD_DIR/

# Get package size
PACKAGE_SIZE=$(du -sh wizone-production-package.tar.gz | cut -f1)

echo ""
echo "✅ Production package created successfully!"
echo "📦 Package: wizone-production-package.tar.gz"
echo "📏 Size: $PACKAGE_SIZE"
echo ""
echo "🚀 Deployment Instructions:"
echo "1. Extract: tar -xzf wizone-production-package.tar.gz"
echo "2. Configure: cd wizone-production-package && cp .env.example .env"
echo "3. Setup DB: ./setup-database.sh"
echo "4. Deploy: ./start-production.sh"
echo ""
echo "🌐 Application will be available at: http://localhost:5000"
echo "📱 Mobile PWA: Install directly from browser"
echo ""
echo "📋 For complete documentation, see PRODUCTION_DEPLOYMENT_PACKAGE.md"