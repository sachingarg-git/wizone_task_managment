import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || '');

async function checkTables() {
  console.log('=== NETWORK TOWERS TABLE STRUCTURE ===');
  const towerCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'network_towers' ORDER BY ordinal_position`;
  console.log(towerCols);
  
  console.log('\n=== NETWORK TOWERS DATA ===');
  const towers = await sql`SELECT * FROM network_towers LIMIT 5`;
  console.log(towers);
  
  console.log('\n=== CLIENT ASSIGNMENTS DATA ===');
  const assignments = await sql`SELECT * FROM client_assignments LIMIT 5`;
  console.log(assignments);
  
  await sql.end();
}

checkTables().catch(console.error);
