#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "../shared/schema.js";
import { hashPassword } from "../server/auth.js";

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT";

console.log("🔗 Connecting to database:", DATABASE_URL.replace(/:[^:]*@/, ':****@'));

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

const db = drizzle(sql, { schema });

async function initializeDatabase() {
  try {
    console.log("🗄️ Starting database initialization...");

    // Create all tables by running migrations (if you have migration files)
    // For now, we'll create tables manually using CREATE TABLE IF NOT EXISTS

    console.log("📋 Creating tables...");

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess TEXT NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `;

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
      );
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
      );
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
      );
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
      );
    `;

    // Create customer_system_details table
    await sql`
      CREATE TABLE IF NOT EXISTS customer_system_details (
        id SERIAL PRIMARY KEY,
        customer_id VARCHAR REFERENCES customers(customer_id) NOT NULL,
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
      );
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
      );
    `;

    // Create domains table
    await sql`
      CREATE TABLE IF NOT EXISTS domains (
        id SERIAL PRIMARY KEY,
        domain VARCHAR NOT NULL UNIQUE,
        custom_domain VARCHAR,
        ssl BOOLEAN DEFAULT false,
        status VARCHAR NOT NULL DEFAULT 'pending',
        owner_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create sql_connections table
    await sql`
      CREATE TABLE IF NOT EXISTS sql_connections (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        description TEXT,
        host VARCHAR NOT NULL,
        port INTEGER NOT NULL DEFAULT 5432,
        database VARCHAR NOT NULL,
        username VARCHAR NOT NULL,
        password TEXT NOT NULL,
        connection_type VARCHAR NOT NULL DEFAULT 'postgresql',
        ssl_enabled BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        last_tested TIMESTAMP,
        test_status VARCHAR,
        test_result TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create office_locations table
    await sql`
      CREATE TABLE IF NOT EXISTS office_locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        address TEXT,
        is_main_office BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create bot_configurations table
    await sql`
      CREATE TABLE IF NOT EXISTS bot_configurations (
        id SERIAL PRIMARY KEY,
        config_name VARCHAR NOT NULL,
        bot_type VARCHAR NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        telegram_bot_token VARCHAR,
        telegram_chat_id VARCHAR,
        telegram_parse_mode VARCHAR DEFAULT 'HTML',
        whatsapp_api_url VARCHAR,
        whatsapp_api_key VARCHAR,
        whatsapp_phone_number VARCHAR,
        whatsapp_business_id VARCHAR,
        webhook_url VARCHAR,
        webhook_method VARCHAR DEFAULT 'POST',
        webhook_headers JSON,
        webhook_auth VARCHAR,
        notify_on_task_create BOOLEAN DEFAULT true,
        notify_on_task_update BOOLEAN DEFAULT true,
        notify_on_task_complete BOOLEAN DEFAULT true,
        notify_on_task_assign BOOLEAN DEFAULT true,
        notify_on_task_status_change BOOLEAN DEFAULT true,
        notify_on_high_priority BOOLEAN DEFAULT true,
        task_create_template TEXT,
        task_update_template TEXT,
        task_complete_template TEXT,
        task_assign_template TEXT,
        status_change_template TEXT,
        filter_by_priority TEXT[],
        filter_by_status TEXT[],
        filter_by_department TEXT[],
        filter_by_user TEXT[],
        max_notifications_per_hour INTEGER DEFAULT 100,
        retry_count INTEGER DEFAULT 3,
        retry_delay INTEGER DEFAULT 5,
        last_test_result VARCHAR,
        last_test_time TIMESTAMP,
        test_message TEXT,
        created_by VARCHAR REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log("✅ All tables created successfully!");

    // Now populate with sample data
    await populateSampleData();

    console.log("🎉 Database initialization completed successfully!");

  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

async function populateSampleData() {
  console.log("🌱 Seeding database with sample data...");

  try {
    // Insert sample users
    console.log("👥 Inserting users...");
    const hashedPassword = await hashPassword("admin123");
    
    await sql`
      INSERT INTO users (id, username, password, email, first_name, last_name, role, department, is_active)
      VALUES 
        ('admin-001', 'admin', ${hashedPassword}, 'admin@wizone.com', 'Admin', 'User', 'admin', 'Management', true),
        ('tech-001', 'john.technical', ${hashedPassword}, 'john@wizone.com', 'John', 'Technical', 'technician', 'IT Support', true),
        ('tech-002', 'sarah.security', ${hashedPassword}, 'sarah@wizone.com', 'Sarah', 'Security', 'technician', 'Security', true),
        ('tech-003', 'mike.systems', ${hashedPassword}, 'mike@wizone.com', 'Mike', 'Systems', 'technician', 'Systems', true),
        ('mgr-001', 'lisa.manager', ${hashedPassword}, 'lisa@wizone.com', 'Lisa', 'Manager', 'manager', 'Operations', true)
      ON CONFLICT (id) DO NOTHING;
    `;

    // Insert sample customers
    console.log("🏢 Inserting customers...");
    await sql`
      INSERT INTO customers (customer_id, name, contact_person, address, city, state, mobile_phone, email, 
                           service_plan, status, portal_access, username, password, latitude, longitude)
      VALUES 
        ('WZ001', 'TechCorp Solutions', 'John Smith', '123 Tech Park, Electronic City', 'Bangalore', 'Karnataka', 
         '+91-9876543210', 'contact@techcorp.com', 'Enterprise Plan - 1Gbps', 'active', true, 'techcorp', 
         'tech123', 12.8456, 77.6653),
        ('WZ002', 'Global Enterprises', 'Sarah Johnson', '456 Business District, Whitefield', 'Bangalore', 'Karnataka',
         '+91-9988776655', 'admin@globalent.com', 'Corporate Plan - 500Mbps', 'active', false, '', '', 12.9698, 77.7500),
        ('WZ003', 'StartupHub Pvt Ltd', 'Raj Patel', '789 Innovation Center, Koramangala', 'Bangalore', 'Karnataka',
         '+91-8877665544', 'info@startuphub.in', 'Business Plan - 200Mbps', 'active', true, 'startuphub', 
         'startup2024', 12.9279, 77.6271),
        ('WZ004', 'Mumbai Finance Corp', 'Priya Sharma', '321 Financial District, BKC', 'Mumbai', 'Maharashtra',
         '+91-7766554433', 'support@mumfinance.com', 'Premium Plan - 2Gbps', 'active', true, 'mumfinance',
         'finance123', 19.0596, 72.8656),
        ('WZ005', 'Delhi Digital Services', 'Amit Kumar', '654 Cyber Hub, Gurgaon', 'Delhi', 'Delhi',
         '+91-6655443322', 'contact@delhidigital.co.in', 'Professional Plan - 300Mbps', 'inactive', false, 
         '', '', 28.4824, 77.0926)
      ON CONFLICT (customer_id) DO NOTHING;
    `;

    // Insert sample tasks
    console.log("📋 Inserting tasks...");
    await sql`
      INSERT INTO tasks (ticket_number, title, customer_id, assigned_to, created_by, priority, issue_type, 
                        status, description, estimated_time, contact_person)
      VALUES 
        ('TKT-2024-001', 'Fix network connectivity issue', 1, 'tech-001', 'admin-001', 'high', 'network',
         'in-progress', 'Customer reporting intermittent internet disconnections in Bangalore office', 240, 'John Smith'),
        ('TKT-2024-002', 'Install new firewall software', 2, 'tech-002', 'admin-001', 'medium', 'security',
         'pending', 'Upgrade security infrastructure for Global Enterprises office', 360, 'Sarah Johnson'),
        ('TKT-2024-003', 'Server maintenance and updates', 3, 'tech-003', 'admin-001', 'low', 'maintenance',
         'completed', 'Routine maintenance for StartupHub server infrastructure', 180, 'Raj Patel'),
        ('TKT-2024-004', 'Backup system configuration', 4, 'tech-001', 'admin-001', 'high', 'backup',
         'in-progress', 'Configure automated backup system for Mumbai Finance Corp', 300, 'Priya Sharma'),
        ('TKT-2024-005', 'Email server troubleshooting', 5, NULL, 'admin-001', 'medium', 'email',
         'pending', 'Resolve email delivery issues for Delhi Digital Services', 120, 'Amit Kumar')
      ON CONFLICT (ticket_number) DO NOTHING;
    `;

    // Insert task updates
    console.log("📝 Inserting task updates...");
    await sql`
      INSERT INTO task_updates (task_id, updated_by, update_type, note)
      VALUES 
        (1, 'tech-001', 'status_update', 'Started investigating the connectivity issue. Found packet loss on primary route.'),
        (1, 'tech-001', 'customer_feedback', 'Customer confirmed the issue is intermittent, occurs mainly during peak hours.'),
        (2, 'admin-001', 'assignment', 'Task assigned to security team for firewall installation.'),
        (3, 'tech-003', 'completion', 'Server maintenance completed successfully. All systems operational.'),
        (4, 'tech-001', 'progress_update', 'Backup configuration 60% complete. Setting up automated schedules.')
      ON CONFLICT DO NOTHING;
    `;

    // Insert customer system details
    console.log("💻 Inserting customer system details...");
    await sql`
      INSERT INTO customer_system_details (customer_id, emp_id, system_name, processor_name, ram, hard_disk, ssd,
                                          sharing_status, administrator_account, antivirus_available, ups_available)
      VALUES 
        ('WZ001', 'EMP001', 'John-Desktop-01', 'Intel Core i7-11700K', '32GB DDR4', '1TB HDD', '512GB NVMe SSD',
         false, true, true, true),
        ('WZ001', 'EMP002', 'Server-Main-01', 'Intel Xeon Silver 4314', '64GB DDR4 ECC', '4TB RAID 5', '1TB NVMe SSD',
         false, true, true, true),
        ('WZ002', 'EMP003', 'Sarah-Laptop-01', 'AMD Ryzen 7 5800H', '16GB DDR4', '1TB HDD', '256GB SSD',
         false, false, true, false),
        ('WZ003', 'EMP004', 'Dev-Station-01', 'Intel Core i9-12900K', '64GB DDR5', '2TB HDD', '2TB NVMe SSD',
         false, true, false, true)
      ON CONFLICT DO NOTHING;
    `;

    // Insert performance metrics
    console.log("📊 Inserting performance metrics...");
    await sql`
      INSERT INTO performance_metrics (user_id, month, year, total_tasks, completed_tasks, average_response_time,
                                     performance_score, customer_satisfaction_rating, first_call_resolution_rate)
      VALUES 
        ('tech-001', 9, 2024, 15, 12, 2.5, 88.5, 4.2, 80.0),
        ('tech-002', 9, 2024, 12, 10, 3.1, 83.3, 4.0, 75.0),
        ('tech-003', 9, 2024, 18, 16, 2.8, 91.2, 4.5, 85.0),
        ('tech-001', 10, 2024, 8, 6, 2.2, 90.0, 4.3, 82.5),
        ('tech-002', 10, 2024, 6, 5, 2.9, 85.0, 4.1, 78.0)
      ON CONFLICT (user_id, month, year) DO NOTHING;
    `;

    // Insert office locations
    console.log("🏢 Inserting office locations...");
    await sql`
      INSERT INTO office_locations (name, description, latitude, longitude, address, is_main_office, is_active)
      VALUES 
        ('Wizone IT Support - Bangalore HQ', 'Main office and headquarters', 12.9716, 77.5946, 
         'MG Road, Bangalore, Karnataka 560001', true, true),
        ('Wizone IT Support - Mumbai Branch', 'Mumbai regional office', 19.0760, 72.8777, 
         'Andheri East, Mumbai, Maharashtra 400069', false, true),
        ('Wizone IT Support - Delhi Branch', 'Delhi regional office', 28.7041, 77.1025, 
         'Connaught Place, New Delhi, Delhi 110001', false, true)
      ON CONFLICT DO NOTHING;
    `;

    // Insert bot configurations
    console.log("🤖 Inserting bot configurations...");
    await sql`
      INSERT INTO bot_configurations (config_name, bot_type, is_active, notify_on_task_create, notify_on_task_update,
                                    notify_on_task_complete, notify_on_task_assign, created_by)
      VALUES 
        ('Telegram Support Bot', 'telegram', true, true, true, true, true, 'admin-001'),
        ('WhatsApp Notifications', 'whatsapp', false, true, false, true, true, 'admin-001'),
        ('Slack Integration', 'slack', false, true, true, true, true, 'admin-001')
      ON CONFLICT DO NOTHING;
    `;

    console.log("✅ Sample data inserted successfully!");

  } catch (error) {
    console.error("❌ Error inserting sample data:", error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await initializeDatabase();
    process.exit(0);
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Check if we need the hashPassword function
async function hashPassword(password: string): Promise<string> {
  // Simple hash for demo - in real app use bcrypt or similar
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}