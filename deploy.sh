#!/bin/bash

# Wizone IT Support Portal - Production Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
DOMAIN="task.wizoneit.com"
APP_NAME="wizone-portal"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Create logs directory
mkdir -p logs

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy production environment file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f production.env.example ]; then
        echo "📄 Creating .env file from example..."
        cp production.env.example .env
        echo "⚠️  Please update .env with your actual configuration before proceeding."
        echo "⚠️  Update DATABASE_URL, SESSION_SECRET, and other variables."
        read -p "Press enter when ready to continue..."
    else
        echo "❌ No .env file found and no example file available."
        exit 1
    fi
fi

# Build the application
echo "🏗️  Building application..."
npm run build

# Database setup
echo "💾 Setting up database..."
if [ "$ENVIRONMENT" = "production" ]; then
    npm run db:push
else
    echo "Skipping database setup for $ENVIRONMENT"
fi

# Stop existing application if running
echo "🛑 Stopping existing application..."
pm2 stop $APP_NAME 2>/dev/null || echo "No existing process found"
pm2 delete $APP_NAME 2>/dev/null || echo "No existing process to delete"

# Start the application with PM2
echo "🌟 Starting application..."
if [ "$ENVIRONMENT" = "production" ]; then
    NODE_ENV=production pm2 start ecosystem.config.js --env production
else
    NODE_ENV=development pm2 start ecosystem.config.js
fi

# Save PM2 configuration
pm2 save

# Set up PM2 startup script
pm2 startup

# Show status
echo "✅ Deployment completed!"
echo ""
echo "📊 Application status:"
pm2 status

echo ""
echo "🌐 Application should be available at:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "   https://$DOMAIN"
else
    echo "   http://localhost:5000"
fi

echo ""
echo "📝 Useful commands:"
echo "   pm2 logs $APP_NAME     - View logs"
echo "   pm2 restart $APP_NAME  - Restart application"
echo "   pm2 stop $APP_NAME     - Stop application"
echo "   pm2 monit              - Monitor resources"

# Optional: Setup SSL certificate with Let's Encrypt
if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo "🔒 SSL Certificate Setup:"
    echo "   1. Install certbot: sudo apt install certbot python3-certbot-nginx"
    echo "   2. Generate certificate: sudo certbot --nginx -d $DOMAIN"
    echo "   3. Test auto-renewal: sudo certbot renew --dry-run"
fi

echo ""
echo "🎉 Deployment completed successfully!"