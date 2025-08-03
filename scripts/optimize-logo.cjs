#!/usr/bin/env node

/**
 * Script para otimizar a logo PNG e criar versões menores
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function optimizeLogo() {
  console.log('🎨 Otimizando logo PNG...');
  
  const originalPath = path.join(__dirname, '../client/public/logo-1024.png');
  const assetsPath = path.join(__dirname, '../client/src/assets/logo-1024.png');
  const optimizedPath = path.join(__dirname, '../client/src/assets/logo-optimized.png');
  
  // Verificar tamanho original
  if (fs.existsSync(originalPath)) {
    const stats = fs.statSync(originalPath);
    console.log(`📏 Tamanho original: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Copiar para assets se não existir
    if (!fs.existsSync(assetsPath)) {
      fs.copyFileSync(originalPath, assetsPath);
      console.log('📁 Logo copiada para assets/');
    }
    
    // Sugestões de otimização
    console.log('\n🛠️ Sugestões para otimização:');
    console.log('1. Use ferramentas online como TinyPNG.com');
    console.log('2. Reduza para 512x512 se não precisar de 1024x1024');
    console.log('3. Use formato WebP com fallback PNG');
    console.log('4. Considere usar apenas o SVG');
    
    // Verificar se assets existe
    const assetsStats = fs.statSync(assetsPath);
    console.log(`✅ Logo em assets: ${(assetsStats.size / 1024).toFixed(2)} KB`);
    
    return true;
  } else {
    console.log('❌ Logo original não encontrada');
    return false;
  }
}

function createMultipleSizes() {
  console.log('\n📐 Sugestão: Criar múltiplos tamanhos');
  console.log('- logo-512.png (para uso geral)');
  console.log('- logo-256.png (para ícones pequenos)');
  console.log('- logo-optimized.png (versão comprimida)');
}

function testImportMethods() {
  console.log('\n🧪 Métodos de import a testar:');
  console.log('1. import logoImage from "../assets/logo-1024.png" (atual)');
  console.log('2. import logoImage from "/logo-1024.png"');
  console.log('3. const logoImage = new URL("../assets/logo-1024.png", import.meta.url).href');
  console.log('4. Usar apenas o SVG fallback');
}

function main() {
  console.log('🚀 Diagnóstico de Otimização da Logo\n');
  
  if (optimizeLogo()) {
    createMultipleSizes();
    testImportMethods();
    
    console.log('\n🎯 Próximos passos:');
    console.log('1. Teste a aplicação localmente');
    console.log('2. Faça build e teste');
    console.log('3. Deploy no Railway');
    console.log('4. Se ainda não funcionar, use apenas SVG');
  }
}

main();
