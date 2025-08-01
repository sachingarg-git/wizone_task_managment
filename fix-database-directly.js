// Direct database fix for customer portal columns
const { getConnection } = require('./server/config/database');

const fixDatabaseSchema = async () => {
  console.log('🔧 FIXING DATABASE SCHEMA DIRECTLY...\n');
  
  try {
    const pool = await getConnection();
    
    console.log('📋 Step 1: Adding missing columns to customers table...');
    
    // Add columns one by one to avoid conflicts
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'username')
        BEGIN
          ALTER TABLE customers ADD username NVARCHAR(100) NULL
          PRINT 'Added username column'
        END
      `);
      console.log('✅ Username column added/checked');
    } catch (error) {
      console.log('⚠️ Username column:', error.message);
    }
    
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'password')
        BEGIN
          ALTER TABLE customers ADD password NVARCHAR(255) NULL
          PRINT 'Added password column'
        END
      `);
      console.log('✅ Password column added/checked');
    } catch (error) {
      console.log('⚠️ Password column:', error.message);
    }
    
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'portalAccess')
        BEGIN
          ALTER TABLE customers ADD portalAccess BIT DEFAULT 0
          PRINT 'Added portalAccess column'
        END
      `);
      console.log('✅ Portal access column added/checked');
    } catch (error) {
      console.log('⚠️ Portal access column:', error.message);
    }
    
    console.log('\n📋 Step 2: Verifying columns exist...');
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'customers' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Available columns in customers table:', columns.recordset.map(c => c.COLUMN_NAME).join(', '));
    
    console.log('\n✅ DATABASE SCHEMA FIX COMPLETED');
    
  } catch (error) {
    console.error('❌ Database fix error:', error.message);
  }
};

fixDatabaseSchema();