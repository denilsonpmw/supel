require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'supel_dev',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

async function checkUserAndResponsavel() {
  try {
    // Verificar usuário
    const userResult = await pool.query(`
      SELECT id, email, perfil, ativo 
      FROM users 
      WHERE email = 'teste@supel.com'
    `);
    
    console.log('👤 Usuário teste@supel.com:');
    if (userResult.rows.length > 0) {
      console.log(userResult.rows[0]);
    } else {
      console.log('❌ Usuário não encontrado');
    }
    
    // Verificar responsável
    const responsavelResult = await pool.query(`
      SELECT id, email, nome_responsavel 
      FROM responsaveis 
      WHERE email = 'teste@supel.com'
    `);
    
    console.log('\n👨‍💼 Responsável teste@supel.com:');
    if (responsavelResult.rows.length > 0) {
      console.log(responsavelResult.rows[0]);
    } else {
      console.log('❌ Responsável não encontrado');
    }
    
    // Verificar o JOIN como o middleware faz
    const joinResult = await pool.query(`
      SELECT u.*, r.id as responsavel_id 
      FROM users u 
      LEFT JOIN responsaveis r ON u.email = r.email 
      WHERE u.email = 'teste@supel.com'
    `);
    
    console.log('\n🔗 JOIN users + responsaveis:');
    if (joinResult.rows.length > 0) {
      console.log(joinResult.rows[0]);
    } else {
      console.log('❌ Nenhum resultado no JOIN');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkUserAndResponsavel();
