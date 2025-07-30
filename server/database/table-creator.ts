import { getConnection } from './mssql-connection';
import { tableSchemas, indexStatements, tableOrder } from './table-schemas';

export interface TableCreationResult {
  table: string;
  success: boolean;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  missingTables: string[];
  totalTables: number;
  existingTables: string[];
}

export async function createAllTables(): Promise<TableCreationResult[]> {
  const results: TableCreationResult[] = [];
  
  try {
    const pool = await getConnection();
    
    // Create tables in order to respect foreign key dependencies
    for (const tableName of tableOrder) {
      try {
        console.log(`Creating table: ${tableName}`);
        
        // Check if table already exists
        const checkResult = await pool.request().query(`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = '${tableName}' AND TABLE_TYPE = 'BASE TABLE'
        `);
        
        if (checkResult.recordset[0].count > 0) {
          console.log(`Table ${tableName} already exists, skipping...`);
          results.push({
            table: tableName,
            success: true,
            error: 'Already exists'
          });
          continue;
        }
        
        // Create the table
        const schema = tableSchemas[tableName as keyof typeof tableSchemas];
        if (!schema) {
          throw new Error(`Schema not found for table: ${tableName}`);
        }
        
        await pool.request().query(schema);
        
        results.push({
          table: tableName,
          success: true
        });
        
        console.log(`✅ Table ${tableName} created successfully`);
        
      } catch (error) {
        console.error(`❌ Failed to create table ${tableName}:`, error);
        results.push({
          table: tableName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Create indexes
    console.log('Creating indexes...');
    for (const indexStatement of indexStatements) {
      try {
        await pool.request().query(indexStatement);
        console.log(`✅ Index created: ${indexStatement.substring(0, 50)}...`);
      } catch (error) {
        console.log(`⚠️ Index creation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Indexes are not critical, continue on error
      }
    }
    
    console.log(`Database table creation completed. ${results.filter(r => r.success).length}/${results.length} tables created successfully.`);
    
  } catch (error) {
    console.error('Fatal error in table creation:', error);
    results.push({
      table: 'CONNECTION_ERROR',
      success: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    });
  }
  
  return results;
}

export async function validateAllTables(): Promise<ValidationResult> {
  try {
    const pool = await getConnection();
    
    // Get all existing tables
    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    
    const existingTables = result.recordset.map((row: any) => row.TABLE_NAME.toLowerCase());
    const expectedTables = tableOrder.map((t: string) => t.toLowerCase());
    const missingTables = expectedTables.filter((table: string) => !existingTables.includes(table));
    
    return {
      isValid: missingTables.length === 0,
      missingTables,
      totalTables: expectedTables.length,
      existingTables: existingTables.filter((table: string) => expectedTables.includes(table))
    };
    
  } catch (error) {
    console.error('Error validating tables:', error);
    return {
      isValid: false,
      missingTables: tableOrder,
      totalTables: tableOrder.length,
      existingTables: []
    };
  }
}

export async function dropAllTables(): Promise<void> {
  try {
    const pool = await getConnection();
    
    // Drop tables in reverse order to respect foreign key dependencies
    const reversedOrder = [...tableOrder].reverse();
    
    for (const tableName of reversedOrder) {
      try {
        await pool.request().query(`
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}')
          DROP TABLE ${tableName}
        `);
        console.log(`Dropped table: ${tableName}`);
      } catch (error) {
        console.log(`Warning: Could not drop table ${tableName}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    console.log('All tables dropped successfully');
    
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  }
}

export async function getTableStats(): Promise<{ [tableName: string]: number }> {
  try {
    const pool = await getConnection();
    const stats: { [tableName: string]: number } = {};
    
    for (const tableName of tableOrder) {
      try {
        const result = await pool.request().query(`
          SELECT COUNT(*) as count FROM ${tableName}
        `);
        stats[tableName] = result.recordset[0].count;
      } catch (error) {
        stats[tableName] = -1; // Table doesn't exist or error
      }
    }
    
    return stats;
    
  } catch (error) {
    console.error('Error getting table stats:', error);
    return {};
  }
}