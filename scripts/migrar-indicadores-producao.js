#!/usr/bin/env node

/**
 * Script para aplicar migração de indicadores gerenciais em produção
 * Executa de forma segura sem afetar o sistema existente
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Aplicando migração de indicadores gerenciais em produção...\n');

// Verificar se estamos no diretório correto
const migrationFile = path.join(__dirname, 'migrar-indicadores-producao.sql');
if (!fs.existsSync(migrationFile)) {
  console.error('❌ Arquivo de migração não encontrado:', migrationFile);
  process.exit(1);
}

console.log('📄 Arquivo de migração encontrado');
console.log('🎯 Objetivo: Adicionar permissão "indicadores-gerenciais" aos usuários admin\n');

// Verificar se o Railway CLI está disponível
try {
  execSync('railway --version', { stdio: 'pipe' });
  console.log('✅ Railway CLI disponível');
} catch (error) {
  console.error('❌ Railway CLI não encontrado');
  console.log('💡 Instale com: npm install -g @railway/cli');
  process.exit(1);
}

// Verificar se estamos logados
try {
  execSync('railway whoami', { stdio: 'pipe' });
  console.log('✅ Autenticado no Railway');
} catch (error) {
  console.error('❌ Não autenticado no Railway');
  console.log('💡 Faça login com: railway login');
  process.exit(1);
}

console.log('\n🚀 Executando migração segura...\n');

try {
  // Conectar ao banco e executar a migração
  const result = execSync(`railway run psql $DATABASE_URL -f "${migrationFile}"`, { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('📊 Resultado da migração:');
  console.log(result);
  
  console.log('\n✅ Migração executada com sucesso!');
  console.log('🎉 A página de indicadores gerenciais agora está disponível para usuários admin');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Fazer deploy do frontend atualizado');
  console.log('   2. Testar acesso à página /admin/indicadores-gerenciais');
  console.log('   3. Verificar se os usuários admin conseguem acessar a página');

} catch (error) {
  console.error('\n❌ Erro ao executar migração:');
  console.error(error.message);
  
  console.log('\n🔧 Soluções alternativas:');
  console.log('1. Executar manualmente no Railway Dashboard:');
  console.log('   - Acesse o painel do PostgreSQL');
  console.log('   - Abra o Query Editor');
  console.log('   - Cole e execute o conteúdo do arquivo migrar-indicadores-producao.sql');
  console.log('\n2. Usar psql diretamente:');
  console.log('   - psql $DATABASE_URL -f scripts/migrar-indicadores-producao.sql');
  
  process.exit(1);
}
