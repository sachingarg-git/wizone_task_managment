# Custom Domain Hosting Setup Guide

## Overview

TaskFlow now supports custom domain hosting, allowing you to run the application on your own domain names with SSL certificates and proper DNS configuration.

## Features

### Domain Management System
- **Domain Registration**: Add custom domains through the admin interface
- **SSL Configuration**: Enable/disable SSL certificates for each domain
- **Status Tracking**: Monitor domain status (active, pending, inactive)
- **Ownership Control**: Domain ownership tied to user accounts
- **Wildcard Support**: Support for wildcard domains (*.example.com)

### Security & Validation
- **Domain Validation**: Automatic validation of domain name formats
- **CORS Configuration**: Proper CORS setup for multiple domains
- **Access Control**: Domain-based access restrictions
- **SSL Enforcement**: Optional SSL certificate management

## Setup Instructions

### 1. Database Configuration
The domains table is automatically created with the following schema:
```sql
CREATE TABLE domains (
  id SERIAL PRIMARY KEY,
  domain VARCHAR NOT NULL UNIQUE,
  custom_domain VARCHAR,
  ssl BOOLEAN DEFAULT false,
  status VARCHAR NOT NULL DEFAULT 'pending',
  owner_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Environment Variables
Ensure these environment variables are set:
```bash
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
REPL_ID=your_repl_identifier
ISSUER_URL=https://replit.com/oidc
```

### 3. Domain Registration Process

#### Step 1: Access Domain Management
1. Login to your TaskFlow application
2. Navigate to "Domain Management" in the sidebar
3. Click "Add Domain" to register a new domain

#### Step 2: Configure Domain Settings
- **Domain Name**: Enter your custom domain (e.g., taskflow.example.com)
- **Custom Domain**: Optional subdomain mapping
- **SSL Certificate**: Enable for HTTPS support
- **Status**: Set to "pending" initially, then "active" when ready

#### Step 3: DNS Configuration
Configure your DNS records to point to your Replit application:

**For Replit Hosting:**
```
CNAME: your-domain.com → your-repl-name.replit.app
```

**For Custom Hosting:**
```
A Record: your-domain.com → your-server-ip
```

### 4. SSL Certificate Setup

#### Option 1: Automatic SSL (Recommended)
1. Enable SSL in the domain management interface
2. The system will automatically handle certificate validation
3. Ensure your domain is properly configured in DNS

#### Option 2: Manual SSL Configuration
1. Obtain SSL certificates from a certificate authority
2. Configure certificates in your hosting environment
3. Update domain status to "active" with SSL enabled

## Domain Status Types

### Active
- Domain is fully configured and operational
- SSL certificate is valid (if enabled)
- All DNS records are properly configured

### Pending
- Domain is registered but not yet configured
- Waiting for DNS propagation
- SSL certificate provisioning in progress

### Inactive
- Domain is temporarily disabled
- Used for maintenance or troubleshooting
- Can be reactivated when ready

## API Endpoints

### Domain Management API
```javascript
// Get all domains
GET /api/domains

// Create new domain
POST /api/domains
{
  "domain": "example.com",
  "customDomain": "app.example.com",
  "ssl": true,
  "status": "pending"
}

// Update domain
PUT /api/domains/:id
{
  "status": "active",
  "ssl": true
}

// Delete domain
DELETE /api/domains/:id
```

## Security Considerations

### Domain Validation
- Only valid domain names are accepted
- Domain ownership is verified through user authentication
- Cross-domain requests are properly validated

### SSL Security
- SSL certificates are enforced for production environments
- Mixed content warnings are prevented
- Secure cookie settings are applied

### Access Control
- Domain access is restricted to authorized users
- Admin-only access to domain management features
- Proper session management across domains

## Troubleshooting

### Common Issues

#### Domain Not Accessible
1. Check DNS configuration and propagation
2. Verify domain status is set to "active"
3. Ensure SSL certificates are properly configured

#### SSL Certificate Errors
1. Verify domain ownership
2. Check certificate validity and expiration
3. Ensure proper HTTPS redirects are in place

#### CORS Errors
1. Verify domain is registered in the system
2. Check CORS configuration in domain middleware
3. Ensure proper origin headers are sent

### Debug Mode
Enable debug logging for domain validation:
```javascript
// Add to server configuration
app.use((req, res, next) => {
  console.log('Domain request:', req.get('host'));
  console.log('Origin:', req.get('origin'));
  next();
});
```

## Deployment Checklist

### Pre-Deployment
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Domain records created in DNS
- [ ] SSL certificates obtained (if applicable)

### Post-Deployment
- [ ] Domain added through admin interface
- [ ] DNS propagation verified
- [ ] SSL certificate validated
- [ ] Application accessible via custom domain
- [ ] All features working correctly

### Production Considerations
- [ ] Regular SSL certificate renewal
- [ ] DNS monitoring and alerting
- [ ] Domain ownership verification
- [ ] Security headers configured
- [ ] Performance monitoring enabled

## Support

For additional support with custom domain setup:
1. Check the application logs for detailed error messages
2. Verify DNS configuration using tools like `dig` or `nslookup`
3. Test SSL certificates using online SSL checkers
4. Contact your hosting provider for infrastructure support

## Advanced Configuration

### Multiple Domain Support
The system supports multiple domains per application:
- Each domain can have different SSL configurations
- Individual status management per domain
- Separate ownership and access controls

### Wildcard Domain Configuration
For wildcard domains (*.example.com):
1. Register the wildcard domain in the system
2. Configure DNS with a wildcard CNAME record
3. Ensure SSL certificate covers the wildcard domain

### Load Balancer Integration
When using load balancers:
1. Configure health checks for each domain
2. Set up proper SSL termination
3. Ensure session affinity if required