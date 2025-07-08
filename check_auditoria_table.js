const { Client } = require('pg');

async function checkAuditoriaTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Verificar estrutura da tabela auditoria_log
    console.log('\n=== ESTRUTURA DA TABELA auditoria_log ===');
    const result1 = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'auditoria_log' 
      ORDER BY ordinal_position
    `);
    console.table(result1.rows);

    // Verificar alguns registros de auditoria
    console.log('\n=== REGISTROS DE AUDITORIA ===');
    const result2 = await client.query(`
      SELECT id, usuario_id, usuario_email, usuario_nome, ip_address, timestamp 
      FROM auditoria_log 
      ORDER BY timestamp DESC 
      LIMIT 5
    `);
    console.table(result2.rows);

    // Verificar se há registros com IP
    console.log('\n=== REGISTROS COM IP ===');
    const result3 = await client.query(`
      SELECT COUNT(*) as total_com_ip, COUNT(*) FILTER (WHERE ip_address IS NOT NULL) as com_ip
      FROM auditoria_log
    `);
    console.log(result3.rows[0]);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}

checkAuditoriaTable(); 