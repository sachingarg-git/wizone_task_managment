# Quick Local Setup - Wizone IT Support Portal

## Immediate Fix for Missing Build Script

Run these commands in your project directory:

```bash
# 1. Copy the local package.json with all required scripts
cp package-local.json package.json

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env file and update DATABASE_URL
nano .env
# or use your preferred editor: code .env, vim .env, etc.

# 5. Test database connection
npm run db:check

# 6. Push database schema (creates tables)
npm run db:push

# 7. Start the application
npm run dev
```

## Environment Configuration

Update your `.env` file with these settings:

```env
# For local PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/wizone_db

# For development
NODE_ENV=development
SESSION_SECRET=your-random-secret-key
PORT=5000

# Keep these as-is
REPL_ID=local-development
ISSUER_URL=local
```

## Available Commands After Setup

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Create/update database tables
npm run db:studio    # Open database management UI
npm run db:check     # Test database connection
```

## Default Login

- Username: `admin`
- Password: `admin123`

## Troubleshooting

### If build fails:
```bash
npm run clean
npm install
npm run build
```

### If database connection fails:
1. Make sure PostgreSQL is running
2. Update DATABASE_URL in .env
3. Run: `npm run db:check`

### If missing dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

The application will be available at: http://localhost:5000