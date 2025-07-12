#!/bin/bash

# Wizone IT Support Portal - Local Development Startup Script

echo "🚀 Starting Wizone IT Support Portal..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOL
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/wizone_db

# Session Configuration  
SESSION_SECRET=your-super-secret-session-key-change-this

# Development Settings
NODE_ENV=development
PORT=5000

# Replit Compatibility (leave as-is for local development)
REPL_ID=local-development
ISSUER_URL=local
EOL
    echo "📝 Created .env template. Please update DATABASE_URL with your PostgreSQL credentials."
    echo "💡 Example: DATABASE_URL=postgresql://user:pass@localhost:5432/dbname"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Test database connection
echo "🔍 Testing database connection..."
if ! tsx scripts/check-db.ts; then
    echo "❌ Database connection failed. Please check your DATABASE_URL in .env"
    echo "💡 Make sure PostgreSQL is running and the database exists"
    exit 1
fi

# Start the application
echo "✅ Database connection successful!"
echo "🌟 Starting Wizone IT Support Portal on http://localhost:5000"
echo "📱 Use Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev