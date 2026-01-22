import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

interface ApiKeyRequest extends Request {
  apiKeyUser?: {
    id: number;
    key_name: string;
    allowed_endpoints: string[];
  };
}

export const apiKeyAuth = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extrair API key do header
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({ 
        error: 'API key não fornecida',
        message: 'Inclua a API key no header X-API-Key' 
      });
      return;
    }

    // Validar API key no banco
    const result = await pool.query(
      `SELECT id, key_name, user_id, allowed_endpoints, rate_limit, expires_at, usage_count
       FROM api_keys
       WHERE api_key = $1 AND is_active = true`,
      [apiKey]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ 
        error: 'API key inválida ou inativa' 
      });
      return;
    }

    const keyData = result.rows[0];

    // Verificar expiração
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      res.status(401).json({ 
        error: 'API key expirada',
        expired_at: keyData.expires_at
      });
      return;
    }

    // Verificar rate limit (requisições por hora)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const rateLimitCheck = await pool.query(
      `SELECT COUNT(*) as recent_requests
       FROM api_keys
       WHERE id = $1 AND last_used_at > $2`,
      [keyData.id, hourAgo]
    );

    if (parseInt(rateLimitCheck.rows[0].recent_requests) >= keyData.rate_limit) {
      res.status(429).json({ 
        error: 'Rate limit excedido',
        limit: keyData.rate_limit,
        period: '1 hora'
      });
      return;
    }

    // Verificar se o endpoint está permitido
    const requestPath = req.path;
    const allowedEndpoints = keyData.allowed_endpoints || [];
    
    if (allowedEndpoints.length > 0) {
      const isAllowed = allowedEndpoints.some((pattern: string) => {
        // Suporta wildcards simples: /api/processes* permite /api/processes e /api/processes/123
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        return regex.test(requestPath);
      });

      if (!isAllowed) {
        res.status(403).json({ 
          error: 'Acesso negado',
          message: `Esta API key não tem permissão para acessar ${requestPath}`,
          allowed_endpoints: allowedEndpoints
        });
        return;
      }
    }

    // Atualizar uso da key
    await pool.query(
      `UPDATE api_keys 
       SET last_used_at = NOW(), 
           usage_count = usage_count + 1
       WHERE id = $1`,
      [keyData.id]
    );

    // Adicionar informações da API key ao request
    req.apiKeyUser = {
      id: keyData.user_id,
      key_name: keyData.key_name,
      allowed_endpoints: keyData.allowed_endpoints
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação por API key:', error);
    res.status(500).json({ error: 'Erro na autenticação' });
  }
};

// Middleware alternativo que aceita JWT OU API key
export const jwtOrApiKey = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (apiKey) {
    // Usar autenticação por API key
    return apiKeyAuth(req, res, next);
  } else {
    // Usar autenticação JWT normal
    // Importar authMiddleware apenas se necessário
    const { authMiddleware } = await import('./auth');
    return authMiddleware(req, res, next);
  }
};
