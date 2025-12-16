#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";
import { hashPassword } from "../server/auth.js";
import { eq } from "drizzle-orm";

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT";

console.log("🔗 Connecting to database:", DATABASE_URL.replace(/:[^:]*@/, ':****@'));

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

const db = drizzle(sql, { schema });

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Check if tables exist and create them if they don't
    await createTablesIfNotExist();

    // Clear existing data (optional - remove if you want to preserve data)
    console.log("🧹 Clearing existing sample data...");
    await clearSampleData();

    // Insert sample data
    await insertSampleData();

    console.log("🎉 Database seeding completed successfully!");

  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
}

async function createTablesIfNotExist() {
  console.log("📋 Ensuring all tables exist...");

  try {
    // Create extensions if needed
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

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
        user_id VARCHAR REFERENCES users(id) NOT NULL,
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
    
    await sql`CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire)`;

    console.log("✅ All required tables exist or were created!");

  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

async function clearSampleData() {
  try {
    // Clear in reverse dependency order
    await sql`DELETE FROM task_updates WHERE task_id IN (SELECT id FROM tasks WHERE ticket_number LIKE 'TKT-2024-%')`;
    await sql`DELETE FROM tasks WHERE ticket_number LIKE 'TKT-2024-%'`;
    await sql`DELETE FROM customer_system_details WHERE customer_id IN ('WZ001', 'WZ002', 'WZ003', 'WZ004', 'WZ005')`;
    await sql`DELETE FROM performance_metrics WHERE user_id IN ('admin-001', 'tech-001', 'tech-002', 'tech-003', 'mgr-001')`;
    await sql`DELETE FROM customers WHERE customer_id IN ('WZ001', 'WZ002', 'WZ003', 'WZ004', 'WZ005')`;
    await sql`DELETE FROM users WHERE id IN ('admin-001', 'tech-001', 'tech-002', 'tech-003', 'mgr-001')`;
    
    console.log("✅ Sample data cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing sample data:", error);
    // Don't throw - continue with seeding
  }
}

async function insertSampleData() {
  console.log("🌱 Inserting comprehensive sample data...");

  try {
    // Hash password for all users
    const hashedPassword = await hashPassword("admin123");
    console.log("🔐 Password hashed successfully");

    // Insert users
    console.log("👥 Inserting users...");
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
      },
      {
        id: 'tech-003',
        username: 'mike.systems',
        password: hashedPassword,
        email: 'mike@wizone.com',
        firstName: 'Mike',
        lastName: 'Systems',
        role: 'technician',
        department: 'Systems',
        isActive: true
      },
      {
        id: 'mgr-001',
        username: 'lisa.manager',
        password: hashedPassword,
        email: 'lisa@wizone.com',
        firstName: 'Lisa',
        lastName: 'Manager',
        role: 'manager',
        department: 'Operations',
        isActive: true
      }
    ];

    await db.insert(schema.users).values(users).onConflictDoNothing();
    console.log(`✅ Inserted ${users.length} users`);

    // Insert customers
    console.log("🏢 Inserting customers...");
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
      },
      {
        customerId: 'WZ004',
        name: 'Mumbai Finance Corp',
        contactPerson: 'Priya Sharma',
        address: '321 Financial District, BKC',
        city: 'Mumbai',
        state: 'Maharashtra',
        mobilePhone: '+91-7766554433',
        email: 'support@mumfinance.com',
        servicePlan: 'Premium Plan - 2Gbps',
        status: 'active' as const,
        portalAccess: true,
        username: 'mumfinance',
        password: 'finance123',
        latitude: '19.0596',
        longitude: '72.8656'
      },
      {
        customerId: 'WZ005',
        name: 'Delhi Digital Services',
        contactPerson: 'Amit Kumar',
        address: '654 Cyber Hub, Gurgaon',
        city: 'Delhi',
        state: 'Delhi',
        mobilePhone: '+91-6655443322',
        email: 'contact@delhidigital.co.in',
        servicePlan: 'Professional Plan - 300Mbps',
        status: 'inactive' as const,
        portalAccess: false,
        latitude: '28.4824',
        longitude: '77.0926'
      }
    ];

    await db.insert(schema.customers).values(customers).onConflictDoNothing();
    console.log(`✅ Inserted ${customers.length} customers`);

    // Get customer IDs for tasks
    const insertedCustomers = await db.select().from(schema.customers);
    const customerMap = new Map(insertedCustomers.map(c => [c.customerId, c.id]));

    // Insert tasks
    console.log("📋 Inserting tasks...");
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
      },
      {
        ticketNumber: 'TKT-2024-003',
        title: 'Server maintenance and updates',
        customerId: customerMap.get('WZ003')!,
        assignedTo: 'tech-003',
        createdBy: 'admin-001',
        priority: 'low',
        issueType: 'maintenance',
        status: 'completed' as const,
        description: 'Routine maintenance for StartupHub server infrastructure',
        estimatedTime: 180,
        actualTime: 168,
        contactPerson: 'Raj Patel'
      },
      {
        ticketNumber: 'TKT-2024-004',
        title: 'Backup system configuration',
        customerId: customerMap.get('WZ004')!,
        assignedTo: 'tech-001',
        createdBy: 'admin-001',
        priority: 'high',
        issueType: 'backup',
        status: 'in-progress' as const,
        description: 'Configure automated backup system for Mumbai Finance Corp',
        estimatedTime: 300,
        contactPerson: 'Priya Sharma'
      },
      {
        ticketNumber: 'TKT-2024-005',
        title: 'Email server troubleshooting',
        customerId: customerMap.get('WZ005')!,
        createdBy: 'admin-001',
        priority: 'medium',
        issueType: 'email',
        status: 'pending' as const,
        description: 'Resolve email delivery issues for Delhi Digital Services',
        estimatedTime: 120,
        contactPerson: 'Amit Kumar'
      }
    ];

    await db.insert(schema.tasks).values(tasks).onConflictDoNothing();
    console.log(`✅ Inserted ${tasks.length} tasks`);

    // Get task IDs for updates
    const insertedTasks = await db.select().from(schema.tasks);
    const taskMap = new Map(insertedTasks.map(t => [t.ticketNumber, t.id]));

    // Insert task updates
    console.log("📝 Inserting task updates...");
    const taskUpdates = [
      {
        taskId: taskMap.get('TKT-2024-001')!,
        updatedBy: 'tech-001',
        updateType: 'status_update',
        note: 'Started investigating the connectivity issue. Found packet loss on primary route.'
      },
      {
        taskId: taskMap.get('TKT-2024-001')!,
        updatedBy: 'tech-001',
        updateType: 'customer_feedback',
        note: 'Customer confirmed the issue is intermittent, occurs mainly during peak hours.'
      },
      {
        taskId: taskMap.get('TKT-2024-002')!,
        updatedBy: 'admin-001',
        updateType: 'assignment',
        note: 'Task assigned to security team for firewall installation.'
      },
      {
        taskId: taskMap.get('TKT-2024-003')!,
        updatedBy: 'tech-003',
        updateType: 'completion',
        note: 'Server maintenance completed successfully. All systems operational.'
      },
      {
        taskId: taskMap.get('TKT-2024-004')!,
        updatedBy: 'tech-001',
        updateType: 'progress_update',
        note: 'Backup configuration 60% complete. Setting up automated schedules.'
      }
    ];

    await db.insert(schema.taskUpdates).values(taskUpdates).onConflictDoNothing();
    console.log(`✅ Inserted ${taskUpdates.length} task updates`);

    // Insert customer system details
    console.log("💻 Inserting customer system details...");
    const systemDetails = [
      {
        customerId: 'WZ001',
        empId: 'EMP001',
        systemName: 'John-Desktop-01',
        processorName: 'Intel Core i7-11700K',
        ram: '32GB DDR4',
        hardDisk: '1TB HDD',
        ssd: '512GB NVMe SSD',
        administratorAccount: true,
        antivirusAvailable: true,
        upsAvailable: true
      },
      {
        customerId: 'WZ001',
        empId: 'EMP002',
        systemName: 'Server-Main-01',
        processorName: 'Intel Xeon Silver 4314',
        ram: '64GB DDR4 ECC',
        hardDisk: '4TB RAID 5',
        ssd: '1TB NVMe SSD',
        administratorAccount: true,
        antivirusAvailable: true,
        upsAvailable: true
      },
      {
        customerId: 'WZ002',
        empId: 'EMP003',
        systemName: 'Sarah-Laptop-01',
        processorName: 'AMD Ryzen 7 5800H',
        ram: '16GB DDR4',
        hardDisk: '1TB HDD',
        ssd: '256GB SSD',
        antivirusAvailable: true
      },
      {
        customerId: 'WZ003',
        empId: 'EMP004',
        systemName: 'Dev-Station-01',
        processorName: 'Intel Core i9-12900K',
        ram: '64GB DDR5',
        hardDisk: '2TB HDD',
        ssd: '2TB NVMe SSD',
        administratorAccount: true,
        upsAvailable: true
      }
    ];

    await db.insert(schema.customerSystemDetails).values(systemDetails).onConflictDoNothing();
    console.log(`✅ Inserted ${systemDetails.length} system details`);

    // Insert performance metrics
    console.log("📊 Inserting performance metrics...");
    const performanceMetrics = [
      {
        userId: 'tech-001',
        month: 9,
        year: 2024,
        totalTasks: 15,
        completedTasks: 12,
        averageResponseTime: '2.5',
        performanceScore: '88.5',
        customerSatisfactionRating: '4.2',
        firstCallResolutionRate: '80.0'
      },
      {
        userId: 'tech-002',
        month: 9,
        year: 2024,
        totalTasks: 12,
        completedTasks: 10,
        averageResponseTime: '3.1',
        performanceScore: '83.3',
        customerSatisfactionRating: '4.0',
        firstCallResolutionRate: '75.0'
      },
      {
        userId: 'tech-003',
        month: 9,
        year: 2024,
        totalTasks: 18,
        completedTasks: 16,
        averageResponseTime: '2.8',
        performanceScore: '91.2',
        customerSatisfactionRating: '4.5',
        firstCallResolutionRate: '85.0'
      },
      {
        userId: 'tech-001',
        month: 10,
        year: 2024,
        totalTasks: 8,
        completedTasks: 6,
        averageResponseTime: '2.2',
        performanceScore: '90.0',
        customerSatisfactionRating: '4.3',
        firstCallResolutionRate: '82.5'
      }
    ];

    await db.insert(schema.performanceMetrics).values(performanceMetrics).onConflictDoNothing();
    console.log(`✅ Inserted ${performanceMetrics.length} performance metrics`);

    console.log("🎉 All sample data inserted successfully!");

    // Print summary
    console.log("\n📋 Database Summary:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏢 Customers: ${customers.length}`);
    console.log(`   📋 Tasks: ${tasks.length}`);
    console.log(`   📝 Task Updates: ${taskUpdates.length}`);
    console.log(`   💻 System Details: ${systemDetails.length}`);
    console.log(`   📊 Performance Metrics: ${performanceMetrics.length}`);

  } catch (error) {
    console.error("❌ Error inserting sample data:", error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await seedDatabase();
    console.log("\n✅ Database is ready for use!");
    console.log("🔐 Login credentials: admin / admin123");
    console.log("🌐 Application URL: http://localhost:8050");
    process.exit(0);
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}