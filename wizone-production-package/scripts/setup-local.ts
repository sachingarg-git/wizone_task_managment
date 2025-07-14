#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function setupLocalDevelopment() {
  console.log('🔧 Setting up Wizone IT Support Portal for local development...');
  
  // Check if .env exists
  if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file from template...');
    
    // Copy .env.example to .env
    const envExample = fs.readFileSync('.env.example', 'utf8');
    fs.writeFileSync('.env', envExample);
    
    console.log('✅ .env file created!');
    console.log('⚠️  Please update DATABASE_URL in .env with your PostgreSQL credentials');
    console.log('');
  }
  
  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully!');
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error);
      process.exit(1);
    }
  }
  
  console.log('');
  console.log('🎉 Local development setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Update your DATABASE_URL in .env file');
  console.log('2. Make sure PostgreSQL is running');
  console.log('3. Run: npm run db:push (to create tables)');
  console.log('4. Run: npm run dev (to start the application)');
  console.log('');
  console.log('📚 For detailed instructions, see LOCAL_DEVELOPMENT_GUIDE.md');
}

setupLocalDevelopment();