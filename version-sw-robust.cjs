#!/usr/bin/env node

/**
 * Script robusto para versionar o Service Worker e criar tags automaticamente
 * Uso: node scripts/version-sw-robust.cjs <patch|minor|major> [mensagem]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SW_PATH = path.join(__dirname, './client/public/sw.js');

function getCurrentVersion() {
  console.log('📋 Lendo versão atual do Service Worker...');
  const swContent = fs.readFileSync(SW_PATH, 'utf8');
  const match = swContent.match(/const CACHE_NAME = 'supel-v(\d+\.\d+\.\d+)';/);
  if (!match) {
    throw new Error('Não foi possível encontrar a versão atual no Service Worker');
  }
  return match[1];
}

function runCommand(command, options = {}) {
  try {
    console.log(`🔧 Executando: ${command}`);
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: options.cwd || process.cwd(),
      ...options 
    });
    return result;
  } catch (error) {
    console.error(`❌ Erro ao executar: ${command}`);
    console.error(`❌ Detalhes: ${error.message}`);
    if (error.stdout) console.error(`📝 stdout: ${error.stdout}`);
    if (error.stderr) console.error(`📝 stderr: ${error.stderr}`);
    throw error;
  }
}

function checkGitStatus() {
  try {
    console.log('🔍 Verificando status do Git...');
    const status = runCommand('git status --porcelain', { silent: true });
    if (status.trim()) {
      console.log('📋 Arquivos modificados encontrados:');
      console.log(status);
    }
    return status;
  } catch (error) {
    throw new Error('Erro ao verificar status do Git');
  }
}

function incrementVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error('Tipo de versão inválido. Use: patch, minor ou major');
  }
}

function updateServiceWorkerVersion(newVersion) {
  console.log('✏️ Atualizando versão no Service Worker...');
  const swContent = fs.readFileSync(SW_PATH, 'utf8');
  const newContent = swContent.replace(
    /const CACHE_NAME = 'supel-v\d+\.\d+\.\d+';/,
    `const CACHE_NAME = 'supel-v${newVersion}';`
  );
  fs.writeFileSync(SW_PATH, newContent);
  console.log('✅ Service Worker atualizado');
}

function buildClient() {
  console.log('🔨 Fazendo build do client...');
  try {
    runCommand('npm run build', { cwd: path.join(__dirname, './client') });
    console.log('✅ Build concluído com sucesso');
  } catch (error) {
    console.log('⚠️ Erro no build, mas continuando...');
    console.log(`⚠️ Detalhes: ${error.message}`);
  }
}

function gitCommitAndTag(newVersion, commitMessage) {
  console.log('📝 Adicionando arquivos ao Git...');
  runCommand('git add .');
  
  // Verificar se há mudanças para commit
  console.log('🔍 Verificando mudanças para commit...');
  const changes = runCommand('git diff --cached --name-only', { silent: true });
  if (!changes.trim()) {
    console.log('⚠️ Nenhuma mudança detectada para commit');
    console.log('🔍 Verificando status completo...');
    runCommand('git status');
    return false;
  }
  
  console.log('📋 Arquivos que serão commitados:');
  console.log(changes);
  
  console.log('📝 Fazendo commit...');
  const fullCommitMessage = `feat: ${commitMessage} - versão v${newVersion}`;
  runCommand(`git commit -m "${fullCommitMessage}"`);
  
  console.log(`🏷️ Criando tag v${newVersion}...`);
  runCommand(`git tag -a v${newVersion} -m "Versão ${newVersion} - ${commitMessage}"`);
  
  console.log('📤 Enviando para repositório...');
  runCommand('git push origin main');
  runCommand(`git push origin v${newVersion}`);
  
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0];
  const commitMessage = args[1] || `Service Worker version ${versionType} update`;

  if (!versionType || !['patch', 'minor', 'major'].includes(versionType)) {
    console.error('❌ Uso: node scripts/version-sw-robust.cjs <patch|minor|major> [mensagem]');
    console.error('📝 Exemplo: node scripts/version-sw-robust.cjs patch "Fix notification timing"');
    process.exit(1);
  }

  try {
    console.log('🚀 Iniciando processo de versionamento...');
    
    // 1. Verificar status do Git
    checkGitStatus();

    // 2. Obter versão atual
    const currentVersion = getCurrentVersion();
    console.log(`📦 Versão atual: v${currentVersion}`);

    // 3. Incrementar versão
    const newVersion = incrementVersion(currentVersion, versionType);
    console.log(`🚀 Nova versão: v${newVersion}`);

    // 4. Atualizar Service Worker
    updateServiceWorkerVersion(newVersion);

    // 5. Build do client
    buildClient();

    // 6. Commit e tag
    const success = gitCommitAndTag(newVersion, commitMessage);
    
    if (success) {
      console.log(`🎉 Versão v${newVersion} criada e enviada com sucesso!`);
      console.log(`🔗 Tag disponível em: https://github.com/denilsonpmw/supel/releases/tag/v${newVersion}`);
    } else {
      console.log('⚠️ Processo concluído, mas nenhum commit foi necessário');
    }

  } catch (error) {
    console.error('❌ Erro no processo de versionamento:', error.message);
    console.error('💡 Dica: Verifique se há mudanças pendentes e se o Git está configurado corretamente');
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { getCurrentVersion, incrementVersion, updateServiceWorkerVersion };
