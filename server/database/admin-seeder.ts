import { getConnection } from './mssql-connection';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export interface AdminUserConfig {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}

const DEFAULT_ADMIN: AdminUserConfig = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@wizoneit.com',
  firstName: 'System',
  lastName: 'Administrator'
};

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`;
}

export async function createDefaultAdmin(adminConfig?: AdminUserConfig): Promise<boolean> {
  try {
    const pool = await getConnection();
    const config = adminConfig || DEFAULT_ADMIN;
    
    console.log('Creating default admin user...');
    
    // Check if admin user already exists
    const checkRequest = pool.request();
    checkRequest.input('username', config.username);
    
    const existingUser = await checkRequest.query(`
      SELECT COUNT(*) as count FROM users WHERE username = @username
    `);
    
    if (existingUser.recordset[0].count > 0) {
      console.log('Admin user already exists, skipping...');
      return true;
    }
    
    // Hash password
    const hashedPassword = await hashPassword(config.password);
    
    // Create admin user
    const insertRequest = pool.request();
    insertRequest.input('id', 'admin001');
    insertRequest.input('username', config.username);
    insertRequest.input('password', hashedPassword);
    insertRequest.input('email', config.email);
    insertRequest.input('firstName', config.firstName);
    insertRequest.input('lastName', config.lastName);
    insertRequest.input('role', 'admin');
    insertRequest.input('department', 'WIZONE IT SUPPORT');
    insertRequest.input('isActive', true);
    
    await insertRequest.query(`
      INSERT INTO users (
        id, username, password, email, firstName, lastName, 
        role, department, isActive, createdAt, updatedAt
      )
      VALUES (
        @id, @username, @password, @email, @firstName, @lastName,
        @role, @department, @isActive, GETDATE(), GETDATE()
      )
    `);
    
    console.log(`✅ Default admin user created: ${config.username}/${config.password}`);
    return true;
    
  } catch (error) {
    console.error('Failed to create default admin user:', error);
    return false;
  }
}

export async function createSampleUsers(): Promise<boolean> {
  try {
    const pool = await getConnection();
    
    console.log('Creating sample users...');
    
    const sampleUsers = [
      {
        id: 'field001',
        username: 'RAVI',
        password: 'admin123',
        email: 'ravi@wizoneit.com',
        firstName: 'RAVI',
        lastName: 'SAINI',
        role: 'field_engineer',
        department: 'FIELD OPERATIONS'
      },
      {
        id: 'field002',
        username: 'sachin',
        password: 'admin123',
        email: 'sachin@wizoneit.com',
        firstName: 'Sachin',
        lastName: 'Garg',
        role: 'field_engineer',
        department: 'FIELD OPERATIONS'
      },
      {
        id: 'manager001',
        username: 'manpreet',
        password: 'admin123',
        email: 'manpreet@wizoneit.com',
        firstName: 'Manpreet',
        lastName: 'Singh',
        role: 'manager',
        department: 'OPERATIONS'
      }
    ];
    
    for (const user of sampleUsers) {
      try {
        // Check if user exists
        const checkRequest = pool.request();
        checkRequest.input('username', user.username);
        
        const existingUser = await checkRequest.query(`
          SELECT COUNT(*) as count FROM users WHERE username = @username
        `);
        
        if (existingUser.recordset[0].count > 0) {
          console.log(`User ${user.username} already exists, skipping...`);
          continue;
        }
        
        // Hash password
        const hashedPassword = await hashPassword(user.password);
        
        // Create user
        const insertRequest = pool.request();
        insertRequest.input('id', user.id);
        insertRequest.input('username', user.username);
        insertRequest.input('password', hashedPassword);
        insertRequest.input('email', user.email);
        insertRequest.input('firstName', user.firstName);
        insertRequest.input('lastName', user.lastName);
        insertRequest.input('role', user.role);
        insertRequest.input('department', user.department);
        insertRequest.input('isActive', true);
        
        await insertRequest.query(`
          INSERT INTO users (
            id, username, password, email, firstName, lastName, 
            role, department, isActive, createdAt, updatedAt
          )
          VALUES (
            @id, @username, @password, @email, @firstName, @lastName,
            @role, @department, @isActive, GETDATE(), GETDATE()
          )
        `);
        
        console.log(`✅ Sample user created: ${user.username}`);
        
      } catch (error) {
        console.error(`Failed to create user ${user.username}:`, error);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('Failed to create sample users:', error);
    return false;
  }
}

export async function createSampleCustomers(): Promise<boolean> {
  try {
    const pool = await getConnection();
    
    console.log('Creating sample customers...');
    
    const sampleCustomers = [
      {
        customerId: 'C001001',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@gmail.com',
        phone: '+91-9876543210',
        address: '123 MG Road, Delhi',
        serviceType: 'Broadband',
        connectionStatus: 'active',
        monthlyCharge: 899.00
      },
      {
        customerId: 'C001002',
        name: 'Priya Singh',
        email: 'priya.singh@yahoo.com',
        phone: '+91-9876543211',
        address: '456 CP Road, Mumbai',
        serviceType: 'Fiber',
        connectionStatus: 'active',
        monthlyCharge: 1299.00
      },
      {
        customerId: 'C001003',
        name: 'Amit Kumar',
        email: 'amit.kumar@hotmail.com',
        phone: '+91-9876543212',
        address: '789 Brigade Road, Bangalore',
        serviceType: 'Cable',
        connectionStatus: 'pending',
        monthlyCharge: 699.00
      }
    ];
    
    for (const customer of sampleCustomers) {
      try {
        // Check if customer exists
        const checkRequest = pool.request();
        checkRequest.input('customerId', customer.customerId);
        
        const existingCustomer = await checkRequest.query(`
          SELECT COUNT(*) as count FROM customers WHERE customerId = @customerId
        `);
        
        if (existingCustomer.recordset[0].count > 0) {
          console.log(`Customer ${customer.customerId} already exists, skipping...`);
          continue;
        }
        
        // Create customer
        const insertRequest = pool.request();
        insertRequest.input('customerId', customer.customerId);
        insertRequest.input('name', customer.name);
        insertRequest.input('email', customer.email);
        insertRequest.input('phone', customer.phone);
        insertRequest.input('address', customer.address);
        insertRequest.input('serviceType', customer.serviceType);
        insertRequest.input('connectionStatus', customer.connectionStatus);
        insertRequest.input('monthlyCharge', customer.monthlyCharge);
        
        await insertRequest.query(`
          INSERT INTO customers (
            customerId, name, email, phone, address, serviceType, 
            connectionStatus, monthlyCharge, createdAt, updatedAt
          )
          VALUES (
            @customerId, @name, @email, @phone, @address, @serviceType,
            @connectionStatus, @monthlyCharge, GETDATE(), GETDATE()
          )
        `);
        
        console.log(`✅ Sample customer created: ${customer.name}`);
        
      } catch (error) {
        console.error(`Failed to create customer ${customer.name}:`, error);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('Failed to create sample customers:', error);
    return false;
  }
}

export async function initializeDatabase(adminConfig?: AdminUserConfig): Promise<{
  success: boolean;
  adminCreated: boolean;
  usersCreated: boolean;
  customersCreated: boolean;
}> {
  try {
    console.log('Initializing database with sample data...');
    
    const adminCreated = await createDefaultAdmin(adminConfig);
    const usersCreated = await createSampleUsers();
    const customersCreated = await createSampleCustomers();
    
    const success = adminCreated && usersCreated && customersCreated;
    
    if (success) {
      console.log('✅ Database initialization completed successfully');
    } else {
      console.log('⚠️ Database initialization completed with some errors');
    }
    
    return {
      success,
      adminCreated,
      usersCreated,
      customersCreated
    };
    
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return {
      success: false,
      adminCreated: false,
      usersCreated: false,
      customersCreated: false
    };
  }
}