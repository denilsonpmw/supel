import fs from 'fs';
import path from 'path';
import pool from '../connection';

async function runMigrations() {
  try {
    console.log('🔄 Executando migrações do banco de dados...');

    // Lista de migrações em ordem
    const migrations = [
      '005_add_senha_to_users.sql',
      '007_assign_unique_situacao_colors.sql',
      '009_allow_null_numero_ano.sql',
      '012_add_auditoria_permission.sql'
    ];

    for (const migrationFile of migrations) {
      const migrationPath = path.join(__dirname, migrationFile);
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Arquivo de migração ${migrationFile} não encontrado, pulando...`);
        continue;
      }

      console.log(`📄 Executando migração: ${migrationFile}`);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Executar migração
      await pool.query(migrationSQL);
      console.log(`✅ Migração ${migrationFile} executada com sucesso!`);
    }

    console.log('🎉 Todas as migrações foram executadas com sucesso!');
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