# Quick Start for Windows

## Issue: Server Hangs on Windows
If your server hangs at "Setting up default user credentials...", use this solution:

## Quick Fix - Edit server/index.ts
1. Open `server/index.ts`
2. Find this section (around line 55):
```typescript
// Skip user seeding for faster startup - users can be created via UI
console.log("Skipping user seeding for faster startup");
```

3. Replace the entire user seeding block with just:
```typescript
console.log("Starting server...");
```

## Alternative: Direct Database Setup
If you have database access, create admin user manually:
```sql
INSERT INTO users (id, username, password, email, first_name, last_name, role, is_active) 
VALUES ('admin001', 'admin', 'admin123_hashed', 'admin@wizoneit.com', 'Admin', 'User', 'admin', true);
```

## Login Credentials
- Username: admin
- Password: admin123

## Server Details
- Port: http://localhost:5000
- Database: PostgreSQL (ensure it's running)
- Environment: development

## Features Working
✅ Task management with file upload/download
✅ Customer portal with task history
✅ Field engineer workflow
✅ Notifications system
✅ File preview and download in History tab