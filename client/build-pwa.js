import fs from 'fs';
import path from 'path';

console.log('🔧 Configurando build do PWA...');

// Verificar se os arquivos PWA existem
const pwaFiles = [
  'public/manifest.json',
  'public/sw.js',
  'public/icons/icon-72x72.png',
  'public/icons/icon-96x96.png',
  'public/icons/icon-128x128.png',
  'public/icons/icon-144x144.png',
  'public/icons/icon-152x152.png',
  'public/icons/icon-192x192.png',
  'public/icons/icon-384x384.png',
  'public/icons/icon-512x512.png'
];

console.log('📋 Verificando arquivos PWA...');
pwaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NÃO ENCONTRADO`);
  }
});

// Verificar se o manifest.json tem as configurações corretas
const manifestPath = 'public/manifest.json';
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  console.log('\n📋 Verificando configurações do manifest.json...');
  console.log(`✅ display: ${manifest.display}`);
  console.log(`✅ start_url: ${manifest.start_url}`);
  console.log(`✅ theme_color: ${manifest.theme_color}`);
  console.log(`✅ background_color: ${manifest.background_color}`);
  
  if (manifest.display !== 'fullscreen') {
    console.log('⚠️  ATENÇÃO: display deve ser "fullscreen" para esconder a barra de endereços');
  }
}

console.log('\n🚀 PWA configurado para produção!');
console.log('💡 Dicas para garantir que a barra de endereços seja escondida:');
console.log('   1. Certifique-se de que o manifest.json tem "display": "fullscreen"');
console.log('   2. Verifique se todos os ícones estão presentes');
console.log('   3. Teste em diferentes dispositivos e navegadores');
console.log('   4. Use HTTPS em produção (obrigatório para PWA)'); 