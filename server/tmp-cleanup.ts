import pool from './src/database/connection.js';

async function cleanup() {
  try {
    console.log('🧹 Iniciando limpeza de registros anteriores a 2024...');
    const result = await pool.query('DELETE FROM microempresas_licitacoes WHERE ano < 2024');
    console.log(`✅ Sucesso! Foram removidos ${result.rowCount} registros antigos.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro durante a limpeza:', err);
    process.exit(1);
  }
}

cleanup();
