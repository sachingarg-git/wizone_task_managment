# 🚨 Task Creation Issue - FIXED

## Problem Found ✅
The task creation was failing with error:
```
PostgresError: numeric field overflow
detail: 'A field with precision 5, scale 2 must round to an absolute value less than 10^3.'
```

**Root Cause**: The `estimated_cost` field (visit charges) in the database is defined as `NUMERIC(5,2)`, which only allows values up to **₹999.99**.

When you entered **₹2022** for visit charges, it exceeded this limit and threw an error.

## Solution

### Option 1: Run SQL Directly on Production Server (RECOMMENDED)
1. SSH into your production server (103.122.85.61)
2. Connect to PostgreSQL:
   ```bash
   psql -h localhost -U wizoneit -d WIZONEIT_SUPPORT
   ```
3. Run this SQL command:
   ```sql
   ALTER TABLE tasks ALTER COLUMN estimated_cost TYPE NUMERIC(10,2);
   ```
4. Exit psql:
   ```sql
   \q
   ```

### Option 2: Use the Admin API Endpoint
The server code now includes an admin endpoint to fix this. On the production server:

1. Create a file named `fix-db.js`:
```javascript
const http = require('http');

const loginData = JSON.stringify({
  username: 'sachin',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3007,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const loginReq = http.request(loginOptions, (loginRes) => {
  const cookies = loginRes.headers['set-cookie'] || [];
  const sessionCookie = cookies.find(c => c.startsWith('connect.sid='));
  
  const fixOptions = {
    hostname: 'localhost',
    port: 3007,
    path: '/api/admin/fix-visit-charges',
    method: 'POST',
    headers: {
      'Cookie': sessionCookie
    }
  };
  
  const fixReq = http.request(fixOptions, (fixRes) => {
    let body = '';
    fixRes.on('data', chunk => { body += chunk; });
    fixRes.on('end', () => console.log(JSON.parse(body)));
  });
  
  fixReq.end();
});

loginReq.write(loginData);
loginReq.end();
```

2. Run it:
```bash
node fix-db.js
```

### Option 3: Use Lower Visit Charges Temporarily
Until the database is fixed, use visit charges under ₹1000:
- Instead of ₹2022, use ₹999
- Add a note in the description about the actual charge

## What Changes
- **Before**: `NUMERIC(5,2)` - Maximum value: ₹999.99
- **After**: `NUMERIC(10,2)` - Maximum value: ₹99,999,999.99

## Verification
After running the fix, try creating a task with visit charges of ₹2022 or higher. It should work successfully.

## Files Modified
1. `server/routes.ts` - Added `/api/admin/fix-visit-charges` endpoint
2. Created helper scripts:
   - `run-visit-charges-fix.cjs` - Script to call the admin endpoint
   - `fix-visit-charges-db.cjs` - Direct database fix script
   - `FIX-VISIT-CHARGES-INSTRUCTIONS.md` - This documentation

## Need Help?
If you can't access the production server, contact your system administrator to run the SQL command on the database server.
