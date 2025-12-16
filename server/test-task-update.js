// Simple test to verify task update functionality after schema fix
import postgres from 'postgres';

const db = postgres('postgres://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT');

async function testTaskUpdate() {
  try {
    console.log('🧪 Testing task update creation...');
    
    // Try to insert a task update with current timestamp
    const result = await db`
      INSERT INTO task_updates (task_id, message, type, created_by, created_by_name, created_at)
      VALUES (${21}, ${'Test update after schema fix'}, ${'status_update'}, ${1}, ${'admin'}, ${new Date().toISOString()})
      RETURNING *;
    `;
    
    console.log('✅ Task update created successfully!');
    console.log('📄 Result:', result[0]);
    
    // Check the created_at field type
    console.log('🕐 Created at:', result[0].created_at);
    console.log('🕐 Type of created_at:', typeof result[0].created_at);
    
  } catch (error) {
    console.error('❌ Task update test failed:', error);
  } finally {
    await db.end();
  }
}

testTaskUpdate();