const { pool } = require("./src/database/connection");

async function testConnection() {
  try {
    console.log('Testando conexão com o banco...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Conexão OK:', result.rows[0]);
    
    // Testar se as tabelas de analytics existem
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%analytics%'
      ORDER BY table_name
    `);
    
    console.log('📊 Tabelas de analytics:', tablesResult.rows);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ Nenhuma tabela de analytics encontrada!');
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  } finally {
    process.exit(0);
  }
}

testConnection();
