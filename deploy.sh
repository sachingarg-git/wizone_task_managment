#!/bin/bash

# Wizone IT Support Portal - Production Deployment Script

echo "🚀 Building Wizone IT Support Portal for Production..."

# Set production environment
export NODE_ENV=production

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf node_modules/.vite
mkdir -p dist
mkdir -p logs
mkdir -p uploads

# Copy production package configuration
echo "📋 Setting up production package.json..."
cp package-local.json package.json

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --production=false

# Build the application
echo "🔨 Building application..."
npm run build

# Copy additional production files
echo "📁 Copying production files..."
cp ecosystem.config.js dist/
cp nginx.conf.example dist/
cp Dockerfile dist/
cp .dockerignore dist/

# Create production package
echo "📦 Creating production package..."
tar -czf wizone-portal-production.tar.gz \
  dist/ \
  package.json \
  .env.example \
  ecosystem.config.js \
  nginx.conf.example \
  Dockerfile \
  .dockerignore \
  PRODUCTION_DEPLOYMENT_PACKAGE.md \
  logs/ \
  uploads/

echo ""
echo "✅ Production build complete!"
echo ""
echo "📁 Files ready for deployment:"
echo "  - dist/               # Built application"
echo "  - package.json        # Production dependencies"
echo "  - ecosystem.config.js # PM2 configuration"
echo "  - nginx.conf.example  # Nginx configuration"
echo "  - Dockerfile         # Docker configuration"
echo ""
echo "📦 Production package: wizone-portal-production.tar.gz"
echo ""
echo "🌐 To deploy on server:"
echo "  1. Upload wizone-portal-production.tar.gz to server"
echo "  2. Extract: tar -xzf wizone-portal-production.tar.gz"
echo "  3. Setup database in .env file"
echo "  4. Install PM2: npm install -g pm2"
echo "  5. Start: pm2 start ecosystem.config.js"
echo ""
echo "🎉 Ready for live deployment!"