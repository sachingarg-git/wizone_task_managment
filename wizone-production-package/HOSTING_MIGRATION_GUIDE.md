# Wizone IT Support Portal - Domain Migration Guide
## Hosting Migration to task.wizoneit.com

This guide covers migrating the Wizone IT Support Portal from Replit to your custom domain hosting.

## Overview

The application is now configured to work with your custom domain: **task.wizoneit.com**

## Domain Configuration

The system has been pre-configured with:
- Primary domain: `task.wizoneit.com`
- Wildcard support: `*.wizoneit.com`
- SSL enabled by default
- CORS configured for cross-origin requests

## Migration Steps

### 1. Hosting Provider Setup

**For Traditional Web Hosting (cPanel/DirectAdmin):**
- Ensure Node.js support (version 18+ recommended)
- PostgreSQL database access
- SSL certificate for task.wizoneit.com

**For Cloud Hosting (AWS/DigitalOcean/etc):**
- Ubuntu/CentOS server with Node.js
- PostgreSQL database (can be external service)
- Nginx/Apache reverse proxy setup

### 2. Environment Variables

Create a `.env` file with these variables:
```bash
# Database connection
DATABASE_URL=postgresql://username:password@host:port/database

# Session security
SESSION_SECRET=your-very-long-random-secret-key-here

# Application settings
NODE_ENV=production
PORT=5000

# Domain configuration
ALLOWED_ORIGINS=https://task.wizoneit.com,https://www.wizoneit.com
```

### 3. Build and Deploy

**Prepare for deployment:**
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

### 4. Database Setup

**Option A: Use existing PostgreSQL database**
- Update DATABASE_URL in environment variables
- Run database migrations: `npm run db:push`

**Option B: Use SQL Server (if preferred)**
- Navigate to SQL Connections in admin panel
- Add your SQL Server connection
- Run migration to create tables
- Optionally seed with sample data

### 5. Web Server Configuration

**Nginx Configuration** (recommended):
```nginx
server {
    listen 80;
    server_name task.wizoneit.com www.task.wizoneit.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name task.wizoneit.com www.task.wizoneit.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for real-time features
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Apache Configuration** (.htaccess for shared hosting):
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy to Node.js application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
```

### 6. SSL Certificate

**Let's Encrypt (Free SSL):**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d task.wizoneit.com -d www.task.wizoneit.com
```

**Or use your hosting provider's SSL service**

### 7. Process Management

**PM2 (recommended for production):**
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "wizone-portal" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### 8. Security Considerations

**Firewall Configuration:**
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

**Database Security:**
- Use strong passwords
- Enable SSL connections
- Restrict database access to application server IP

### 9. Monitoring and Maintenance

**Log Management:**
```bash
# View application logs
pm2 logs wizone-portal

# Monitor system resources
pm2 monit
```

**Backup Strategy:**
- Regular database backups
- Application files backup
- SSL certificate backup

### 10. Testing

**Verify deployment:**
1. Visit https://task.wizoneit.com
2. Test login functionality
3. Check all major features:
   - Task management
   - User management
   - SQL connections
   - Mobile app access
   - Real-time chat

**Performance testing:**
- Load testing with expected user count
- Database query optimization
- CDN setup for static assets (optional)

## Support

If you encounter issues during migration:
1. Check server logs
2. Verify environment variables
3. Test database connectivity
4. Confirm SSL certificate validity

## Post-Migration Checklist

- [ ] Domain DNS pointing to server
- [ ] SSL certificate installed and valid
- [ ] Database connection working
- [ ] All features tested and functional
- [ ] Monitoring setup
- [ ] Backup system configured
- [ ] Performance optimized

Your Wizone IT Support Portal is now ready for production use at task.wizoneit.com!