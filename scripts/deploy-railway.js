const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando deploy no Railway...');

// Verificar se o Railway CLI está instalado
try {
  execSync('railway --version', { stdio: 'pipe' });
  console.log('✅ Railway CLI encontrado');
} catch (error) {
  console.error('❌ Railway CLI não encontrado');
  console.log('📦 Instalando Railway CLI...');
  try {
    execSync('npm install -g @railway/cli', { stdio: 'inherit' });
    console.log('✅ Railway CLI instalado');
  } catch (installError) {
    console.error('❌ Erro ao instalar Railway CLI');
    console.log('💡 Instale manualmente: npm install -g @railway/cli');
    process.exit(1);
  }
}

// Verificar se está logado no Railway
try {
  execSync('railway whoami', { stdio: 'pipe' });
  console.log('✅ Logado no Railway');
} catch (error) {
  console.log('🔐 Fazendo login no Railway...');
  try {
    execSync('railway login', { stdio: 'inherit' });
  } catch (loginError) {
    console.error('❌ Erro no login do Railway');
    process.exit(1);
  }
}

// Verificar se o projeto está linkado
try {
  execSync('railway status', { stdio: 'pipe' });
  console.log('✅ Projeto linkado ao Railway');
} catch (error) {
  console.log('🔗 Linkando projeto ao Railway...');
  try {
    execSync('railway link', { stdio: 'inherit' });
  } catch (linkError) {
    console.error('❌ Erro ao linkar projeto');
    process.exit(1);
  }
}

// Verificar se o build está pronto
console.log('🔍 Verificando build...');
try {
  execSync('npm run verify-build', { stdio: 'inherit' });
} catch (error) {
  console.log('🔨 Fazendo build do projeto...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (buildError) {
    console.error('❌ Erro no build do projeto');
    process.exit(1);
  }
}

// Fazer deploy
console.log('🚀 Fazendo deploy no Railway...');
try {
  execSync('railway up', { stdio: 'inherit' });
  console.log('✅ Deploy concluído!');
} catch (deployError) {
  console.error('❌ Erro no deploy');
  process.exit(1);
}

// Verificar status
console.log('📊 Verificando status do deploy...');
try {
  execSync('railway status', { stdio: 'inherit' });
} catch (error) {
  console.warn('⚠️  Não foi possível verificar o status');
}

console.log('🎉 Deploy finalizado!');
console.log('🌐 Acesse seu projeto no Railway Dashboard');
console.log('📊 Health check: https://seu-projeto.railway.app/api/health'); 