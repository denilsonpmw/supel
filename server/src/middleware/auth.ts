import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import pool from '../database/connection';
import { User } from '../types';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    nome: string;
    perfil: string;
    paginas_permitidas?: string[];
    acoes_permitidas?: string[];
    responsavel_id?: number;
    ativo: boolean;
  };
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Gerar refresh token (assinatura separada)
export const generateRefreshToken = (userId: number): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET não configurado');
  }
  const payload = { userId };
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '8h';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyRefreshToken = (token: string): any => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET não configurado');
  }
  return jwt.verify(token, secret) as any;
};

// Middleware para autenticação de token
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // console.log('🔒 Verificando token:', {
    //   hasAuthHeader: !!authHeader,
    //   hasToken: !!token,
    //   path: req.path
    // });

    let decoded: any = null;

    if (token) {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    } else if (req.cookies && req.cookies.refresh_token) {
      // Tentar renovar a partir do refresh token em cookie HTTP-only
      try {
        const refresh = req.cookies.refresh_token as string;
        const refreshPayload = verifyRefreshToken(refresh);
        // Gerar um novo access token curto (o tempo já é controlado pelo generateToken)
        const newAccess = generateToken(refreshPayload.userId);
        // Anexar novo access token no header para uso imediato
        req.headers['authorization'] = `Bearer ${newAccess}` as any;
        decoded = jwt.verify(newAccess, process.env.JWT_SECRET || 'your-secret-key') as any;
      } catch (err) {
        // Não foi possível renovar via refresh
        // console.log('❌ Falha ao verificar refresh token:', err);
        res.status(401).json({ error: 'Token não fornecido ou inválido' });
        return;
      }
    } else {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }
    
    // console.log('✅ Token decodificado:', {
    //   userId: decoded.userId,
    //   email: decoded.email
    // });

    // Buscar usuário no banco com informações do responsável
    const result = await pool.query(`
      SELECT u.*, r.id as responsavel_id 
      FROM users u 
      LEFT JOIN responsaveis r ON u.email = r.email 
      WHERE u.id = $1
    `, [decoded.userId]);
    
    if (result.rows.length === 0) {
      // console.log('❌ Usuário não encontrado no banco');
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    const user = result.rows[0];
    
    if (!user.ativo) {
      // console.log('❌ Usuário inativo');
      res.status(401).json({ error: 'Usuário inativo' });
      return;
    }

    // Adicionar usuário ao request
    req.user = user;
    // console.log('✅ Usuário autenticado:', {
    //   id: user.id,
    //   email: user.email,
    //   nome: user.nome,
    //   perfil: user.perfil,
    //   paginas_permitidas: user.paginas_permitidas,
    //   acoes_permitidas: user.acoes_permitidas
    // });

    next();
  } catch (error) {
    // console.log('❌ Erro na autenticação:', error);
    res.status(401).json({ error: 'Token inválido' });
    return;
  }
};

// Middleware para verificar acesso à página
export const requirePageAccess = (pagina: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    // console.log('🔑 Verificando acesso à página:', {
    //   pagina,
    //   userProfile: user?.perfil,
    //   userPermissions: user?.paginas_permitidas,
    //   path: req.path
    // });

    if (!user) {
      // console.log('❌ Usuário não autenticado');
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (user.perfil === 'admin') {
      // console.log('✅ Acesso permitido (admin)');
      next();
      return;
    }

    if (!user.paginas_permitidas?.includes(pagina)) {
      // console.log('❌ Acesso negado - usuário não tem permissão');
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    // console.log('✅ Acesso permitido');
    next();
  };
};

// Middleware para verificar permissões específicas (mantido para compatibilidade)
export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    // Administradores têm acesso total
    if (req.user.perfil === 'admin') {
      next();
      return;
    }

    try {
      const result = await pool.query(
        `SELECT granted FROM permissions 
         WHERE user_id = $1 AND resource = $2 AND action = $3`,
        [req.user.id, resource, action]
      );

      if (result.rows.length === 0 || !result.rows[0].granted) {
        res.status(403).json({ error: 'Permissão negada' });
        return;
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
  };
};

// Middleware para verificar perfil específico
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (!roles.includes(req.user.perfil)) {
      res.status(403).json({ error: 'Acesso negado para este perfil' });
      return;
    }

    next();
  };
};

// Função para verificar token do Google
export const verifyGoogleToken = async (token: string) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID não configurado');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.error('Erro ao verificar token do Google:', error);
    return null;
  }
};

// Função para gerar JWT token
export const generateToken = (userId: number, userProfile?: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }

  const payload = { userId };
  
  // Tokens de longa duração para painéis ou conforme configuração
  let expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  // Se for acesso via painel público, token não expira (30 dias)
  if (userProfile === 'painel' || userProfile === 'publico') {
    expiresIn = '30d';
  }
  
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

// Middleware para aplicar filtros por responsável
export const applyUserFilters = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  // console.log('🔍 Aplicando filtros de usuário:', {
  //   userProfile: user.perfil,
  //   responsavelId: user.responsavel_id,
  //   email: user.email,
  //   path: req.path,
  //   method: req.method
  // });

  // Se não for admin e tiver responsável vinculado, aplicar filtro
  if (user.perfil !== 'admin' && user.responsavel_id) {
    // Aplicar filtro no query para endpoints de processos
    // Mas não sobrescrever se já foi especificado explicitamente
    if (!req.query.responsavel_id) {
      req.query.responsavel_id = user.responsavel_id.toString();
      // console.log('✅ Filtro aplicado por responsável:', user.responsavel_id);
    } else {
      // console.log('ℹ️ Filtro responsavel_id já especificado pelo usuário:', req.query.responsavel_id);
    }
    
    // Também adicionar ao request para uso nos controllers do dashboard
    (req as any).userResponsavelId = user.responsavel_id;
  } else {
    // Para admins, definir como -1 para indicar que não deve filtrar
    (req as any).userResponsavelId = -1;
    // console.log('✅ Usuário admin - sem filtro por responsável');
  }

  next();
};

// Estender a interface AuthRequest para incluir o ID do responsável
declare global {
  namespace Express {
    interface Request {
      userResponsavelId?: number;
    }
  }
}

export { AuthRequest }; 