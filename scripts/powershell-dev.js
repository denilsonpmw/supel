#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando ambiente de desenvolvimento SUPEL (PowerShell)...\n');

// Função para executar comandos em diretórios específicos
function runInDirectory(directory, command, args = []) {
  const originalDir = process.cwd();
  try {
    process.chdir(path.join(__dirname, '..', directory));
    console.log(`📁 Executando em: ${process.cwd()}`);
    console.log(`🔄 Comando: ${command} ${args.join(' ')}`);
    
    const result = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    return result;
  } catch (error) {
    console.error(`❌ Erro ao executar comando em ${directory}:`, error.message);
    process.chdir(originalDir);
    throw error;
  }
}

// Cores para output
const colors = {
  server: '\x1b[32m', // Verde
  client: '\x1b[34m', // Azul
  reset: '\x1b[0m'
};

console.log('🔧 Verificando estrutura do projeto...');

// Verificar se os diretórios existem
if (!fs.existsSync(path.join(__dirname, '..', 'server'))) {
  console.error('❌ Diretório server não encontrado!');
  process.exit(1);
}

if (!fs.existsSync(path.join(__dirname, '..', 'client'))) {
  console.error('❌ Diretório client não encontrado!');
  process.exit(1);
}

console.log('✅ Estrutura do projeto OK!');

// Função para executar processo com saída colorida
function runColoredProcess(name, directory, command, args, color) {
  const originalDir = process.cwd();
  
  try {
    process.chdir(path.join(__dirname, '..', directory));
    
    const childProcess = spawn(command, args, { 
      stdio: 'pipe',
      shell: true 
    });

    childProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`${color}[${name}]${colors.reset} ${output}`);
      }
    });

    childProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`${color}[${name}]${colors.reset} ${output}`);
      }
    });

    childProcess.on('close', (code) => {
      console.log(`${color}[${name}]${colors.reset} Processo finalizado com código ${code}`);
    });
    
    process.chdir(originalDir);
    return childProcess;
    
  } catch (error) {
    console.error(`❌ Erro ao iniciar ${name}:`, error.message);
    process.chdir(originalDir);
    throw error;
  }
}

// Iniciar servidor backend
console.log('🚀 Iniciando servidor backend...');
const serverProcess = runColoredProcess(
  'SERVER', 
  'server',
  'npm', 
  ['run', 'dev'], 
  colors.server
);

// Aguardar um pouco e iniciar cliente
setTimeout(() => {
  console.log('🚀 Iniciando cliente frontend...');
  const clientProcess = runColoredProcess(
    'CLIENT', 
    'client',
    'npm', 
    ['run', 'dev'], 
    colors.client
  );
}, 3000);

// Capturar Ctrl+C para finalizar ambos os processos
process.on('SIGINT', () => {
  console.log('\n🛑 Finalizando processos...');
  if (serverProcess) serverProcess.kill();
  process.exit(0);
});

console.log('\n💡 Pressione Ctrl+C para parar todos os serviços');
console.log('🌐 Frontend: http://localhost:5173');
console.log('🔗 Backend: http://localhost:3001');
console.log('📊 Health Check: http://localhost:3001/api/health\n'); 