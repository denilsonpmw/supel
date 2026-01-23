import express, { Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../database/connection';

const router = express.Router();

// Gerar API key segura
function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Listar todas as API keys (sem autenticação)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        id, 
        key_name, 
        api_key,
        is_active,
        allowed_endpoints,
        rate_limit,
        expires_at,
        created_at,
        last_used_at,
        usage_count
      FROM api_keys
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    // Mascarar as keys para segurança (mostrar apenas últimos 8 caracteres)
    const maskedKeys = result.rows.map((key: any) => ({
      ...key,
      api_key: `${'*'.repeat(56)}${key.api_key.slice(-8)}`
    }));

    res.json(maskedKeys);
  } catch (error) {
    console.error('Erro ao listar API keys:', error);
    res.status(500).json({ error: 'Erro ao listar API keys' });
  }
});

// Criar nova API key (sem autenticação)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      key_name, 
      allowed_endpoints = ['/api/processes*'], 
      rate_limit = 1000,
      expires_in_days 
    } = req.body;

    if (!key_name) {
      res.status(400).json({ error: 'Nome da API key é obrigatório' });
      return;
    }

    const apiKey = generateApiKey();
    let expiresAt = null;

    if (expires_in_days && expires_in_days > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);
    }

    const result = await pool.query(
      `INSERT INTO api_keys 
       (key_name, api_key, user_id, allowed_endpoints, rate_limit, expires_at)
       VALUES ($1, $2, NULL, $3, $4, $5)
       RETURNING id, key_name, api_key, allowed_endpoints, rate_limit, expires_at, created_at`,
      [key_name, apiKey, allowed_endpoints, rate_limit, expiresAt]
    );

    res.status(201).json({
      message: 'API key criada com sucesso',
      warning: 'Guarde esta key em local seguro. Ela não será exibida novamente.',
      api_key: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar API key:', error);
    res.status(500).json({ error: 'Erro ao criar API key' });
  }
});

// Revogar (desativar) API key (sem autenticação)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const keyId = parseInt(req.params.id || '0');

    const query = 'UPDATE api_keys SET is_active = false WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [keyId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'API key não encontrada' });
      return;
    }

    res.json({ 
      message: 'API key revogada com sucesso',
      key_name: result.rows[0].key_name
    });
  } catch (error) {
    console.error('Erro ao revogar API key:', error);
    res.status(500).json({ error: 'Erro ao revogar API key' });
  }
});

// Visualizar estatísticas de uma API key (sem autenticação)
router.get('/:id/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const keyId = parseInt(req.params.id || '0');
    const query = 'SELECT * FROM api_keys WHERE id = $1';
    const result = await pool.query(query, [keyId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'API key não encontrada' });
      return;
    }

    const keyData = result.rows[0];
    
    res.json({
      key_name: keyData.key_name,
      is_active: keyData.is_active,
      usage_count: keyData.usage_count,
      last_used_at: keyData.last_used_at,
      created_at: keyData.created_at,
      expires_at: keyData.expires_at,
      rate_limit: keyData.rate_limit,
      allowed_endpoints: keyData.allowed_endpoints
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
