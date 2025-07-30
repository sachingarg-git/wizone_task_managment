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

export interface InitializationResult {
  success: boolean;
  adminCreated: boolean;
  usersCreated: number;
  customersCreated: number;
  error?: string;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`;
}

export async function initializeDatabase(adminConfig: AdminUserConfig): Promise<InitializationResult> {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Create admin user
    const adminId = `admin_${Date.now()}`;
    const hashedPassword = await hashPassword(adminConfig.password);
    
    request.input('adminId', adminId);
    request.input('username', adminConfig.username);
    request.input('password', hashedPassword);
    request.input('email', adminConfig.email);
    request.input('firstName', adminConfig.firstName);
    request.input('lastName', adminConfig.lastName);
    
    await request.query(`
      INSERT INTO users (
        id, username, password, email, firstName, lastName,
        role, department, isActive, createdAt, updatedAt
      )
      VALUES (
        @adminId, @username, @password, @email, @firstName, @lastName,
        'admin', 'Administration', 1, GETDATE(), GETDATE()
      )
    `);
    
    console.log(`✅ Admin user created: ${adminConfig.username}`);
    
    // Create sample field engineers
    const sampleUsers = [
      {
        username: 'ravi_engineer',
        password: 'field123',
        email: 'ravi@wizoneit.com',
        firstName: 'Ravi',
        lastName: 'Kumar',
        role: 'field_engineer',
        department: 'Field Operations'
      },
      {
        username: 'sachin_engineer',
        password: 'field123',
        email: 'sachin@wizoneit.com',
        firstName: 'Sachin',
        lastName: 'Sharma', 
        role: 'field_engineer',
        department: 'Field Operations'
      },
      {
        username: 'backend_engineer',
        password: 'backend123',
        email: 'backend@wizoneit.com',
        firstName: 'Backend',
        lastName: 'Engineer',
        role: 'backend_engineer',
        department: 'Technical Support'
      },
      {
        username: 'manager_user',
        password: 'manager123',
        email: 'manager@wizoneit.com',
        firstName: 'System',
        lastName: 'Manager',
        role: 'manager',
        department: 'Management'
      }
    ];
    
    let usersCreated = 1; // Admin already created
    
    for (const user of sampleUsers) {
      try {
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userPassword = await hashPassword(user.password);
        
        const userRequest = pool.request();
        userRequest.input('userId', userId);
        userRequest.input('username', user.username);
        userRequest.input('password', userPassword);
        userRequest.input('email', user.email);
        userRequest.input('firstName', user.firstName);
        userRequest.input('lastName', user.lastName);
        userRequest.input('role', user.role);
        userRequest.input('department', user.department);
        
        await userRequest.query(`
          INSERT INTO users (
            id, username, password, email, firstName, lastName,
            role, department, isActive, createdAt, updatedAt
          )
          VALUES (
            @userId, @username, @password, @email, @firstName, @lastName,
            @role, @department, 1, GETDATE(), GETDATE()
          )
        `);
        
        usersCreated++;
        console.log(`✅ Sample user created: ${user.username}`);
        
      } catch (error) {
        console.log(`⚠️ Warning: Could not create user ${user.username}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // Create sample customers
    const sampleCustomers = [
      {
        customerId: 'CUST001',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+91-9876543210',
        address: 'House No. 123, Sector 15, Gurgaon, Haryana',
        serviceType: 'Broadband Internet',
        connectionStatus: 'active',
        monthlyCharge: 999.00
      },
      {
        customerId: 'CUST002', 
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91-9876543211',
        address: 'Flat No. 456, Block A, Dwarka, New Delhi',
        serviceType: 'Fiber Internet + TV',
        connectionStatus: 'active',
        monthlyCharge: 1499.00
      },
      {
        customerId: 'CUST003',
        name: 'Amit Singh',
        email: 'amit.singh@example.com', 
        phone: '+91-9876543212',
        address: 'Plot No. 789, Phase 2, Noida, UP',
        serviceType: 'Business Internet',
        connectionStatus: 'active',
        monthlyCharge: 2999.00
      },
      {
        customerId: 'CUST004',
        name: 'Sunita Devi',
        email: 'sunita.devi@example.com',
        phone: '+91-9876543213',
        address: 'House No. 321, Lajpat Nagar, New Delhi',
        serviceType: 'Basic Internet',
        connectionStatus: 'pending',
        monthlyCharge: 599.00
      },
      {
        customerId: 'CUST005',
        name: 'Rohit Gupta',
        email: 'rohit.gupta@example.com',
        phone: '+91-9876543214',
        address: 'Apartment 567, Cyber City, Gurgaon, Haryana',
        serviceType: 'Premium Internet + TV + Phone',
        connectionStatus: 'active',
        monthlyCharge: 1999.00
      }
    ];
    
    let customersCreated = 0;
    
    for (const customer of sampleCustomers) {
      try {
        const customerRequest = pool.request();
        customerRequest.input('customerId', customer.customerId);
        customerRequest.input('name', customer.name);
        customerRequest.input('email', customer.email);
        customerRequest.input('phone', customer.phone);
        customerRequest.input('address', customer.address);
        customerRequest.input('serviceType', customer.serviceType);
        customerRequest.input('connectionStatus', customer.connectionStatus);
        customerRequest.input('monthlyCharge', customer.monthlyCharge);
        
        await customerRequest.query(`
          INSERT INTO customers (
            customerId, name, email, phone, address, serviceType,
            connectionStatus, monthlyCharge, createdAt, updatedAt
          )
          VALUES (
            @customerId, @name, @email, @phone, @address, @serviceType,
            @connectionStatus, @monthlyCharge, GETDATE(), GETDATE()
          )
        `);
        
        customersCreated++;
        console.log(`✅ Sample customer created: ${customer.name} (${customer.customerId})`);
        
      } catch (error) {
        console.log(`⚠️ Warning: Could not create customer ${customer.customerId}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // Create a sample task
    try {
      const taskRequest = pool.request();
      taskRequest.input('ticketNumber', 'TSK001');
      taskRequest.input('title', 'Internet Connection Setup');
      taskRequest.input('description', 'New customer requires internet connection installation and setup');
      taskRequest.input('customerName', 'Rajesh Kumar');
      taskRequest.input('status', 'pending');
      taskRequest.input('priority', 'medium');
      taskRequest.input('issueType', 'Installation');
      
      await taskRequest.query(`
        INSERT INTO tasks (
          ticketNumber, title, description, customerId, customerName,
          status, priority, issueType, createdAt, updatedAt
        )
        VALUES (
          @ticketNumber, @title, @description, 1, @customerName,
          @status, @priority, @issueType, GETDATE(), GETDATE()
        )
      `);
      
      console.log('✅ Sample task created');
      
    } catch (error) {
      console.log('⚠️ Warning: Could not create sample task:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Create a default chat room
    try {
      const chatRequest = pool.request();
      chatRequest.input('name', 'General Support');
      chatRequest.input('description', 'General communication channel for all team members');
      chatRequest.input('createdBy', adminId);
      
      await chatRequest.query(`
        INSERT INTO chat_rooms (
          name, description, isActive, createdBy, createdAt, updatedAt
        )
        VALUES (
          @name, @description, 1, @createdBy, GETDATE(), GETDATE()
        )
      `);
      
      console.log('✅ Default chat room created');
      
    } catch (error) {
      console.log('⚠️ Warning: Could not create chat room:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log(`🎉 Database initialization completed successfully!`);
    console.log(`📊 Summary: ${usersCreated} users, ${customersCreated} customers created`);
    
    return {
      success: true,
      adminCreated: true,
      usersCreated,
      customersCreated
    };
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return {
      success: false,
      adminCreated: false,
      usersCreated: 0,
      customersCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function createDefaultBotConfiguration(): Promise<void> {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    request.input('name', 'Wizone Telegram Bot');
    request.input('botToken', 'YOUR_BOT_TOKEN_HERE');
    request.input('chatId', 'YOUR_CHAT_ID_HERE');
    
    await request.query(`
      INSERT INTO bot_configurations (
        name, botToken, chatId, isActive, notifyOnTaskCreate,
        notifyOnTaskUpdate, notifyOnTaskComplete, createdAt, updatedAt
      )
      VALUES (
        @name, @botToken, @chatId, 0, 1, 1, 1, GETDATE(), GETDATE()
      )
    `);
    
    console.log('✅ Default bot configuration created');
    
  } catch (error) {
    console.log('⚠️ Warning: Could not create bot configuration:', error instanceof Error ? error.message : 'Unknown error');
  }
}