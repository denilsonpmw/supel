const { pool } = require('./src/database/connection');

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'user_sessions' OR table_name = 'user_metrics')
      ORDER BY table_name
    `);
    console.log('Tabelas sessions/metrics:', result.rows);
    
    // Verificar estrutura da user_analytics
    const structure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_analytics' 
      ORDER BY ordinal_position
    `);
    console.log('Estrutura user_analytics:', structure.rows);
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTables();
