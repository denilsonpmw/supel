require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'supel_dev',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

async function checkUser() {
  try {
    const result = await pool.query(`
      SELECT 
        email, 
        primeiro_acesso, 
        senha IS NOT NULL as tem_senha,
        ativo,
        perfil
      FROM users 
      WHERE email = 'denilson@supel.gov'
    `);
    
    if (result.rows.length > 0) {
      console.log('Status do usuário:');
      console.log(result.rows[0]);
    } else {
      console.log('Usuário não encontrado!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkUser();
