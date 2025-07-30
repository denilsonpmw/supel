#!/usr/bin/env node

/**
 * Script para versionar o Service Worker e criar tags automaticamente
 * Uso: node scripts/version-sw.js <patch|minor|major> [mensagem]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SW_PATH = path.join(__dirname, '../client/public/sw.js');

function getCurrentVersion() {
  const swContent = fs.readFileSync(SW_PATH, 'utf8');
  const match = swContent.match(/const CACHE_NAME = 'supel-v(\d+\.\d+\.\d+)';/);
  if (!match) {
    throw new Error('Não foi possível encontrar a versão atual no Service Worker');
  }
  return match[1];
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
  const swContent = fs.readFileSync(SW_PATH, 'utf8');
  const newContent = swContent.replace(
    /const CACHE_NAME = 'supel-v\d+\.\d+\.\d+';/,
    `const CACHE_NAME = 'supel-v${newVersion}';`
  );
  fs.writeFileSync(SW_PATH, newContent);
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0];
  const commitMessage = args[1] || `Service Worker version ${versionType} update`;

  if (!versionType || !['patch', 'minor', 'major'].includes(versionType)) {
    console.error('Uso: node scripts/version-sw.js <patch|minor|major> [mensagem]');
    process.exit(1);
  }

  try {
    // 1. Obter versão atual
    const currentVersion = getCurrentVersion();
    console.log(`📦 Versão atual: v${currentVersion}`);

    // 2. Incrementar versão
    const newVersion = incrementVersion(currentVersion, versionType);
    console.log(`🚀 Nova versão: v${newVersion}`);

    // 3. Atualizar Service Worker
    updateServiceWorkerVersion(newVersion);
    console.log(`✅ Service Worker atualizado`);

    // 4. Build do client
    console.log(`🔨 Fazendo build...`);
    execSync('cd client && npm run build', { stdio: 'inherit' });

    // 5. Commit das mudanças
    console.log(`📝 Fazendo commit...`);
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "${commitMessage} v${newVersion}"`, { stdio: 'inherit' });

    // 6. Criar tag
    console.log(`🏷️ Criando tag v${newVersion}...`);
    execSync(`git tag -a v${newVersion} -m "Service Worker version ${newVersion} - ${commitMessage}"`, { stdio: 'inherit' });

    // 7. Push commit e tag
    console.log(`📤 Enviando para repositório...`);
    execSync('git push origin main', { stdio: 'inherit' });
    execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });

    console.log(`🎉 Versão v${newVersion} criada e enviada com sucesso!`);
    console.log(`🔗 Tag disponível em: https://github.com/denilsonpmw/supel/releases/tag/v${newVersion}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
