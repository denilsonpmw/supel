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
    console.log('🔄 Executando migração 015: Adicionar campo acoes_permitidas na tabela users...');
    
    const sql = `
      -- Adicionar coluna para ações permitidas
      ALTER TABLE users ADD COLUMN IF NOT EXISTS acoes_permitidas TEXT[] DEFAULT ARRAY['ver_estatisticas', 'editar', 'excluir'];

      -- Atualizar usuários admin para ter todas as ações permitidas
      UPDATE users 
      SET acoes_permitidas = ARRAY['ver_estatisticas', 'editar', 'excluir']
      WHERE perfil = 'admin';

      -- Atualizar usuários comuns para ter apenas ver estatísticas por padrão
      UPDATE users 
      SET acoes_permitidas = ARRAY['ver_estatisticas']
      WHERE perfil = 'usuario' AND acoes_permitidas IS NULL;
    `;
    
    await pool.query(sql);
    console.log('✅ Migração 015 executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
  } finally {
    await pool.end();
  }
}

runMigration(); 