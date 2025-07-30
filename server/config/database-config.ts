import { loadDatabaseConfig, isDatabaseInitialized } from '../database/mssql-connection';

export async function checkDatabaseSetup(): Promise<{
  isConfigured: boolean;
  isInitialized: boolean;
  needsSetup: boolean;
}> {
  try {
    const config = await loadDatabaseConfig();
    
    if (!config) {
      return {
        isConfigured: false,
        isInitialized: false,
        needsSetup: true
      };
    }
    
    const initialized = await isDatabaseInitialized();
    
    return {
      isConfigured: true,
      isInitialized: initialized,
      needsSetup: !initialized
    };
  } catch (error) {
    console.error('Error checking database setup:', error);
    return {
      isConfigured: false,
      isInitialized: false,
      needsSetup: true
    };
  }
}

export async function requireDatabaseSetup(): Promise<boolean> {
  const status = await checkDatabaseSetup();
  return status.needsSetup;
}