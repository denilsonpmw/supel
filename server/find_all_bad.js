const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  const res = await pool.query(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND data_type IN ('character varying', 'text', 'character')`);
  let bad = new Set();
  for (const row of res.rows) {
     const data = await pool.query(`SELECT "${row.column_name}" as val FROM "${row.table_name}" WHERE "${row.column_name}" LIKE '%├%'`);
     for (const r of data.rows) {
        if(r.val) {
           const matches = r.val.match(/├./g);
           if (matches) matches.forEach(m => bad.add(m));
        }
     }
  }
  console.log('Restantes:', Array.from(bad));
  pool.end();
}
run();
