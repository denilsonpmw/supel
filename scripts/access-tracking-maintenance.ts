import { closeOrphanedPages, cleanOldLogs } from '../middleware/accessTracker';

// Job para executar limpezas periódicas do sistema de tracking
async function runMaintenanceJob() {
  try {
    console.log('🧹 Iniciando manutenção do sistema de tracking...');
    
    // Fechar páginas órfãs (sem exit_at após 30 minutos)
    console.log('📄 Fechando páginas órfãs...');
    await closeOrphanedPages(30);
    
    // Limpar logs antigos (90 dias)
    console.log('🗑️  Limpando logs antigos...');
    await cleanOldLogs(90);
    
    console.log('✅ Manutenção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a manutenção:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runMaintenanceJob()
    .catch((error) => {
      console.error('❌ Falha na manutenção:', error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}

export { runMaintenanceJob };
