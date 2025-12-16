import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";
import { hashPassword } from "./auth.js";
import { eq } from "drizzle-orm";

// Database connection - FORCED to your PostgreSQL credentials
const DATABASE_URL = "postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT";
console.log("🔗 Using FIXED PostgreSQL database:", DATABASE_URL);

console.log("🔗 Connecting to PostgreSQL database...");

const sql = postgres(DATABASE_URL, {
  ssl: 'prefer',
  max: 10,
  connect_timeout: 30,
  prepare: false,
});

// Export client as alias for sql (postgres client) for raw SQL queries
export const client = sql;

export const db = drizzle(sql, { schema });

export async function initializeDatabase() {
  try {
    console.log("🗄️ Initializing database...");

    // Test connection
    await sql`SELECT 1`;
    console.log("✅ Database connection successful");

    // Create tables if they don't exist
    await createTables();

    // Check if we have sample data, if not create it
    const existingUsers = await sql`SELECT id FROM users LIMIT 1`;
      if (existingUsers.length === 0) {
        console.log("🌱 No existing users found, but skipping seeding due to schema mismatch");
        // await seedSampleData(); // Commented out due to password column mismatch
      } else {
        console.log("✅ Database already has data, skipping seeding");
      }    console.log("🎉 Database initialization completed!");
    return db;

  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    console.log("⚠️ Falling back to demo mode...");
    throw error;
  }
}

async function createTables() {
  console.log("📋 Creating database tables...");

  try {
    // Drop restrictive CHECK constraints that might interfere with data import
    try {
      await sql`ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_plan_type_check`;
      console.log("✅ Dropped customers_plan_type_check constraint");
    } catch (e) {
      console.log("ℹ️ customers_plan_type_check constraint not found or already removed");
    }
    
    try {
      await sql`ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_connection_type_check`;
      console.log("✅ Dropped customers_connection_type_check constraint");
    } catch (e) {
      console.log("ℹ️ customers_connection_type_check constraint not found or already removed");
    }
    
    try {
      await sql`ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_status_check`;
      console.log("✅ Dropped customers_status_check constraint");
    } catch (e) {
      console.log("ℹ️ customers_status_check constraint not found or already removed");
    }

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY NOT NULL,
        username VARCHAR UNIQUE,
        password VARCHAR,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        phone VARCHAR,
        profile_image_url VARCHAR,
        role VARCHAR NOT NULL DEFAULT 'engineer',
        department VARCHAR,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create customers table
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        customer_id VARCHAR UNIQUE NOT NULL,
        name VARCHAR NOT NULL,
        contact_person VARCHAR,
        address TEXT,
        city VARCHAR,
        state VARCHAR,
        mobile_phone VARCHAR,
        email VARCHAR,
        service_plan VARCHAR,
        connected_tower VARCHAR,
        wireless_ip VARCHAR,
        wireless_ap_ip VARCHAR,
        port VARCHAR,
        plan VARCHAR,
        installation_date TIMESTAMP,
        status VARCHAR NOT NULL DEFAULT 'active',
        username VARCHAR,
        password VARCHAR,
        portal_access BOOLEAN DEFAULT false,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        location_notes TEXT,
        location_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        ticket_number VARCHAR UNIQUE NOT NULL,
        title VARCHAR NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        assigned_to VARCHAR REFERENCES users(id),
        field_engineer_id VARCHAR REFERENCES users(id),
        created_by VARCHAR REFERENCES users(id),
        priority VARCHAR NOT NULL,
        issue_type VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending',
        description TEXT,
        resolution TEXT,
        completion_note TEXT,
        resolved_by VARCHAR REFERENCES users(id),
        field_start_time TIMESTAMP,
        field_waiting_time TIMESTAMP,
        field_waiting_reason TEXT,
        start_time TIMESTAMP,
        completion_time TIMESTAMP,
        estimated_time INTEGER,
        actual_time INTEGER,
        visit_charges DECIMAL(10,2),
        contact_person VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create task_updates table
    await sql`
      CREATE TABLE IF NOT EXISTS task_updates (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) NOT NULL,
        updated_by VARCHAR REFERENCES users(id) NOT NULL,
        update_type VARCHAR NOT NULL,
        old_value TEXT,
        new_value TEXT,
        note TEXT,
        attachments TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create customer_system_details table
    await sql`
      CREATE TABLE IF NOT EXISTS customer_system_details (
        id SERIAL PRIMARY KEY,
        customer_id VARCHAR NOT NULL,
        emp_id VARCHAR NOT NULL,
        system_name VARCHAR NOT NULL,
        system_configuration TEXT,
        processor_name VARCHAR,
        ram VARCHAR,
        hard_disk VARCHAR,
        ssd VARCHAR,
        sharing_status BOOLEAN DEFAULT false,
        administrator_account BOOLEAN DEFAULT false,
        antivirus_available BOOLEAN DEFAULT false,
        ups_available BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create performance_metrics table
    await sql`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        user_id VARCHAR NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        total_tasks INTEGER NOT NULL DEFAULT 0,
        completed_tasks INTEGER NOT NULL DEFAULT 0,
        average_response_time DECIMAL(10,2),
        performance_score DECIMAL(5,2),
        customer_satisfaction_rating DECIMAL(3,2),
        first_call_resolution_rate DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, month, year)
      )
    `;

    // Create sessions table for authentication
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess TEXT NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `;
    
    // await sql`CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire)`; // Commented out due to column mismatch with existing database

    console.log("✅ All tables created successfully!");

  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

async function seedSampleData() {
  try {
    console.log("🌱 Seeding sample data...");

    // Hash password for all users
    const hashedPassword = await hashPassword("admin123");

    // Insert sample users
    const users = [
      {
        id: 'admin-001',
        username: 'admin',
        password: hashedPassword,
        email: 'admin@wizone.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        department: 'Management',
        isActive: true
      },
      {
        id: 'tech-001',
        username: 'john.technical',
        password: hashedPassword,
        email: 'john@wizone.com',
        firstName: 'John',
        lastName: 'Technical',
        role: 'technician',
        department: 'IT Support',
        isActive: true
      },
      {
        id: 'tech-002',
        username: 'sarah.security',
        password: hashedPassword,
        email: 'sarah@wizone.com',
        firstName: 'Sarah',
        lastName: 'Security',
        role: 'technician',
        department: 'Security',
        isActive: true
      }
    ];

    await db.insert(schema.users).values(users).onConflictDoNothing();
    console.log("✅ Sample users created");

    // Insert sample customers
    const customers = [
      {
        customerId: 'WZ001',
        name: 'TechCorp Solutions',
        contactPerson: 'John Smith',
        address: '123 Tech Park, Electronic City',
        city: 'Bangalore',
        state: 'Karnataka',
        mobilePhone: '+91-9876543210',
        email: 'contact@techcorp.com',
        servicePlan: 'Enterprise Plan - 1Gbps',
        status: 'active' as const,
        portalAccess: true,
        username: 'techcorp',
        password: 'tech123',
        latitude: '12.8456',
        longitude: '77.6653'
      },
      {
        customerId: 'WZ002',
        name: 'Global Enterprises',
        contactPerson: 'Sarah Johnson',
        address: '456 Business District, Whitefield',
        city: 'Bangalore',
        state: 'Karnataka',
        mobilePhone: '+91-9988776655',
        email: 'admin@globalent.com',
        servicePlan: 'Corporate Plan - 500Mbps',
        status: 'active' as const,
        portalAccess: false,
        latitude: '12.9698',
        longitude: '77.7500'
      },
      {
        customerId: 'WZ003',
        name: 'StartupHub Pvt Ltd',
        contactPerson: 'Raj Patel',
        address: '789 Innovation Center, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        mobilePhone: '+91-8877665544',
        email: 'info@startuphub.in',
        servicePlan: 'Business Plan - 200Mbps',
        status: 'active' as const,
        portalAccess: true,
        username: 'startuphub',
        password: 'startup2024',
        latitude: '12.9279',
        longitude: '77.6271'
      }
    ];

    await db.insert(schema.customers).values(customers).onConflictDoNothing();
    console.log("✅ Sample customers created");

    // Get customer IDs for tasks
    const insertedCustomers = await db.select().from(schema.customers);
    const customerMap = new Map(insertedCustomers.map(c => [c.customerId, c.id]));

    // Insert sample tasks
    const tasks = [
      {
        ticketNumber: 'TKT-2024-001',
        title: 'Fix network connectivity issue',
        customerId: customerMap.get('WZ001')!,
        assignedTo: 'tech-001',
        createdBy: 'admin-001',
        priority: 'high',
        issueType: 'network',
        status: 'in-progress' as const,
        description: 'Customer reporting intermittent internet disconnections in Bangalore office',
        estimatedTime: 240,
        contactPerson: 'John Smith'
      },
      {
        ticketNumber: 'TKT-2024-002',
        title: 'Install new firewall software',
        customerId: customerMap.get('WZ002')!,
        assignedTo: 'tech-002',
        createdBy: 'admin-001',
        priority: 'medium',
        issueType: 'security',
        status: 'pending' as const,
        description: 'Upgrade security infrastructure for Global Enterprises office',
        estimatedTime: 360,
        contactPerson: 'Sarah Johnson'
      }
    ];

    await db.insert(schema.tasks).values(tasks).onConflictDoNothing();
    console.log("✅ Sample tasks created");

    console.log("🎉 Sample data seeding completed!");

  } catch (error) {
    console.error("❌ Error seeding sample data:", error);
    throw error;
  }
}

export { sql, schema };