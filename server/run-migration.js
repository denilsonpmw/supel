const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'supel_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

async function runMigration() {
  try {
    console.log('🔄 Executando migração 016: Corrigir acoes_permitidas para usuários existentes...');
    
    const sql = `
      -- Atualizar usuários admin que não têm acoes_permitidas
      UPDATE users 
      SET acoes_permitidas = ARRAY['ver_estatisticas', 'editar', 'excluir']
      WHERE perfil = 'admin' AND (acoes_permitidas IS NULL OR array_length(acoes_permitidas, 1) = 0);

      -- Atualizar usuários comuns que não têm acoes_permitidas
      UPDATE users 
      SET acoes_permitidas = ARRAY['ver_estatisticas', 'editar']
      WHERE perfil = 'usuario' AND (acoes_permitidas IS NULL OR array_length(acoes_permitidas, 1) = 0);

      -- Atualizar usuários visualizadores que não têm acoes_permitidas
      UPDATE users 
      SET acoes_permitidas = ARRAY['ver_estatisticas']
      WHERE perfil = 'visualizador' AND (acoes_permitidas IS NULL OR array_length(acoes_permitidas, 1) = 0);

      -- Garantir que o campo tenha valor padrão para novos usuários
      ALTER TABLE users ALTER COLUMN acoes_permitidas SET DEFAULT ARRAY['ver_estatisticas', 'editar'];
    `;
    
    await pool.query(sql);
    console.log('✅ Migração 016 executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
  } finally {
    await pool.end();
  }
}

runMigration(); 