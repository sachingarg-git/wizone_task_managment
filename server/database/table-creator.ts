import { getConnection } from './mssql-connection';
import { TABLE_SCHEMAS, TABLE_ORDER } from './table-schemas';

export interface TableCreationResult {
  tableName: string;
  success: boolean;
  error?: string;
}

export async function createAllTables(): Promise<TableCreationResult[]> {
  const results: TableCreationResult[] = [];
  
  try {
    const pool = await getConnection();
    
    console.log('Starting table creation...');
    
    for (const tableName of TABLE_ORDER) {
      try {
        console.log(`Creating table: ${tableName}`);
        
        // Check if table already exists
        const checkRequest = pool.request();
        const checkResult = await checkRequest.query(`
          SELECT COUNT(*) as count
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = '${tableName}'
        `);
        
        if (checkResult.recordset[0].count > 0) {
          console.log(`Table ${tableName} already exists, skipping...`);
          results.push({
            tableName,
            success: true,
            error: 'Already exists'
          });
          continue;
        }
        
        // Create table
        const createRequest = pool.request();
        const sql = TABLE_SCHEMAS[tableName as keyof typeof TABLE_SCHEMAS];
        
        if (!sql) {
          throw new Error(`No schema found for table: ${tableName}`);
        }
        
        await createRequest.query(sql);
        
        console.log(`✅ Table ${tableName} created successfully`);
        results.push({
          tableName,
          success: true
        });
        
      } catch (error) {
        console.error(`❌ Failed to create table ${tableName}:`, error);
        results.push({
          tableName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log('Table creation completed');
    return results;
    
  } catch (error) {
    console.error('Failed to create tables:', error);
    throw error;
  }
}

export async function dropAllTables(): Promise<void> {
  try {
    const pool = await getConnection();
    
    console.log('Dropping all tables...');
    
    // Drop in reverse order to handle foreign key constraints
    const reverseOrder = [...TABLE_ORDER].reverse();
    
    for (const tableName of reverseOrder) {
      try {
        const request = pool.request();
        await request.query(`DROP TABLE IF EXISTS ${tableName}`);
        console.log(`✅ Table ${tableName} dropped`);
      } catch (error) {
        console.error(`❌ Failed to drop table ${tableName}:`, error);
      }
    }
    
    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Failed to drop tables:', error);
    throw error;
  }
}

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    const result = await request.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = '${tableName}'
    `);
    
    return result.recordset[0].count > 0;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

export async function getTableInfo(): Promise<any[]> {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    const result = await request.query(`
      SELECT 
        TABLE_NAME as tableName,
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as columnCount
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    return result.recordset;
  } catch (error) {
    console.error('Error getting table info:', error);
    return [];
  }
}

export async function validateAllTables(): Promise<{isValid: boolean, missingTables: string[]}> {
  try {
    const missingTables: string[] = [];
    
    for (const tableName of TABLE_ORDER) {
      const exists = await checkTableExists(tableName);
      if (!exists) {
        missingTables.push(tableName);
      }
    }
    
    return {
      isValid: missingTables.length === 0,
      missingTables
    };
  } catch (error) {
    console.error('Error validating tables:', error);
    return {
      isValid: false,
      missingTables: TABLE_ORDER
    };
  }
}