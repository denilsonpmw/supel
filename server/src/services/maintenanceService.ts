import pool from '../database/connection';

/**
 * Limpa logs de auditoria mais antigos que 120 dias
 */
export const cleanOldAuditLogs = async (): Promise<number> => {
  try {
    const query = `
      DELETE FROM auditoria_log 
      WHERE timestamp < NOW() - INTERVAL '120 days'
    `;
    
    const result = await pool.query(query);
    const count = result.rowCount || 0;
    
    if (count > 0) {
      console.log(`[MAINTENANCE] Limpeza de auditoria realizada: ${count} registros antigos removidos.`);
    }
    
    return count;
  } catch (error) {
    console.error('[MAINTENANCE] Erro ao limpar logs antigos de auditoria:', error);
    return 0;
  }
};

/**
 * Inicializa as tarefas de manutenção do sistema
 */
export const initMaintenanceTasks = () => {
  console.log('🛠️ Inicializando tarefas de manutenção em segundo plano...');
  
  // Executar limpeza inicial após 30 segundos do boot para não sobrecarregar o startup
  setTimeout(async () => {
    await cleanOldAuditLogs();
  }, 30000);
  
  // Agendar para rodar a cada 24 horas
  const INTERVAL_24H = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    await cleanOldAuditLogs();
  }, INTERVAL_24H);
};
