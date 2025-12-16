const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/database.json'), 'utf8')
);

const config = {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.username,
  password: dbConfig.password,
  ssl: dbConfig.ssl || false,
  connectionTimeoutMillis: dbConfig.connectionTimeout || 30000,
  query_timeout: dbConfig.requestTimeout || 30000,
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000
};

let pool = null;

// Initialize database connection
async function initDatabase() {
  try {
    if (pool) {
      return pool;
    }
    
    pool = new Pool(config);
    console.log('✅ Connected to PostgreSQL database');
    
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    // Initialize tables if they don't exist
    await initializeTables();
    
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Initialize database tables
async function initializeTables() {
  try {
    const client = await pool.connect();
    
    // Check if customers table exists
    const tableExists = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'customers'
    `);
    
    if (parseInt(tableExists.rows[0].count) === 0) {
      console.log('📊 Creating database tables...');
      
      // Create customers table
      await client.query(`
        CREATE TABLE customers (
          id SERIAL PRIMARY KEY,
          customer_id VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          email VARCHAR(100),
          contact_person VARCHAR(100),
          mobile_phone VARCHAR(20),
          address TEXT,
          city VARCHAR(50),
          state VARCHAR(50),
          country VARCHAR(50) DEFAULT 'India',
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          connection_type VARCHAR(20),
          plan_type VARCHAR(20),
          service_plan VARCHAR(100),
          monthly_fee DECIMAL(10, 2),
          status VARCHAR(20) DEFAULT 'active',
          portal_access BOOLEAN DEFAULT false,
          portal_username VARCHAR(50),
          portal_password VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create users table
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'engineer',
          department VARCHAR(100),
          phone VARCHAR(20),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create customer_system_details table
      await client.query(`
        CREATE TABLE customer_system_details (
          id SERIAL PRIMARY KEY,
          customer_id VARCHAR(20) REFERENCES customers(customer_id),
          emp_id VARCHAR(20),
          system_name VARCHAR(100) NOT NULL,
          processor VARCHAR(100),
          ram VARCHAR(50),
          hard_disk VARCHAR(100),
          ssd VARCHAR(100),
          operating_system VARCHAR(100),
          antivirus VARCHAR(100),
          ms_office VARCHAR(100),
          other_software TEXT,
          configuration TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Database tables created successfully');
      
      // Check if admin user exists, if not create it
      const adminCheck = await client.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        ['admin@wizone.com', 'admin']
      );
      
      if (adminCheck.rows.length === 0) {
        await client.query(`
          INSERT INTO users (username, email, first_name, last_name, role, department, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, ['admin', 'admin@wizone.com', 'Admin', 'User', 'admin', 'IT', true]);
        
        console.log('✅ Admin user created successfully');
      }
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error initializing tables:', error);
    throw error;
  }
}

// Customer database operations
const customerDB = {
  // Get all customers
  async getAll() {
    try {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT c.*, 
               COUNT(csd.id) as system_count
        FROM customers c
        LEFT JOIN customer_system_details csd ON c.customer_id = csd.customer_id
        GROUP BY c.id, c.customer_id, c.name, c.email, c.contact_person, 
                 c.mobile_phone, c.address, c.city, c.state, c.country,
                 c.latitude, c.longitude, c.connection_type, c.plan_type,
                 c.service_plan, c.monthly_fee, c.status, c.portal_access,
                 c.portal_username, c.portal_password, c.created_at, c.updated_at
        ORDER BY c.created_at DESC
      `);
      
      client.release();
      
      return result.rows.map(customer => ({
        ...customer,
        portal_access: !!customer.portal_access,
        portalAccess: customer.portal_access ? {
          enabled: true,
          username: customer.portal_username,
          password: customer.portal_password,
          portalUrl: '/customer-portal',
          createdAt: customer.created_at
        } : null
      }));
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  },

  // Get customer by ID
  async getById(id) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM customers WHERE id = $1', [id]);
      client.release();
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const customer = result.rows[0];
      return {
        ...customer,
        portal_access: !!customer.portal_access,
        portalAccess: customer.portal_access ? {
          enabled: true,
          username: customer.portal_username,
          password: customer.portal_password,
          portalUrl: '/customer-portal',
          createdAt: customer.created_at
        } : null
      };
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      throw error;
    }
  },

  // Create new customer
  async create(customerData) {
    try {
      const client = await pool.connect();
      
      // Generate customer ID if not provided
      const customerId = customerData.customer_id || `CUST${Date.now()}`;
      
      const result = await client.query(`
        INSERT INTO customers (
          customer_id, name, email, contact_person, mobile_phone, 
          address, city, state, country, service_plan, status
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        customerId,
        customerData.name,
        customerData.email,
        customerData.contact_person,
        customerData.mobile_phone,
        customerData.address,
        customerData.city,
        customerData.state,
        customerData.country || 'India',
        customerData.service_plan,
        customerData.status || 'active'
      ]);
      
      client.release();
      return result.rows[0];
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // Update customer portal access
  async updatePortalAccess(customerId, portalData) {
    try {
      const client = await pool.connect();
      
      const result = await client.query(`
        UPDATE customers 
        SET portal_access = $1,
            portal_username = $2,
            portal_password = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [portalData.enabled, portalData.username, portalData.password, customerId]);
      
      client.release();
      
      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }
      
      const customer = result.rows[0];
      return {
        ...customer,
        portal_access: !!customer.portal_access,
        portalAccess: customer.portal_access ? {
          enabled: true,
          username: customer.portal_username,
          password: customer.portal_password,
          portalUrl: '/customer-portal',
          createdAt: customer.created_at
        } : null
      };
    } catch (error) {
      console.error('Error updating portal access:', error);
      throw error;
    }
  },

  // Get customer system details
  async getSystemDetails(customerIdOrString) {
    try {
      const client = await pool.connect();
      
      // Check if it's a numeric ID or customer_id string
      if (typeof customerIdOrString === 'number' || /^\d+$/.test(customerIdOrString)) {
        // It's a numeric ID, get customer_id first
        const customerResult = await client.query(
          'SELECT customer_id FROM customers WHERE id = $1',
          [parseInt(customerIdOrString)]
        );
        
        if (customerResult.rows.length === 0) {
          client.release();
          return [];
        }
        
        const actualCustomerId = customerResult.rows[0].customer_id;
        const result = await client.query(
          'SELECT * FROM customer_system_details WHERE customer_id = $1 ORDER BY created_at DESC',
          [actualCustomerId]
        );
        
        client.release();
        return result.rows;
      } else {
        // It's already a customer_id string
        const result = await client.query(
          'SELECT * FROM customer_system_details WHERE customer_id = $1 ORDER BY created_at DESC',
          [customerIdOrString]
        );
        
        client.release();
        return result.rows;
      }
    } catch (error) {
      console.error('Error getting system details:', error);
      throw error;
    }
  },

  // Create system details
  async createSystemDetails(systemData) {
    try {
      const client = await pool.connect();
      
      const result = await client.query(`
        INSERT INTO customer_system_details (
          customer_id, emp_id, system_name, processor, ram, hard_disk, 
          ssd, operating_system, antivirus, ms_office, other_software, configuration
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        systemData.customer_id,
        systemData.emp_id,
        systemData.system_name,
        systemData.processor,
        systemData.ram,
        systemData.hard_disk,
        systemData.ssd,
        systemData.operating_system,
        systemData.antivirus,
        systemData.ms_office,
        systemData.other_software,
        systemData.configuration
      ]);
      
      client.release();
      return result.rows[0];
    } catch (error) {
      console.error('Error creating system details:', error);
      throw error;
    }
  }
};

// User database operations
const userDB = {
  // Get all users
  async getAll() {
    try {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT id, username, email, first_name, last_name, role, 
               department, phone, is_active, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `);
      
      client.release();
      return result.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        department: user.department,
        phone: user.phone,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  },

  // Get user by ID
  async getById(id) {
    try {
      const client = await pool.connect();
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      client.release();
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        department: user.department,
        phone: user.phone,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  },

  // Create user
  async create(userData) {
    try {
      const client = await pool.connect();
      
      const result = await client.query(`
        INSERT INTO users (
          username, email, first_name, last_name, role, 
          department, phone, is_active
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        userData.username,
        userData.email,
        userData.firstName,
        userData.lastName,
        userData.role || 'engineer',
        userData.department || userData.role || 'IT',
        userData.phone || '',
        userData.isActive !== undefined ? userData.isActive : true
      ]);
      
      client.release();
      
      const user = result.rows[0];
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        department: user.department,
        phone: user.phone,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  async update(id, userData) {
    try {
      const client = await pool.connect();
      
      const result = await client.query(`
        UPDATE users 
        SET username = $1,
            email = $2,
            first_name = $3,
            last_name = $4,
            role = $5,
            department = $6,
            phone = $7,
            is_active = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
      `, [
        userData.username,
        userData.email,
        userData.firstName,
        userData.lastName,
        userData.role,
        userData.department,
        userData.phone,
        userData.isActive,
        id
      ]);
      
      client.release();
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        department: user.department,
        phone: user.phone,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user
  async delete(id) {
    try {
      const client = await pool.connect();
      
      const result = await client.query(
        'DELETE FROM users WHERE id = $1 RETURNING *',
        [id]
      );
      
      client.release();
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
};

// Close database connection
async function closeDatabase() {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      console.log('🔒 Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database:', error);
  }
}

module.exports = {
  initDatabase,
  customerDB,
  userDB,
  closeDatabase
};