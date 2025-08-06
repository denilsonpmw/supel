const { pool } = require('./src/database/connection');

(async () => {
  try {
    console.log('🔍 Verificando dados de sessão...');
    
    const result = await pool.query("SELECT COUNT(*) FROM user_sessions WHERE start_time >= CURRENT_DATE - INTERVAL '7 days'");
    console.log('Total de sessões (7 dias):', result.rows[0].count);
    
    const result2 = await pool.query("SELECT start_time, last_activity, EXTRACT(EPOCH FROM (last_activity - start_time)) as duration FROM user_sessions LIMIT 5");
    console.log('Exemplos de sessões:');
    console.table(result2.rows);
    
    const result3 = await pool.query("SELECT AVG(EXTRACT(EPOCH FROM (last_activity - start_time))) as avg_seconds FROM user_sessions WHERE start_time >= CURRENT_DATE - INTERVAL '7 days' AND last_activity > start_time");
    console.log('Tempo médio calculado:', result3.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
