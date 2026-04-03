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
  try {
    const res = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND data_type IN ('character varying', 'text', 'character')
    `);
    
    let badWords = new Set();
    
    for (const row of res.rows) {
      const table = row.table_name;
      const column = row.column_name;
      
      const query = `
        SELECT DISTINCT substring("${column}" from '%#"%├_%"#' for '#') as bad_char
        FROM "${table}"
        WHERE "${column}" LIKE '%├%'
      `;
      try {
        const wordsRes = await pool.query(query);
        for(let r of wordsRes.rows) {
          if (r.bad_char) {
             const matches = r.bad_char.match(/(├.)/g);
             if (matches) matches.forEach(m => badWords.add(m));
          }
        }
      } catch(e) {}
    }
    console.log('Restantes caracteres "├":', Array.from(badWords).join(' ,  '));
  } finally {
    pool.end();
  }
}

run();
