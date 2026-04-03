#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkAndFixEnvironment() {
  console.log('🔍 Verificando ambiente de desenvolvimento...\n');

  try {
    // 1. Verificar se .env existe
    console.log('📄 Verificando arquivo .env...');
    if (!fs.existsSync(path.join(process.cwd(), 'server', '.env'))) {
      console.log('⚠️  Arquivo .env não encontrado, criando a partir do exemplo...');
      fs.copyFileSync(
        path.join(process.cwd(), 'server', 'env.example'),
        path.join(process.cwd(), 'server', '.env')
      );
      console.log('✅ Arquivo .env criado!\n');
    } else {
      console.log('✅ Arquivo .env encontrado!\n');
    }

    // 2. Verificar banco de dados
    console.log('🗃️  Verificando banco de dados...');
    try {
      execSync('node scripts/setup-database.js', { stdio: 'inherit' });
      console.log('✅ Banco de dados verificado!\n');
    } catch (error) {
      console.error('❌ Erro ao configurar banco de dados:', error.message);
      process.exit(1);
    }

    // 3. Verificar dependências do cliente
    console.log('📦 Verificando dependências do cliente...');
    if (!fs.existsSync(path.join(process.cwd(), 'client', 'node_modules'))) {
      console.log('⚠️  Instalando dependências do cliente...');
      process.chdir('client');
      execSync('npm install', { stdio: 'inherit' });
      process.chdir('..');
    }
    console.log('✅ Dependências do cliente OK!\n');

    // 4. Verificar dependências do servidor
    console.log('📦 Verificando dependências do servidor...');
    if (!fs.existsSync(path.join(process.cwd(), 'server', 'node_modules'))) {
      console.log('⚠️  Instalando dependências do servidor...');
      process.chdir('server');
      execSync('npm install', { stdio: 'inherit' });
      process.chdir('..');
    }
    console.log('✅ Dependências do servidor OK!\n');

    // 5. Verificar Puppeteer (para fix-auth:auto)
    console.log('🤖 Verificando Puppeteer...');
    try {
      require('puppeteer');
      console.log('✅ Puppeteer instalado!\n');
    } catch (error) {
      console.log('⚠️  Instalando Puppeteer...');
      execSync('npm install --save-dev puppeteer@22.4.1', { stdio: 'inherit' });
      console.log('✅ Puppeteer instalado!\n');
    }

    // 6. Verificar se o servidor está rodando
    console.log('🔌 Verificando servidor...');
    try {
      execSync('curl -s http://localhost:3001/api/health');
      console.log('✅ Servidor está rodando!\n');
    } catch (error) {
      console.log('⚠️  Servidor não está rodando\n');
    }

    // 7. Verificar se o cliente está rodando
    console.log('🌐 Verificando cliente...');
    try {
      execSync('curl -s http://localhost:5173');
      console.log('✅ Cliente está rodando!\n');
    } catch (error) {
      console.log('⚠️  Cliente não está rodando\n');
    }

    console.log('📋 Resumo:');
    console.log('1. Arquivo .env ✅');
    console.log('2. Banco de dados ✅');
    console.log('3. Dependências do cliente ✅');
    console.log('4. Dependências do servidor ✅');
    console.log('5. Puppeteer ✅');

    console.log('\n💡 Próximos passos:');
    console.log('1. Execute: npm run dev');
    console.log('2. Em outro terminal, execute: npm run fix-auth:auto');
    console.log('3. Acesse: http://localhost:5173\n');

  } catch (error) {
    console.error('❌ Erro ao verificar ambiente:', error);
    process.exit(1);
  }
}

checkAndFixEnvironment(); 