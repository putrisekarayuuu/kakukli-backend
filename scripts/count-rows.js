const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query('SELECT COUNT(*) FROM kbli_mapping')
  .then(r => {
    console.log('Total rows in kbli_mapping:', r.rows[0].count);
    pool.end();
  })
  .catch(e => { console.error(e); pool.end(); });
