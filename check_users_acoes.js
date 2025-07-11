const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'supel_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'cd1526'
});

async function checkUsersAcoes() {
  try {
    console.log('🔍 Verificando estado das acoes_permitidas dos usuários...\n');
    
    const result = await pool.query(`
      SELECT 
        id,
        email,
        nome,
        perfil,
        paginas_permitidas,
        acoes_permitidas,
        ativo,
        created_at
      FROM users 
      ORDER BY perfil, email
    `);
    
    console.log(`📊 Total de usuários: ${result.rows.length}\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nome} (${user.email})`);
      console.log(`   Perfil: ${user.perfil}`);
      console.log(`   Ativo: ${user.ativo ? '✅' : '❌'}`);
      console.log(`   Páginas permitidas: ${user.paginas_permitidas?.join(', ') || 'N/A'}`);
      console.log(`   Ações permitidas: ${user.acoes_permitidas?.join(', ') || 'N/A'}`);
      console.log(`   Criado em: ${user.created_at}`);
      console.log('');
    });
    
    // Verificar usuários sem acoes_permitidas
    const usersWithoutAcoes = result.rows.filter(user => 
      !user.acoes_permitidas || user.acoes_permitidas.length === 0
    );
    
    if (usersWithoutAcoes.length > 0) {
      console.log('⚠️  Usuários sem acoes_permitidas:');
      usersWithoutAcoes.forEach(user => {
        console.log(`   - ${user.nome} (${user.email}) - Perfil: ${user.perfil}`);
      });
      console.log('');
    } else {
      console.log('✅ Todos os usuários têm acoes_permitidas definidas!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  } finally {
    await pool.end();
  }
}

checkUsersAcoes(); 