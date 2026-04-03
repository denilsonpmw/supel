#!/usr/bin/env node

/**
 * Script para diagnosticar problemas com a logo PNG em produção
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

function checkFile(filePath, description) {
  console.log(`\n🔍 Verificando: ${description}`);
  console.log(`📁 Caminho: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ Arquivo encontrado`);
    console.log(`📏 Tamanho: ${formatBytes(stats.size)}`);
    console.log(`📅 Modificado: ${stats.mtime.toLocaleString()}`);
    
    // Verificar se é uma imagem válida (primeiros bytes)
    try {
      const buffer = fs.readFileSync(filePath);
      const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      console.log(`🖼️ Formato PNG válido: ${isPNG ? '✅' : '❌'}`);
      if (isPNG) {
        console.log(`📊 Primeiros bytes: ${buffer.slice(0, 8).toString('hex')}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao ler arquivo: ${error.message}`);
    }
  } else {
    console.log(`❌ Arquivo NÃO encontrado`);
  }
}

function listLogoFiles(dirPath, description) {
  console.log(`\n📋 Listando arquivos de logo em: ${description}`);
  console.log(`📁 Diretório: ${dirPath}`);
  
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      const logoFiles = files.filter(file => 
        file.toLowerCase().includes('logo') || 
        file.toLowerCase().includes('icon')
      );
      
      if (logoFiles.length > 0) {
        logoFiles.forEach(file => {
          const fullPath = path.join(dirPath, file);
          const stats = fs.statSync(fullPath);
          console.log(`  📄 ${file} (${formatBytes(stats.size)})`);
        });
      } else {
        console.log(`  ⚠️ Nenhum arquivo de logo encontrado`);
      }
    } else {
      console.log(`❌ Diretório não existe`);
    }
  } catch (error) {
    console.log(`❌ Erro ao listar diretório: ${error.message}`);
  }
}

function checkViteConfig() {
  console.log(`\n🔧 Verificando configuração do Vite...`);
  const viteConfigPath = path.join(__dirname, '../client/vite.config.ts');
  
  if (fs.existsSync(viteConfigPath)) {
    const content = fs.readFileSync(viteConfigPath, 'utf8');
    console.log(`✅ vite.config.ts encontrado`);
    
    // Verificar configurações relevantes
    if (content.includes('publicDir')) {
      console.log(`📁 Configuração publicDir encontrada`);
    }
    if (content.includes('assetsInclude')) {
      console.log(`📦 Configuração assetsInclude encontrada`);
    }
    
    console.log(`\n📝 Conteúdo relevante do vite.config.ts:`);
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('public') || line.includes('asset') || line.includes('build')) {
        console.log(`  ${index + 1}: ${line.trim()}`);
      }
    });
  } else {
    console.log(`❌ vite.config.ts não encontrado`);
  }
}

function checkPackageJson() {
  console.log(`\n📦 Verificando package.json do client...`);
  const packagePath = path.join(__dirname, '../client/package.json');
  
  if (fs.existsSync(packagePath)) {
    const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`✅ package.json encontrado`);
    console.log(`📝 Scripts de build:`);
    if (content.scripts) {
      Object.entries(content.scripts).forEach(([key, value]) => {
        if (key.includes('build') || key.includes('dev')) {
          console.log(`  ${key}: ${value}`);
        }
      });
    }
  } else {
    console.log(`❌ package.json não encontrado`);
  }
}

function checkBuildOutput() {
  console.log(`\n🔨 Verificando saída do build...`);
  const buildPath = path.join(__dirname, '../client/dist');
  
  if (fs.existsSync(buildPath)) {
    console.log(`✅ Pasta dist encontrada`);
    listLogoFiles(buildPath, 'dist');
    
    // Verificar se existe index.html e o que referencia
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      console.log(`\n🔍 Referências a logo no index.html:`);
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes('logo')) {
          console.log(`  ${index + 1}: ${line.trim()}`);
        }
      });
    }
  } else {
    console.log(`❌ Pasta dist não encontrada - Execute o build primeiro`);
  }
}

function checkLogoComponent() {
  console.log(`\n🧩 Verificando componente SupelLogoImage...`);
  const componentPath = path.join(__dirname, '../client/src/components/common/SupelLogoImage.tsx');
  
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf8');
    console.log(`✅ SupelLogoImage.tsx encontrado`);
    
    // Extrair linha que define o src da imagem
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('src=') && line.includes('logo')) {
        console.log(`  ${index + 1}: ${line.trim()}`);
      }
    });
  } else {
    console.log(`❌ SupelLogoImage.tsx não encontrado`);
  }
}

function main() {
  console.log('🚀 Diagnóstico Completo da Logo PNG\n');
  console.log('=' .repeat(50));
  
  // 1. Verificar arquivo original
  const logoPath = path.join(__dirname, '../client/public/logo-1024.png');
  checkFile(logoPath, 'Logo original em public/');
  
  // 2. Verificar pasta public completa
  listLogoFiles(path.join(__dirname, '../client/public'), 'client/public');
  
  // 3. Verificar pasta icons
  listLogoFiles(path.join(__dirname, '../client/public/icons'), 'client/public/icons');
  
  // 4. Verificar configuração do Vite
  checkViteConfig();
  
  // 5. Verificar package.json
  checkPackageJson();
  
  // 6. Verificar saída do build
  checkBuildOutput();
  
  // 7. Verificar componente
  checkLogoComponent();
  
  // 8. Verificar se o build está atualizado
  console.log(`\n⏰ Verificando se build está atualizado...`);
  try {
    const publicLogoPath = path.join(__dirname, '../client/public/logo-1024.png');
    const distLogoPath = path.join(__dirname, '../client/dist/logo-1024.png');
    
    if (fs.existsSync(publicLogoPath) && fs.existsSync(distLogoPath)) {
      const publicStats = fs.statSync(publicLogoPath);
      const distStats = fs.statSync(distLogoPath);
      
      console.log(`📅 Public modificado: ${publicStats.mtime.toLocaleString()}`);
      console.log(`📅 Dist modificado: ${distStats.mtime.toLocaleString()}`);
      
      if (publicStats.mtime > distStats.mtime) {
        console.log(`⚠️ Build pode estar desatualizado - Public é mais recente`);
      } else {
        console.log(`✅ Build parece atualizado`);
      }
    }
  } catch (error) {
    console.log(`⚠️ Não foi possível comparar datas: ${error.message}`);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 Diagnóstico concluído!');
}

main();
