# 🔧 Fix Visit Charges Database Issue

## Problem
Task creation is failing with error:
```
PostgresError: numeric field overflow
detail: 'A field with precision 5, scale 2 must round to an absolute value less than 10^3.'
```

The `estimated_cost` (visit charges) field in the `tasks` table is defined as `NUMERIC(5,2)`, which only allows values up to **999.99**.

When you try to create a task with visit charges of **2022**, it exceeds this limit.

## Solution
Run the following SQL command on the **production database server** (103.122.85.61):

```sql
-- Connect to database
psql -h localhost -U wizoneit -d WIZONEIT_SUPPORT

-- Run this command
ALTER TABLE tasks ALTER COLUMN estimated_cost TYPE NUMERIC(10,2);
```

This will change the field to allow values up to **99,999,999.99**.

## Alternative: Run Node Script on Production Server

1. SSH into the production server:
```bash
ssh user@103.122.85.61
```

2. Create a file named `fix-visit-charges.js`:
```javascript
const postgres = require('postgres');

const sql = postgres('postgresql://wizoneit:wizone123@localhost:9095/WIZONEIT_SUPPORT', {
  ssl: false
});

async function fix() {
  try {
    await sql`ALTER TABLE tasks ALTER COLUMN estimated_cost TYPE NUMERIC(10,2)`;
    console.log('✅ Fixed! estimated_cost now allows values up to 99,999,999.99');
    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

fix();
```

3. Run it:
```bash
node fix-visit-charges.js
```

## Verification
After running the fix, test by creating a task with visit charges of 2022 or higher.

## What Changed
- **Before**: `NUMERIC(5,2)` - Maximum value: 999.99
- **After**: `NUMERIC(10,2)` - Maximum value: 99,999,999.99

This allows realistic visit charge amounts like:
- ₹2,022
- ₹5,000
- ₹15,000
- etc.
