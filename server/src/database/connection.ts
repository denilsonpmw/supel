import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Usa DATABASE_URL se disponível (Railway), senão usa variáveis separadas (local)
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('railway.app') || process.env.DATABASE_URL.includes('proxy.rlwy.net')
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'supel_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

  // Teste de conexão
  pool.on('connect', () => {
    // console.log('✅ Conectado ao banco PostgreSQL');
  });

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco:', err);
  process.exit(-1);
});

export default pool; 