import fs from 'fs';
import path from 'path';
import pool from '../connection';

async function runAccessTrackingMigration() {
  try {
    console.log('🔄 Executando migração de tracking de acesso...');

    const migrationFile = '020_create_access_tracking_tables.sql';
    const migrationPath = path.join(__dirname, migrationFile);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(migrationPath)) {
      console.log(`❌ Arquivo de migração ${migrationFile} não encontrado`);
      return;
    }

    console.log(`📄 Executando migração: ${migrationFile}`);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Executar migração
    await pool.query(migrationSQL);
    console.log(`✅ Migração ${migrationFile} executada com sucesso`);

    // Verificar se as tabelas foram criadas
    const checkTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('access_auth_logs', 'access_page_visits')
      ORDER BY table_name
    `);

    console.log('📋 Tabelas de tracking criadas:');
    checkTables.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('✅ Sistema de tracking de acesso configurado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migração de tracking:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAccessTrackingMigration().catch((error) => {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  });
}

export { runAccessTrackingMigration };
