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
    console.log('🔄 Executando migração para adicionar cor_hex à tabela modalidades...');
    
    const sql = `
      ALTER TABLE modalidades ADD COLUMN IF NOT EXISTS cor_hex VARCHAR(7) DEFAULT '#3498db';
      UPDATE modalidades SET cor_hex = '#3498db' WHERE cor_hex IS NULL;
    `;
    
    await pool.query(sql);
    console.log('✅ Migração executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
  } finally {
    await pool.end();
  }
}

runMigration(); 