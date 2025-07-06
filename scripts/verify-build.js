const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando build do projeto...');

// Verificar se o build do servidor foi criado
const serverDistPath = path.join(__dirname, '../server/dist');
if (!fs.existsSync(serverDistPath)) {
  console.error('❌ Build do servidor não encontrado em:', serverDistPath);
  process.exit(1);
}

const serverIndexPath = path.join(serverDistPath, 'index.js');
if (!fs.existsSync(serverIndexPath)) {
  console.error('❌ index.js do servidor não encontrado');
  process.exit(1);
}

console.log('✅ Build do servidor verificado');

// Verificar se o build do cliente foi criado
const clientDistPath = path.join(__dirname, '../client/dist');
if (!fs.existsSync(clientDistPath)) {
  console.error('❌ Build do cliente não encontrado em:', clientDistPath);
  process.exit(1);
}

const clientIndexPath = path.join(clientDistPath, 'index.html');
if (!fs.existsSync(clientIndexPath)) {
  console.error('❌ index.html do cliente não encontrado');
  process.exit(1);
}

console.log('✅ Build do cliente verificado');

// Verificar se o diretório de uploads existe
const uploadsPath = path.join(__dirname, '../server/uploads');
if (!fs.existsSync(uploadsPath)) {
  console.warn('⚠️  Diretório de uploads não encontrado, criando...');
  fs.mkdirSync(uploadsPath, { recursive: true });
}

console.log('✅ Diretório de uploads verificado');

// Verificar tamanho dos builds
const serverSize = fs.statSync(serverIndexPath).size;
const clientSize = fs.statSync(clientIndexPath).size;

console.log(`📊 Tamanho do build do servidor: ${(serverSize / 1024).toFixed(2)} KB`);
console.log(`📊 Tamanho do build do cliente: ${(clientSize / 1024).toFixed(2)} KB`);

// Verificar se há arquivos estáticos do cliente
const clientFiles = fs.readdirSync(clientDistPath);
const hasAssets = clientFiles.some(file => file.includes('.js') || file.includes('.css'));

if (!hasAssets) {
  console.warn('⚠️  Poucos arquivos estáticos encontrados no build do cliente');
} else {
  console.log(`✅ ${clientFiles.length} arquivos estáticos encontrados no cliente`);
}

console.log('🎉 Verificação do build concluída com sucesso!');
console.log('🚀 Projeto pronto para deploy no Railway'); 