import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
    host: '103.122.85.61',
    port: 9095,
    database: 'WIZONEIT_SUPPORT',
    user: 'postgres',
    password: 'ss123456',
    ssl: false
});

async function checkTasks() {
    try {
        console.log('🔍 Checking current tasks in database...\n');
        
        // Get all tasks with assignments
        const result = await pool.query(`
            SELECT 
                t.id,
                t.title,
                t.description,
                t.status,
                t.assigned_to,
                t.field_engineer_id,
                t.created_at,
                u1.username as assigned_to_username,
                u2.username as field_engineer_username
            FROM tasks t
            LEFT JOIN users u1 ON t.assigned_to = u1.id
            LEFT JOIN users u2 ON t.field_engineer_id = u2.id
            ORDER BY t.created_at DESC
        `);
        
        console.log(`📊 Total tasks found: ${result.rows.length}\n`);
        
        if (result.rows.length === 0) {
            console.log('❌ No tasks found in database');
            return;
        }
        
        result.rows.forEach((task, index) => {
            console.log(`Task ${index + 1}:`);
            console.log(`  ID: ${task.id}`);
            console.log(`  Title: ${task.title}`);
            console.log(`  Status: ${task.status}`);
            console.log(`  Assigned To: ${task.assigned_to_username || 'None'} (ID: ${task.assigned_to})`);
            console.log(`  Field Engineer: ${task.field_engineer_username || 'None'} (ID: ${task.field_engineer_id})`);
            console.log(`  Created: ${task.created_at}`);
            console.log('');
        });
        
        // Check all users and credentials
        console.log('👤 All users in database:');
        const allUsers = await pool.query(`
            SELECT id, username, role, email
            FROM users 
            ORDER BY username
        `);
        
        allUsers.rows.forEach(user => {
            console.log(`  ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Email: ${user.email}`);
        });
        
    } catch (error) {
        console.error('❌ Error checking tasks:', error);
    } finally {
        await pool.end();
    }
}

checkTasks();