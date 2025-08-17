import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: './server/.env' });

async function checkAuditoriaData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('🔌 Conectado ao banco de dados');

    // Verificar registros recentes de auditoria
    console.log('\n=== REGISTROS RECENTES DE AUDITORIA ===');
    const result1 = await client.query(`
      SELECT 
        id, 
        usuario_id, 
        usuario_email, 
        usuario_nome, 
        ip_address, 
        tabela_afetada,
        operacao,
        timestamp 
      FROM auditoria_log 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);
    console.table(result1.rows);

    // Verificar quantos registros têm dados de usuário
    console.log('\n=== ESTATÍSTICAS DE USUÁRIOS ===');
    const result2 = await client.query(`
      SELECT 
        COUNT(*) as total_registros,
        COUNT(usuario_id) as com_usuario_id,
        COUNT(usuario_email) as com_usuario_email,
        COUNT(usuario_nome) as com_usuario_nome,
        COUNT(ip_address) as com_ip_address
      FROM auditoria_log
    `);
    console.table(result2.rows);

    // Verificar JOIN com users para dados atualizados
    console.log('\n=== TESTE DE JOIN COM USERS (DADOS ATUALIZADOS) ===');
    const result3 = await client.query(`
      SELECT 
        al.id,
        al.usuario_id,
        al.usuario_email as email_auditoria,
        u.email as email_atual,
        al.usuario_nome as nome_auditoria,
        u.nome as nome_atual,
        al.ip_address,
        al.timestamp
      FROM auditoria_log al
      LEFT JOIN users u ON al.usuario_id = u.id
      ORDER BY al.timestamp DESC 
      LIMIT 5
    `);
    console.table(result3.rows);

    // Verificar se existem registros N/A
    console.log('\n=== REGISTROS COM N/A ===');
    const result4 = await client.query(`
      SELECT COUNT(*) as total_na
      FROM auditoria_log 
      WHERE usuario_email = 'N/A' OR usuario_nome = 'N/A'
    `);
    console.table(result4.rows);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

checkAuditoriaData();
