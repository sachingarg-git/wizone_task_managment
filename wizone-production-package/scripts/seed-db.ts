#!/usr/bin/env tsx

import { db } from '../server/db.js';
import { users, customers, tasks } from '../shared/schema.js';
import { hashPassword } from '../server/auth.js';

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');
  
  try {
    // Check if admin user exists
    const existingAdmin = await db.select().from(users).where({ username: 'admin' }).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await hashPassword('admin123');
      
      await db.insert(users).values({
        id: 'admin001',
        username: 'admin',
        email: 'admin@wizoneit.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        department: 'IT',
        password: hashedPassword,
        isActive: true
      });
      
      console.log('✅ Admin user created (admin/admin123)');
    }
    
    // Check if sample customers exist
    const existingCustomers = await db.select().from(customers).limit(1);
    
    if (existingCustomers.length === 0) {
      console.log('🏢 Creating sample customers...');
      
      await db.insert(customers).values([
        {
          customerId: 'C001',
          name: 'TechCorp Solutions',
          email: 'contact@techcorp.com',
          phone: '+1-555-0101',
          address: '123 Tech Street',
          city: 'San Francisco',
          serviceType: 'Enterprise IT Support',
          isActive: true
        },
        {
          customerId: 'C002', 
          name: 'Global Dynamics',
          email: 'support@globaldynamics.com',
          phone: '+1-555-0102',
          address: '456 Business Ave',
          city: 'New York',
          serviceType: 'Cloud Infrastructure',
          isActive: true
        },
        {
          customerId: 'C003',
          name: 'StartupLab Inc',
          email: 'hello@startuplab.io',
          phone: '+1-555-0103', 
          address: '789 Innovation Blvd',
          city: 'Austin',
          serviceType: 'Development Support',
          isActive: true
        }
      ]);
      
      console.log('✅ Sample customers created');
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Default Login Credentials:');
    console.log('📧 Username: admin');
    console.log('🔑 Password: admin123');
    console.log('');
    console.log('🌐 Application will be available at: http://localhost:5000');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();