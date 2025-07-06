#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');

// Usar dependências da raiz
const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

async function setupDatabase() {
  console.log('🗃️  Configurando banco de dados SUPEL...\n');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'supel_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    // Testar conexão
    console.log('🔌 Testando conexão com o banco...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Verificar se as tabelas já existem
    console.log('🔍 Verificando estrutura do banco...');
    const tablesCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'unidades_gestoras', 'responsaveis', 'modalidades', 'situacoes', 'processos');
    `);

    const existingTables = tablesCheck.rows.map(row => row.table_name);
    
    if (existingTables.length > 0) {
      console.log('⚠️  Tabelas já existem:', existingTables.join(', '));
      console.log('🔄 Pulando migrações (já executadas)\n');
    } else {
      console.log('📊 Executando migrações...');
      try {
        execSync('npm run migrate', { stdio: 'inherit' });
        console.log('✅ Migrações executadas com sucesso!\n');
      } catch (error) {
        console.log('⚠️  Migrações já foram executadas ou erro menor - continuando...\n');
      }
    }

    // Verificar se há dados básicos
    console.log('🌱 Verificando dados iniciais...');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const ugCount = await pool.query('SELECT COUNT(*) FROM unidades_gestoras');
    
    if (parseInt(usersCount.rows[0].count) === 0 || parseInt(ugCount.rows[0].count) === 0) {
      console.log('📥 Inserindo dados iniciais...');
      try {
        execSync('npm run seed', { stdio: 'inherit' });
        console.log('✅ Seeds executados com sucesso!\n');
      } catch (error) {
        console.log('⚠️  Alguns dados já existem - continuando...\n');
      }
    } else {
      console.log('✅ Dados iniciais já existem\n');
    }

    // Adicionar/Atualizar administrador Denilson
    console.log('👤 Configurando usuário administrador...');
    const adminQuery = `
      INSERT INTO users (email, nome, perfil, ativo) VALUES 
      ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET 
          nome = EXCLUDED.nome,
          perfil = EXCLUDED.perfil,
          ativo = EXCLUDED.ativo,
          updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, nome, perfil;
    `;

    const result = await pool.query(adminQuery, [
      'denilson.pmw@gmail.com',
      'Denilson Maciel', 
      'admin',
      true
    ]);

    const admin = result.rows[0];
    console.log('✅ Administrador configurado:');
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   👤 Nome: ${admin.nome}`);
    console.log(`   🔑 Perfil: ${admin.perfil}`);
    console.log(`   🆔 ID: ${admin.id}\n`);

    // Verificar estrutura final
    console.log('📋 Resumo da configuração:');
    const finalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const finalUGs = await pool.query('SELECT COUNT(*) FROM unidades_gestoras');
    const finalProcessos = await pool.query('SELECT COUNT(*) FROM processos');
    
    console.log(`   👥 Usuários: ${finalUsers.rows[0].count}`);
    console.log(`   🏢 Unidades Gestoras: ${finalUGs.rows[0].count}`);
    console.log(`   📄 Processos: ${finalProcessos.rows[0].count}`);
    
    console.log('\n🎉 Banco de dados configurado com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('1. Execute: npm run dev');
    console.log('2. Acesse: http://localhost:5173/login');
    console.log('3. Faça login com: denilson.pmw@gmail.com');

  } catch (error) {
    console.error('❌ Erro na configuração do banco:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Soluções possíveis:');
      console.log('1. Verifique se o PostgreSQL está rodando');
      console.log('2. Confirme as credenciais no arquivo server/.env');
      console.log('3. Crie o banco de dados se não existir:');
      console.log('   createdb supel_db');
    }
    
    if (error.code === '3D000') {
      console.log('\n💡 Banco não existe. Crie com:');
      console.log('createdb supel_db');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 