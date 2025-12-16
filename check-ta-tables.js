import postgres from 'postgres';

const sql = postgres('postgresql://WIZONEIT_SUPPORT_user:Bcd4OOMCNWdg20HrwlD3vy0UqBZPTwkK@103.122.85.61:9095/WIZONEIT_SUPPORT');

sql`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND (table_name LIKE '%ta_%' OR table_name LIKE '%travel%' OR table_name LIKE '%advance%' OR table_name LIKE '%bill%')
  ORDER BY table_name
`.then(result => {
  console.log('\n=== TA/Travel Related Tables ===');
  console.log(JSON.stringify(result, null, 2));
  sql.end();
}).catch(err => {
  console.error('Error:', err);
  sql.end();
});
