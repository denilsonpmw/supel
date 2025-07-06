#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Mudar para a pasta do servidor
const serverPath = path.join(__dirname, '..', 'server');
process.chdir(serverPath);

const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

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

async function resetDatabase() {
  console.log('🔄 RESET COMPLETO DO BANCO DE DADOS\n');
  console.log('⚠️  ATENÇÃO: Esta operação irá:');
  console.log('   - Apagar TODAS as tabelas');
  console.log('   - Apagar TODOS os dados');
  console.log('   - Recriar a estrutura do zero');
  console.log('   - Inserir dados iniciais\n');

  const confirm = await askQuestion('Tem certeza que deseja continuar? (digite "CONFIRMO" para prosseguir): ');
  
  if (confirm !== 'CONFIRMO') {
    console.log('❌ Operação cancelada.');
    rl.close();
    return;
  }

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'supel_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    console.log('\n🔌 Conectando ao banco...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado com sucesso!\n');

    // Remover todas as tabelas
    console.log('🗑️  Removendo todas as tabelas...');
    await pool.query('DROP SCHEMA public CASCADE');
    await pool.query('CREATE SCHEMA public');
    console.log('✅ Todas as tabelas removidas\n');

    // Recriar estrutura
    console.log('📊 Recriando estrutura do banco...');
    execSync('npm run migrate', { stdio: 'inherit' });
    console.log('✅ Migrações executadas!\n');

    // Inserir dados iniciais
    console.log('🌱 Inserindo dados iniciais...');
    execSync('npm run seed', { stdio: 'inherit' });
    console.log('✅ Seeds executados!\n');

    // Adicionar administrador
    console.log('👤 Criando usuário administrador...');
    const adminResult = await pool.query(`
      INSERT INTO users (email, nome, perfil, ativo) VALUES 
      ($1, $2, $3, $4)
      RETURNING id, email, nome, perfil;
    `, ['denilson.pmw@gmail.com', 'Denilson Maciel', 'admin', true]);

    const admin = adminResult.rows[0];
    console.log('✅ Administrador criado:');
    console.log(`   📧 ${admin.email}`);
    console.log(`   👤 ${admin.nome}`);
    console.log(`   🔑 ${admin.perfil}\n`);

    console.log('🎉 Reset completo realizado com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('1. Execute: npm run dev');
    console.log('2. Acesse: http://localhost:5173/login');
    console.log('3. Faça login com: denilson.pmw@gmail.com');

  } catch (error) {
    console.error('\n❌ Erro durante o reset:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    rl.close();
  }
}

resetDatabase(); 