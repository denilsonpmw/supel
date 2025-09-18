import { Request, Response } from 'express';
import pool from '../database/connection';
import { generateToken } from '../middleware/auth';
import { generateRefreshToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { trackAuthEvent } from '../middleware/accessTracker';

// Login com email/senha
export const emailLogin = async (req: Request, res: Response) => {
  try {
    const { email, senha, primeiroAcesso } = req.body;

    if (!email || !senha) {
      throw createError('Email e senha são obrigatórios', 400);
    }

    // Se for primeiro acesso, validar e definir primeira senha
    if (primeiroAcesso) {
      // Verificar se o usuário existe e está ativo
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND ativo = true',
        [email]
      );

      if (userResult.rows.length === 0) {
        throw createError('Usuário não encontrado ou inativo', 404);
      }

      const user = userResult.rows[0];

      // Verificar se o usuário realmente está em primeiro acesso
      if (!user.primeiro_acesso) {
        throw createError('Você já tem acesso ao sistema!', 400);
      }

      // Usar a senha fornecida como nova senha e definir
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(senha, saltRounds);

      await pool.query(
        'UPDATE users SET senha = $1, primeiro_acesso = false WHERE email = $2',
        [hashedPassword, email]
      );

      // Fazer login após definir a senha
      const updatedUser = { ...user, senha: hashedPassword };
      
      // Gerar JWT token com perfil do usuário
    const jwtToken = generateToken(updatedUser.id, updatedUser.perfil);
    const refreshToken = generateRefreshToken(updatedUser.id);

      // Buscar nome do responsável se o usuário for um responsável
      let nome_responsavel = null;
      if (updatedUser.perfil === 'usuario') {
        const responsavelResult = await pool.query(
          'SELECT nome_responsavel FROM responsaveis WHERE email = $1',
          [updatedUser.email]
        );
        if (responsavelResult.rows.length > 0) {
          nome_responsavel = responsavelResult.rows[0].nome_responsavel;
        }
      }

      // Enviar refresh token como cookie HTTP-only (8 horas por padrão via env)
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: parseInt(process.env.JWT_REFRESH_MAX_AGE_MS || String(8 * 60 * 60 * 1000), 10),
        path: '/'
      });

      res.json({
        success: true,
        token: jwtToken,
        user: {
            id: updatedUser.id,
            email: updatedUser.email,
            perfil: updatedUser.perfil,
            nome_responsavel,
          },
          message: 'Primeira senha definida com sucesso!'
      });

      // Tracking: Login bem-sucedido (primeiro acesso)
      await trackAuthEvent(
        email, 
        'login_success', 
        req.ip || req.connection?.remoteAddress, 
        req.get('User-Agent'),
        updatedUser.perfil
      );
      return;
    }

    // Login normal - Buscar usuário por email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND ativo = true',
      [email]
    );

    if (result.rows.length === 0) {
      throw createError('Email ou senha incorretos', 401);
    }

    const user = result.rows[0];

    // Se o usuário está em primeiro acesso mas não enviou o flag, orientar
    if (user.primeiro_acesso && !primeiroAcesso) {
      throw createError('Este é seu primeiro acesso. Marque a opção "Primeiro Acesso" e defina sua senha.', 400);
    }

    // Verificar senha usando bcrypt
    const senhaValida = await bcrypt.compare(senha, user.senha || '');

    if (!senhaValida) {
      // Tracking: Tentativa de login falhou
      await trackAuthEvent(
        email, 
        'login_fail', 
        req.ip || req.connection?.remoteAddress, 
        req.get('User-Agent')
      );
      throw createError('Email ou senha incorretos', 401);
    }

    // Gerar JWT token com perfil do usuário
  const jwtToken = generateToken(user.id, user.perfil);
  const refreshToken = generateRefreshToken(user.id);

    // Buscar nome do responsável se o usuário for um responsável
    let nome_responsavel = null;
    if (user.perfil === 'usuario') {
      const responsavelResult = await pool.query(
        'SELECT nome_responsavel FROM responsaveis WHERE email = $1',
        [user.email]
      );
      if (responsavelResult.rows.length > 0) {
        nome_responsavel = responsavelResult.rows[0].nome_responsavel;
      }
    }

    // Remover informações sensíveis
    const userResponse = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      perfil: user.perfil,
      paginas_permitidas: user.paginas_permitidas,
      acoes_permitidas: user.acoes_permitidas,
      ativo: user.ativo,
      created_at: user.created_at,
      updated_at: user.updated_at,
      nome_responsavel
    };

    // Enviar refresh token como cookie HTTP-only
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: parseInt(process.env.JWT_REFRESH_MAX_AGE_MS || String(8 * 60 * 60 * 1000), 10),
      path: '/'
    });

    res.json({
      message: 'Login realizado com sucesso',
      user: userResponse,
      token: jwtToken,
    });

    // Tracking: Login bem-sucedido
    await trackAuthEvent(
      user.email, 
      'login_success', 
      req.ip || req.connection?.remoteAddress, 
      req.get('User-Agent'),
      user.perfil
    );
  } catch (error) {
    console.error('Erro no login por email:', error);
    const statusCode = (error as any).statusCode || 500;
    const message = (error as any).message || 'Erro interno do servidor';
    res.status(statusCode).json({ error: message });
  }
};

// Login com Google (simulado para desenvolvimento)
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw createError('Token do Google é obrigatório', 400);
    }

    // Para desenvolvimento: simular verificação do token Google
    // Em produção, usar verifyGoogleToken real
    let email: string;
    let name: string;
    
    if (token === 'mock_google_token_for_denilson.pmw@gmail.com') {
      email = 'denilson.pmw@gmail.com';
      name = 'Denilson Maciel';
    } else {
      throw createError('Token do Google inválido', 401);
    }

    // Verificar se usuário existe
    let result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    let user;

    if (result.rows.length === 0) {
      // Criar novo usuário como visualizador
      result = await pool.query(
        `INSERT INTO users (email, nome, perfil, ativo, paginas_permitidas, acoes_permitidas) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [email, name, 'visualizador', false, ['dashboard'], ['ver_estatisticas']]
      );
      user = result.rows[0];

      if (!user.ativo) {
        throw createError('Usuário criado, mas precisa de aprovação do administrador.', 403);
      }
    } else {
      user = result.rows[0];
    }

    if (!user.ativo) {
      throw createError('Usuário inativo. Entre em contato com o administrador.', 403);
    }

  // Gerar JWT token com perfil do usuário
  const jwtToken = generateToken(user.id, user.perfil);
  const refreshToken = generateRefreshToken(user.id);

    // Buscar nome do responsável se o usuário for um responsável
    let nome_responsavel = null;
    if (user.perfil === 'usuario') {
      const responsavelResult = await pool.query(
        'SELECT nome_responsavel FROM responsaveis WHERE email = $1',
        [user.email]
      );
      if (responsavelResult.rows.length > 0) {
        nome_responsavel = responsavelResult.rows[0].nome_responsavel;
      }
    }

    // Remover informações sensíveis
    const userResponse = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      perfil: user.perfil,
      paginas_permitidas: user.paginas_permitidas,
      acoes_permitidas: user.acoes_permitidas,
      ativo: user.ativo,
      created_at: user.created_at,
      updated_at: user.updated_at,
      nome_responsavel
    };

    // Enviar refresh token como cookie HTTP-only
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: parseInt(process.env.JWT_REFRESH_MAX_AGE_MS || String(8 * 60 * 60 * 1000), 10),
      path: '/'
    });

    res.json({
      message: 'Login realizado com sucesso',
      user: userResponse,
      token: jwtToken,
    });

    // Tracking: Login Google bem-sucedido
    await trackAuthEvent(
      user.email, 
      'login_success', 
      req.ip || req.connection?.remoteAddress, 
      req.get('User-Agent'),
      user.perfil
    );
  } catch (error) {
    console.error('Erro no login Google:', error);
    const statusCode = (error as any).statusCode || 500;
    const message = (error as any).message || 'Erro interno do servidor';
    res.status(statusCode).json({ error: message });
  }
};

// Solicitar acesso ao sistema
export const requestAccess = async (req: Request, res: Response) => {
  try {
    const { email, nome, justificativa } = req.body;

    if (!email || !nome) {
      throw createError('Email e nome são obrigatórios', 400);
    }

    // Verificar se usuário já existe
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw createError('Usuário já cadastrado no sistema', 409);
    }

    // Criar usuário inativo
    const result = await pool.query(
      `INSERT INTO users (email, nome, perfil, ativo, paginas_permitidas, acoes_permitidas) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, nome, perfil, ativo, created_at`,
      [email, nome, 'usuario', false, ['dashboard', 'processos', 'relatorios', 'painel-publico'], ['ver_estatisticas', 'editar']]
    );

    res.status(201).json({
      message: 'Solicitação de acesso enviada com sucesso',
      user: result.rows[0],
      info: 'Aguarde a aprovação do administrador para acessar o sistema',
    });
  } catch (error) {
    console.error('Erro ao solicitar acesso:', error);
    const statusCode = (error as any).statusCode || 500;
    const message = (error as any).message || 'Erro interno do servidor';
    res.status(statusCode).json({ error: message });
  }
};

// Verificar token atual
export const verifyToken = async (req: Request, res: Response) => {
  try {
    // O middleware de autenticação já verificou o token
    const user = (req as any).user;

    // Buscar nome do responsável se o usuário for um responsável
    let nome_responsavel = null;
    if (user.perfil === 'usuario') {
      const responsavelResult = await pool.query(
        'SELECT nome_responsavel FROM responsaveis WHERE email = $1',
        [user.email]
      );
      if (responsavelResult.rows.length > 0) {
        nome_responsavel = responsavelResult.rows[0].nome_responsavel;
      }
    }

    // Remover informações sensíveis
    const userResponse = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      perfil: user.perfil,
      paginas_permitidas: user.paginas_permitidas,
      acoes_permitidas: user.acoes_permitidas,
      ativo: user.ativo,
      created_at: user.created_at,
      updated_at: user.updated_at,
      nome_responsavel
    };

    res.json({
      valid: true,
      user: userResponse,
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    // Tentar extrair informações do usuário se disponível
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const refreshToken = req.cookies?.refresh_token;
    
    let userEmail = null;
    let userPerfil = null;
    
    // Se há token, tentar decodificar para tracking (opcional)
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
        const userResult = await pool.query('SELECT email, perfil FROM users WHERE id = $1', [decoded.userId]);
        if (userResult.rows.length > 0) {
          userEmail = userResult.rows[0].email;
          userPerfil = userResult.rows[0].perfil;
        }
      } catch (jwtError) {
        // Token inválido, mas logout deve continuar
        console.log('Token inválido no logout, continuando...');
      }
    }

    // Tracking: Logout (apenas se conseguimos identificar o usuário)
    if (userEmail) {
      await trackAuthEvent(
        userEmail, 
        'logout', 
        req.ip || req.connection?.remoteAddress, 
        req.get('User-Agent'),
        userPerfil
      );
    }

    // Sempre limpar cookie de refresh (principal objetivo do logout)
    res.clearCookie('refresh_token', { path: '/' });

    res.json({
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    // Mesmo com erro, limpar o cookie
    res.clearCookie('refresh_token', { path: '/' });
    res.status(200).json({ message: 'Logout realizado (com limitações)' });
  }
};

// Verificar token e renovar se necessário
export const verifyAndRefreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    // Buscar dados completos do usuário
    const result = await pool.query(
      `SELECT u.*, 
              COALESCE(r.nome_responsavel, u.nome) as nome_responsavel,
              r.id as responsavel_id
       FROM users u
       LEFT JOIN responsaveis r ON u.email = r.email
       WHERE u.id = $1 AND u.ativo = true`,
      [user.id]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    const fullUser = result.rows[0];

    // Verificar se o token atual está próximo do vencimento
    const authHeader = req.headers.authorization;
    let newToken = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3 && tokenParts[1]) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const currentTime = Date.now() / 1000;
            const timeUntilExpiry = payload.exp - currentTime;
            
            // Se expira em menos de 1 hora, gerar novo token
            if (timeUntilExpiry < 3600) {
              newToken = generateToken(fullUser.id, fullUser.perfil);
            }
          }
        } catch (error) {
          console.log('Erro ao decodificar token para renovação:', error);
        }
      }
    }

    // Rotacionar refresh token para manter sessão ativa por mais 8 horas
    try {
      const rotated = generateRefreshToken(fullUser.id);
      res.cookie('refresh_token', rotated, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: parseInt(process.env.JWT_REFRESH_MAX_AGE_MS || String(8 * 60 * 60 * 1000), 10),
        path: '/'
      });
    } catch (err) {
      console.error('Erro ao rotacionar refresh token:', err);
    }

    res.json({
      user: {
        id: fullUser.id,
        email: fullUser.email,
        nome: fullUser.nome,
        perfil: fullUser.perfil,
        paginas_permitidas: fullUser.paginas_permitidas,
        acoes_permitidas: fullUser.acoes_permitidas || [],
        ativo: fullUser.ativo,
        nome_responsavel: fullUser.nome_responsavel,
        responsavel_id: fullUser.responsavel_id
      },
      ...(newToken && { newToken })
    });
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Redefinir senha com token
export const redefinirSenha = async (req: AuthRequest, res: Response) => {
  try {
    const { token, novaSenha } = req.body;
    
    if (!token || !novaSenha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }
    
    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    // Buscar usuário pelo token
    const result = await pool.query(
      `SELECT * FROM users 
       WHERE reset_token = $1 
       AND reset_token_expires > NOW()`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const user = result.rows[0];

    // Gerar hash da nova senha
    const hash = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha e limpar token
    await pool.query(
      `UPDATE users 
       SET senha = $1, 
           reset_token = NULL, 
           reset_token_expires = NULL, 
           primeiro_acesso = FALSE, 
           updated_at = NOW() 
       WHERE id = $2`,
      [hash, user.id]
    );

    return res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
}; 
