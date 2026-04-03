#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando SUPEL - Versão Simples PowerShell...\n');

try {
  // Salvar diretório atual
  const originalDir = process.cwd();
  
  console.log('📁 Diretório atual:', originalDir);
  
  // Verificar se os diretórios existem
  const serverPath = path.join(originalDir, 'server');
  const clientPath = path.join(originalDir, 'client');
  
  console.log('🔍 Verificando servidor em:', serverPath);
  console.log('🔍 Verificando cliente em:', clientPath);
  
  // Executar servidor
  console.log('\n🚀 Iniciando servidor...');
  process.chdir(serverPath);
  console.log('📁 Mudou para:', process.cwd());
  
  const serverProcess = execSync('npm run dev', { 
    stdio: 'inherit',
    cwd: serverPath
  });
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

console.log('✅ Script concluído!'); 