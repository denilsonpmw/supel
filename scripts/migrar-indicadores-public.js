#!/usr/bin/env node

/**
 * Script para aplicar migração usando a URL pública do banco
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Aplicando migração de indicadores gerenciais...\n');

// Verificar arquivo de migração
const migrationFile = path.join(__dirname, 'migrar-indicadores-producao.sql');
if (!fs.existsSync(migrationFile)) {
  console.error('❌ Arquivo de migração não encontrado:', migrationFile);
  process.exit(1);
}

console.log('📄 Arquivo de migração encontrado');

// Obter a URL pública do banco
try {
  console.log('🔍 Obtendo configurações do banco...');
  
  const result = execSync('railway variables', { encoding: 'utf8' });
  const lines = result.split('\n');
  
  let databaseUrl = null;
  for (const line of lines) {
    if (line.includes('DATABASE_PUBLIC_URL') && line.includes('postgresql://')) {
      // Extrair a URL da linha
      const urlMatch = line.match(/postgresql:\/\/[^\s│]+/);
      if (urlMatch) {
        databaseUrl = urlMatch[0];
        break;
      }
    }
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_PUBLIC_URL não encontrada');
  }

  console.log('✅ URL do banco obtida');
  console.log('🚀 Executando migração...\n');

  // Executar migração usando psql
  const command = `psql "${databaseUrl}" -f "${migrationFile}"`;
  const migrationResult = execSync(command, { 
    encoding: 'utf8',
    stdio: 'pipe'
  });

  console.log('📊 Resultado da migração:');
  console.log(migrationResult);
  
  console.log('\n✅ Migração executada com sucesso!');
  console.log('🎉 A página de indicadores gerenciais agora está disponível');

} catch (error) {
  console.error('\n❌ Erro ao executar migração:');
  console.error(error.message);
  
  console.log('\n🔧 Execução manual:');
  console.log('1. Copie o conteúdo do arquivo: scripts/migrar-indicadores-producao.sql');
  console.log('2. Acesse o Railway Dashboard > PostgreSQL > Query');
  console.log('3. Cole e execute o SQL');
  console.log('\nOU execute:');
  console.log('psql "postgresql://postgres:SENHA@HOST:PORTA/railway" -f scripts/migrar-indicadores-producao.sql');
}
