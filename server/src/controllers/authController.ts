import { Request, Response } from 'express';
import pool from '../database/connection';
import { generateToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import bcrypt from 'bcrypt';
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
      
      // Gerar JWT token
      const jwtToken = generateToken(updatedUser.id);

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
        req.get('User-Agent')
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

    // Gerar JWT token
    const jwtToken = generateToken(user.id);

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
      message: 'Login realizado com sucesso',
      user: userResponse,
      token: jwtToken,
    });

    // Tracking: Login bem-sucedido
    await trackAuthEvent(
      user.email, 
      'login_success', 
      req.ip || req.connection?.remoteAddress, 
      req.get('User-Agent')
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

    // Gerar JWT token
    const jwtToken = generateToken(user.id);

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
      message: 'Login realizado com sucesso',
      user: userResponse,
      token: jwtToken,
    });

    // Tracking: Login Google bem-sucedido
    await trackAuthEvent(
      user.email, 
      'login_success', 
      req.ip || req.connection?.remoteAddress, 
      req.get('User-Agent')
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
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    // Tracking: Logout
    if (req.user?.email) {
      await trackAuthEvent(
        req.user.email, 
        'logout', 
        req.ip || req.connection?.remoteAddress, 
        req.get('User-Agent')
      );
    }

    res.json({
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro no logout:', error);
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