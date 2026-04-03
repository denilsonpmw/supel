#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando projeto SUPEL...\n');

// Função para executar comandos
function runCommand(command, options = {}) {
  try {
    console.log(`📦 Executando: ${command}`);
    execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error(`❌ Erro ao executar: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Função para criar arquivo .env se não existir
function createEnvFile(envPath, envExamplePath) {
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log(`📝 Criando arquivo ${path.basename(envPath)}...`);
    fs.copyFileSync(envExamplePath, envPath);
    console.log(`✅ Arquivo ${path.basename(envPath)} criado. Configure as variáveis de ambiente.`);
  }
}

// 1. Instalar dependências do servidor
console.log('📥 Instalando dependências do servidor...');
runCommand('npm install', { cwd: 'server' });

// 2. Instalar dependências do cliente
console.log('\n📥 Instalando dependências do cliente...');
try {
  runCommand('npm install', { cwd: 'client' });
} catch (error) {
  console.log('⚠️  Tentando instalar com --legacy-peer-deps...');
  runCommand('npm install --legacy-peer-deps', { cwd: 'client' });
}

// 3. Criar arquivos .env
console.log('\n🔧 Configurando arquivos de ambiente...');
createEnvFile('server/.env', 'server/env.example');
createEnvFile('client/.env', 'client/.env.example');

// 4. Instruções finais
console.log('\n🎉 Configuração inicial concluída!\n');
console.log('📋 Próximos passos:');
console.log('1. Configure o banco PostgreSQL');
console.log('2. Atualize as variáveis no arquivo server/.env');
console.log('3. Configure as credenciais do Google OAuth');
console.log('4. Execute as migrações: cd server && npm run migrate (ou npm run migrate:ps para PowerShell)');
console.log('5. Execute os seeds: cd server && npm run seed (ou npm run seed:ps para PowerShell)');
console.log('6. Inicie o projeto: npm run dev\n');

console.log('📖 Para mais informações, consulte o arquivo README.md');
console.log('✨ Bom desenvolvimento!'); 