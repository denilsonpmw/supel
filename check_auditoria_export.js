const { Client } = require('pg');

async function checkAuditoriaExport() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'supel',
    user: 'postgres',
    password: 'postgres'
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

    // Verificar alguns registros de auditoria com dados de usuário
    console.log('\n=== REGISTROS DE AUDITORIA COM DADOS DE USUÁRIO ===');
    const result2 = await client.query(`
      SELECT 
        al.id,
        al.usuario_id,
        al.usuario_email,
        al.usuario_nome,
        al.tabela_afetada,
        al.operacao,
        al.timestamp
      FROM auditoria_log al
      ORDER BY al.timestamp DESC 
      LIMIT 10
    `);
    console.table(result2.rows);

    // Verificar JOIN com users
    console.log('\n=== TESTE DE JOIN COM USERS ===');
    const result3 = await client.query(`
      SELECT 
        al.id,
        al.usuario_id,
        COALESCE(u.email, al.usuario_email) as usuario_email,
        COALESCE(u.nome, al.usuario_nome) as usuario_nome,
        al.tabela_afetada,
        al.operacao
      FROM auditoria_log al
      LEFT JOIN users u ON al.usuario_id = u.id
      ORDER BY al.timestamp DESC 
      LIMIT 5
    `);
    console.table(result3.rows);

    // Verificar se há logs sem usuario_id
    console.log('\n=== LOGS SEM USUARIO_ID ===');
    const result4 = await client.query(`
      SELECT COUNT(*) as total_sem_usuario_id
      FROM auditoria_log 
      WHERE usuario_id IS NULL
    `);
    console.log(result4.rows[0]);

    // Verificar se há logs com usuario_id mas sem dados na tabela users
    console.log('\n=== LOGS COM USUARIO_ID MAS SEM DADOS EM USERS ===');
    const result5 = await client.query(`
      SELECT COUNT(*) as total_sem_dados_users
      FROM auditoria_log al
      LEFT JOIN users u ON al.usuario_id = u.id
      WHERE al.usuario_id IS NOT NULL AND u.id IS NULL
    `);
    console.log(result5.rows[0]);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}

checkAuditoriaExport(); 