const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runAuditoriaMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'server/src/database/migrations/013_create_auditoria_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executando migração de auditoria...');
    await client.query(migrationSQL);
    
    console.log('✅ Migração de auditoria executada com sucesso!');
    
    // Verificar se a tabela foi criada
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'auditoria_log'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Tabela auditoria_log criada com sucesso!');
    } else {
      console.log('❌ Tabela auditoria_log não foi criada');
    }

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
  } finally {
    await client.end();
  }
}

runAuditoriaMigration(); 