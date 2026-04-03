#!/usr/bin/env node

const { Pool } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function truncateProcessosRailway() {
  console.log('🗑️  TRUNCATE DA TABELA PROCESSOS NO RAILWAY\n');
  console.log('⚠️  ATENÇÃO: Esta operação irá:');
  console.log('   - Apagar TODOS os dados da tabela processos');
  console.log('   - Resetar a contagem dos IDs para 1');
  console.log('   - Manter a estrutura da tabela intacta');
  console.log('   - Manter todas as outras tabelas e dados\n');

  const confirm = await askQuestion('Tem certeza que deseja continuar? (digite "CONFIRMO" para prosseguir): ');
  
  if (confirm !== 'CONFIRMO') {
    console.log('❌ Operação cancelada.');
    rl.close();
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não está configurada!');
    rl.close();
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway.app') || process.env.DATABASE_URL.includes('proxy.rlwy.net')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    console.log('\n🔌 Conectando ao banco do Railway...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado com sucesso!\n');

    const countBefore = await pool.query('SELECT COUNT(*) as total FROM processos');
    const totalBefore = countBefore.rows[0].total;
    console.log(`📊 Registros encontrados: ${totalBefore}\n`);

    await pool.query('TRUNCATE TABLE processos RESTART IDENTITY CASCADE');
    console.log('✅ TRUNCATE executado com sucesso!\n');

    const sequenceCheck = await pool.query(`SELECT last_value FROM processos_id_seq;`);
    console.log(`✅ Sequência resetada: próximo ID será ${parseInt(sequenceCheck.rows[0].last_value) + 1}\n`);

    const countAfter = await pool.query('SELECT COUNT(*) as total FROM processos');
    const totalAfter = countAfter.rows[0].total;
    console.log(`📊 Registros após TRUNCATE: ${totalAfter}\n`);

    console.log('✅ Operação concluída com sucesso!');
    console.log(`🗑️  ${totalBefore} registros removidos da tabela processos`);
    console.log('🔄 Contagem de IDs resetada para 1');
    console.log('\n✅ A tabela processos está pronta para novos dados');

  } catch (error) {
    console.error('\n❌ Erro durante o TRUNCATE:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    rl.close();
  }
}

require('dotenv').config();
truncateProcessosRailway(); 