# Wizone IT Support Portal - Deployment Guide

## For GoDaddy Hosting

This guide will help you deploy the Wizone IT Support Portal to GoDaddy hosting.

### Prerequisites

1. GoDaddy hosting account with Node.js support
2. PostgreSQL database (can be hosted separately)
3. SSH/FTP access to your hosting account

### Step 1: Prepare the Project Files

**Remove Replit-specific files before uploading:**
```bash
# Delete these files/folders:
- .replit
- replit.toml
- .git/ (if you want)
- node_modules/ (will be reinstalled)
```

**Create a clean vite.config.ts:**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
```

**Create a clean package.json (remove Replit dependencies):**
```json
{
  "name": "wizone-it-portal",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

### Step 2: Set up Environment Variables

Create a `.env` file in your project root:
```bash
DATABASE_URL=postgresql://username:password@hostname:port/database_name
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=production
PORT=3000
```

### Step 3: Database Setup

**Option A: Use GoDaddy's MySQL/PostgreSQL**
- Create a database in your GoDaddy control panel
- Update the DATABASE_URL in your .env file

**Option B: Use External Database Service**
- Supabase (free tier): https://supabase.com
- PlanetScale: https://planetscale.com
- Neon: https://neon.tech

### Step 4: Build the Project

Before uploading, build the project locally:
```bash
npm install
npm run build
```

This creates a `dist/` folder with:
- `dist/public/` - Frontend files
- `dist/index.js` - Backend server

### Step 5: Upload Files to GoDaddy

**Upload these files/folders:**
```
├── dist/           (built files)
├── package.json
├── package-lock.json
├── .env           (with your database credentials)
├── drizzle.config.ts
├── shared/
├── server/        (if needed for dependencies)
└── wizone_database_schema.sql
```

### Step 6: Install Dependencies on Server

SSH into your GoDaddy server and run:
```bash
cd /path/to/your/project
npm install --production
```

### Step 7: Start the Application

**Option A: Direct start**
```bash
npm start
```

**Option B: With PM2 (recommended for production)**
```bash
npm install -g pm2
pm2 start dist/index.js --name "wizone-portal"
pm2 startup
pm2 save
```

### Step 8: Configure Web Server

**If using Apache (.htaccess):**
```apache
RewriteEngine On
RewriteRule ^(?!api/).*$ /index.html [L]

# Proxy API requests to Node.js
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]
```

**If using Nginx:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Step 9: Database Migration

Run the database setup:
```bash
# If you have the SQL file
psql $DATABASE_URL < wizone_database_schema.sql

# Or use Drizzle
npm run db:push
```

### Troubleshooting

**Common Issues:**

1. **"Module not found" errors:**
   - Make sure all dependencies are in package.json
   - Run `npm install` on the server

2. **Database connection errors:**
   - Check DATABASE_URL format
   - Ensure database server is accessible
   - Verify credentials

3. **Port conflicts:**
   - Change PORT in .env file
   - Update web server proxy configuration

4. **Permission errors:**
   - Set correct file permissions: `chmod 755`
   - Check ownership of files

### Production Checklist

- [ ] Remove all Replit-specific code
- [ ] Set NODE_ENV=production
- [ ] Use strong SESSION_SECRET
- [ ] Enable HTTPS on GoDaddy
- [ ] Set up database backups
- [ ] Configure error logging
- [ ] Set up monitoring

### Default Login Credentials

After deployment, you can log in with:
- Username: admin
- Password: admin123

**Important:** Change the admin password immediately after first login!

---

For additional support with GoDaddy-specific configurations, consult their Node.js hosting documentation or contact their support team.