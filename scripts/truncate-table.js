const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('Truncating kbli_mapping table...');
  await pool.query('TRUNCATE kbli_mapping RESTART IDENTITY');
  console.log('✅ Table truncated successfully.');
  await pool.end();
}

main().catch(e => { console.error(e); pool.end(); });
