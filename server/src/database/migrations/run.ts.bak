import fs from 'fs';
import path from 'path';
import pool from '../connection';

async function runMigrations() {
  try {
    // console.log('🔄 Executando migrações do banco de dados...');

    // Lista de migrações em ordem (apenas as que estão faltando)
    const migrations = [
      '014_add_unique_nup_to_processos.sql',
      '015_add_acoes_permitidas.sql',
      '016_allow_null_dates_and_optional_responsavel_modalidade.sql',
      '017_add_painel_publico_permission.sql'
    ];

    for (const migrationFile of migrations) {
      const migrationPath = path.join(__dirname, migrationFile);
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(migrationPath)) {
        // console.log(`⚠️  Arquivo de migração ${migrationFile} não encontrado, pulando...`);
        continue;
      }

      // console.log(`📄 Executando migração: ${migrationFile}`);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Executar migração
      await pool.query(migrationSQL);
      // console.log(`✅ Migração ${migrationFile} executada com sucesso!`);
    }

    // console.log('🎉 Todas as migrações foram executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  runMigrations();
}

export { runMigrations }; 