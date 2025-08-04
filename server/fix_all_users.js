require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'supel_dev',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

async function fixAllUsers() {
  try {
    // Buscar todos os usuários com problema
    const problemUsers = await pool.query(`
      SELECT email, primeiro_acesso, senha IS NOT NULL as tem_senha
      FROM users 
      WHERE primeiro_acesso = true AND senha IS NOT NULL
    `);
    
    console.log(`🔍 Encontrados ${problemUsers.rows.length} usuários com problema:`);
    problemUsers.rows.forEach(user => {
      console.log(`   - ${user.email} (tem_senha: ${user.tem_senha}, primeiro_acesso: ${user.primeiro_acesso})`);
    });
    
    if (problemUsers.rows.length > 0) {
      // Corrigir todos os usuários que têm senha mas estão marcados como primeiro acesso
      const result = await pool.query(`
        UPDATE users 
        SET primeiro_acesso = false 
        WHERE primeiro_acesso = true AND senha IS NOT NULL
        RETURNING email, primeiro_acesso
      `);
      
      console.log(`\n✅ ${result.rows.length} usuários corrigidos:`);
      result.rows.forEach(user => {
        console.log(`   - ${user.email} → primeiro_acesso: ${user.primeiro_acesso}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

fixAllUsers();
