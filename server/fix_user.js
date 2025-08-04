require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'supel_dev',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

async function fixUser() {
  try {
    // Corrigir o primeiro_acesso para false para usuários que já têm senha
    const result = await pool.query(`
      UPDATE users 
      SET primeiro_acesso = false 
      WHERE email = 'denilson@supel.gov' 
      AND senha IS NOT NULL
      RETURNING email, primeiro_acesso, senha IS NOT NULL as tem_senha
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Usuário corrigido:');
      console.log(result.rows[0]);
    } else {
      console.log('❌ Nenhum usuário foi atualizado');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

fixUser();
