const { Client } = require('pg');

async function checkDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Consulta 1: Contagem de registros
    console.log('\n=== CONSULTA 1: Contagem de registros ===');
    const result1 = await client.query(`
      SELECT COUNT(*) as total_registros, COUNT(data_sessao) as com_data_sessao 
      FROM processos
    `);
    console.log(result1.rows[0]);

    // Consulta 2: Registros com data_sessao preenchida
    console.log('\n=== CONSULTA 2: Registros com data_sessao preenchida ===');
    const result2 = await client.query(`
      SELECT id, data_sessao, created_at 
      FROM processos 
      WHERE data_sessao IS NOT NULL 
      ORDER BY id DESC 
      LIMIT 10
    `);
    console.table(result2.rows);

    // Consulta 3: Verificar formato das datas
    console.log('\n=== CONSULTA 3: Verificar formato das datas ===');
    const result3 = await client.query(`
      SELECT id, data_sessao, LENGTH(data_sessao) as tamanho_data 
      FROM processos 
      WHERE data_sessao IS NOT NULL 
      ORDER BY id DESC 
      LIMIT 5
    `);
    console.table(result3.rows);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}

checkDatabase(); 