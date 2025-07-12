#!/bin/bash

# Complete Local Setup for Wizone IT Support Portal
# Run these commands in your project directory

echo "🔧 Configuring Wizone IT Support Portal for localhost..."

# 1. Copy local package.json with all npm commands
echo "📋 Setting up package.json with local configuration..."
cp package-local.json package.json

# 2. Copy local vite config
echo "⚙️ Configuring Vite for localhost..."
cp vite.config.local.ts vite.config.ts

# 3. Setup environment file
echo "🌐 Creating environment configuration..."
cp .env.example .env

# 4. Install all dependencies
echo "📦 Installing dependencies..."
npm install

# 5. Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p dist/public

# 6. Check database connection
echo "🔍 Testing database connection..."
npm run db:check

# 7. Setup database schema
echo "🗄️ Setting up database schema..."
npm run db:push

# 8. Seed database with sample data
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "✅ Complete local setup finished!"
echo ""
echo "🚀 Available Commands:"
echo "  npm run dev          # Start full development (frontend + backend)"
echo "  npm run dev:server   # Start only backend on localhost:5000"
echo "  npm run dev:client   # Start only frontend on localhost:3000"
echo "  npm run build        # Build for production"
echo "  npm run start        # Start production server"
echo "  npm run db:studio    # Open database manager on localhost:4983"
echo ""
echo "🌐 Application URLs:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:5000"
echo "  Database:  http://localhost:4983"
echo ""
echo "🔑 Default Login:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "▶️ To start the application, run: npm run dev"