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

const replacements = [
  ['├®', 'é'],
  ['├Á', 'õ']
];

async function run() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND data_type IN ('character varying', 'text', 'character')
    `);
    
    for (const row of res.rows) {
      const table = row.table_name;
      const column = row.column_name;
      
      let expression = `"${column}"`;
      for (const [bad, good] of replacements) {
        expression = `REPLACE(${expression}, '${bad}', '${good}')`;
      }
      
      const finalQuery = `UPDATE "${table}" SET "${column}" = ${expression} WHERE "${column}" LIKE '%├%'`;
      
      try {
        const updateRes = await pool.query(finalQuery);
        if (updateRes.rowCount > 0) {
           console.log(`Corrigido ${updateRes.rowCount} registros em ${table}.${column}`);
        }
      } catch(e) {}
    }
    console.log('✅ Correção FINAL de caracteres concluída!');
  } finally {
    pool.end();
  }
}

run();
