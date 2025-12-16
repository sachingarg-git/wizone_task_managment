import postgres from 'postgres';

const sql = postgres('postgresql://postgres:ss123456@103.122.85.61:9095/WIZONEIT_SUPPORT');

sql`
  SELECT id, username, email, first_name, last_name, role, active 
  FROM users 
  ORDER BY id
`.then(result => {
  console.log('\n=== ALL USERS IN DATABASE ===');
  console.log(`Total users: ${result.length}\n`);
  result.forEach(user => {
    console.log(`ID: ${user.id} | Username: ${user.username} | Name: ${user.first_name} ${user.last_name} | Role: ${user.role} | Active: ${user.active}`);
  });
  sql.end();
}).catch(err => {
  console.error('Error:', err);
  sql.end();
});
