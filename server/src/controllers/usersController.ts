import { Response } from 'express';
import pool from '../database/connection';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

// Listar todos os usuários
export const listarUsuarios = async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT 
        id,
        email,
        nome,
        perfil,
        paginas_permitidas,
        acoes_permitidas,
        ativo,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    throw createError('Erro ao carregar usuários', 500);
  }
};

// Buscar usuário por ID
export const buscarUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id,
        email,
        nome,
        perfil,
        paginas_permitidas,
        acoes_permitidas,
        ativo,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw createError('Erro ao buscar usuário', 500);
  }
};

// Criar novo usuário
export const criarUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { email, nome, perfil = 'usuario', paginas_permitidas = ['dashboard', 'processos', 'relatorios'], acoes_permitidas = ['ver_estatisticas', 'editar'], ativo = true, senha } = req.body;

    // Validações
    if (!email || !nome) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios' });
    }

    // Verificar se email já existe
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    // Se for admin, dar acesso total
    const paginasFinais = perfil === 'admin' 
      ? ['dashboard', 'processos', 'relatorios', 'modalidades', 'unidades-gestoras', 'responsaveis', 'situacoes', 'equipe-apoio', 'usuarios']
      : paginas_permitidas;

    // Se for admin, dar todas as ações permitidas
    const acoesFinais = perfil === 'admin' 
      ? ['ver_estatisticas', 'editar', 'excluir']
      : acoes_permitidas;

    // Gerar hash da senha
    const senhaParaHash = senha || 'cd1526';
    const hash = await bcrypt.hash(senhaParaHash, 10);

    const query = `
      INSERT INTO users (email, nome, perfil, paginas_permitidas, acoes_permitidas, ativo, senha)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, nome, perfil, paginas_permitidas, acoes_permitidas, ativo, created_at, updated_at
    `;

    const result = await pool.query(query, [email, nome, perfil, paginasFinais, acoesFinais, ativo, hash]);

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email já está em uso' });
    }
    throw createError('Erro ao criar usuário', 500);
  }
};

// Atualizar usuário
export const atualizarUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, nome, perfil, paginas_permitidas, acoes_permitidas, ativo } = req.body;

    // Verificar se usuário existe
    const existingUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se for admin, dar acesso total
    const paginasFinais = perfil === 'admin' 
      ? ['dashboard', 'processos', 'relatorios', 'modalidades', 'unidades-gestoras', 'responsaveis', 'situacoes', 'equipe-apoio', 'usuarios']
      : paginas_permitidas;

    // Se for admin, dar todas as ações permitidas
    const acoesFinais = perfil === 'admin' 
      ? ['ver_estatisticas', 'editar', 'excluir']
      : acoes_permitidas;

    const query = `
      UPDATE users 
      SET 
        nome = COALESCE($2, nome),
        perfil = COALESCE($3, perfil),
        paginas_permitidas = COALESCE($4, paginas_permitidas),
        acoes_permitidas = COALESCE($5, acoes_permitidas),
        ativo = COALESCE($6, ativo),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, nome, perfil, paginas_permitidas, acoes_permitidas, ativo, created_at, updated_at
    `;

    const result = await pool.query(query, [id, nome, perfil, paginasFinais, acoesFinais, ativo]);

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw createError('Erro ao atualizar usuário', 500);
  }
};

// Excluir usuário
export const excluirUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const existingUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Não permitir excluir o próprio usuário
    if (req.user && req.user.id === parseInt(id || '0')) {
      return res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
    }

    // Verificar se é o último admin
    if (existingUser.rows[0].perfil === 'admin') {
      const adminCount = await pool.query('SELECT COUNT(*) FROM users WHERE perfil = $1 AND ativo = true', ['admin']);
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Não é possível excluir o último administrador ativo' });
      }
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    return res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    throw createError('Erro ao excluir usuário', 500);
  }
};

// Alterar senha do próprio usuário
export const alterarSenha = async (req: AuthRequest, res: Response) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    // Validações
    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    // Buscar usuário atual
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user?.id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senhaAtual, user.rows[0].senha || '');
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Gerar hash da nova senha
    const hash = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha
    await pool.query(
      'UPDATE users SET senha = $1, updated_at = NOW() WHERE id = $2',
      [hash, req.user?.id]
    );

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({ error: 'Erro interno ao alterar a senha' });
  }
};

// Estatísticas dos usuários
export const estatisticasUsuarios = async (req: AuthRequest, res: Response) => {
  try {
    const queries = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM users'),
      pool.query('SELECT COUNT(*) as total FROM users WHERE perfil = $1', ['admin']),
      pool.query('SELECT COUNT(*) as total FROM users WHERE perfil = $1', ['usuario']),
      pool.query('SELECT COUNT(*) as total FROM users WHERE ativo = true'),
      pool.query('SELECT COUNT(*) as total FROM users WHERE ativo = false'),
      pool.query(`
        SELECT 
          perfil,
          COUNT(*) as total,
          COUNT(CASE WHEN ativo = true THEN 1 END) as ativos
        FROM users 
        GROUP BY perfil
      `),
      pool.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as mes,
          COUNT(*) as novos_usuarios
        FROM users 
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY mes ASC
      `)
    ]);

    const stats = {
      total_usuarios: parseInt(queries[0].rows[0].total),
      total_admins: parseInt(queries[1].rows[0].total),
      total_usuarios_comuns: parseInt(queries[2].rows[0].total),
      usuarios_ativos: parseInt(queries[3].rows[0].total),
      usuarios_inativos: parseInt(queries[4].rows[0].total),
      por_perfil: queries[5].rows,
      evolucao_mensal: queries[6].rows.map(row => ({
        mes: row.mes,
        novos_usuarios: parseInt(row.novos_usuarios)
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas dos usuários:', error);
    throw createError('Erro ao carregar estatísticas dos usuários', 500);
  }
};

// Sincronizar usuários com responsáveis
export const sincronizarComResponsaveis = async (req: AuthRequest, res: Response) => {
  try {
    // Buscar responsáveis que têm email e não estão na tabela users
    const query = `
      INSERT INTO users (email, nome, perfil, paginas_permitidas, ativo)
      SELECT 
        r.email,
        r.nome_responsavel,
        'usuario',
        ARRAY['dashboard', 'processos', 'relatorios'],
        r.ativo
      FROM responsaveis r 
      WHERE r.email IS NOT NULL 
        AND r.email != '' 
        AND NOT EXISTS (
          SELECT 1 FROM users u WHERE u.email = r.email
        )
      RETURNING id, email, nome
    `;

    const result = await pool.query(query);

    res.json({
      message: `${result.rows.length} usuários sincronizados com sucesso`,
      usuarios_criados: result.rows
    });
  } catch (error) {
    console.error('Erro ao sincronizar usuários:', error);
    throw createError('Erro ao sincronizar usuários com responsáveis', 500);
  }
}; 

// Definir primeira senha (primeiro acesso)
export const definirPrimeiraSenha = async (req: AuthRequest, res: Response) => {
  try {
    const { email, novaSenha } = req.body;
    if (!email || !novaSenha) {
      return res.status(400).json({ error: 'Email e nova senha são obrigatórios' });
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }
    // Buscar usuário
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const user = result.rows[0];
    if (!user.ativo) {
      return res.status(403).json({ error: 'Usuário inativo. Entre em contato com o administrador.' });
    }
    if (!user.paginas_permitidas || user.paginas_permitidas.length === 0) {
      return res.status(403).json({ error: 'Usuário sem páginas permitidas.' });
    }
    if (user.senha) {
      return res.status(400).json({ error: 'Usuário já possui senha definida.' });
    }
    // Definir senha
    const hash = await bcrypt.hash(novaSenha, 10);
    await pool.query('UPDATE users SET senha = $1, updated_at = NOW() WHERE id = $2', [hash, user.id]);
    return res.json({ message: 'Senha definida com sucesso. Você já pode acessar o sistema.' });
  } catch (error) {
    console.error('Erro ao definir primeira senha:', error);
    return res.status(500).json({ error: 'Erro ao definir senha.' });
  }
};

// Solicitar redefinição de senha
export const solicitarRedefinicaoSenha = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se o usuário existe
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Por segurança, não informamos se o email existe ou não
      return res.json({ 
        message: 'Se o e-mail estiver cadastrado, as instruções para redefinir a senha serão enviadas.' 
      });
    }

    const user = result.rows[0];
    
    if (!user.ativo) {
      return res.status(403).json({ 
        error: 'Usuário inativo. Entre em contato com o administrador.' 
      });
    }

    // Gerar token de redefinição (válido por 1 hora)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Salvar token no banco
    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expires = $2, updated_at = NOW() 
       WHERE id = $3`,
      [resetToken, expiresAt, user.id]
    );

    // Em produção, aqui seria enviado um email com o link de redefinição
    // Por enquanto, vamos retornar o token para testes
    console.log(`Token de redefinição para ${email}: ${resetToken}`);

    return res.json({ 
      message: 'Se o e-mail estiver cadastrado, as instruções para redefinir a senha serão enviadas.',
      // Em produção, remover esta linha:
      resetToken: resetToken // Apenas para desenvolvimento/testes
    });
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    return res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
};

export const gerarTokenResetAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Gerar token de redefinição (válido por 1 hora)
    const resetToken = Math.random().toString(36).substring(2, 12).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Salvar token no banco para o usuário específico
    const result = await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expires = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING email`,
      [resetToken, expiresAt, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    console.log(`Token de redefinição gerado para ${result.rows[0].email} pelo admin ${req.user?.nome}: ${resetToken}`);

    // Retornar o token para o admin
    return res.json({ token: resetToken });
  } catch (error) {
    console.error('Erro ao gerar token de redefinição pelo admin:', error);
    return res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
};
