import { Request, Response } from 'express';
import pool from '../database/connection';
import { EquipeApoio } from '../types';

// Listar membros da equipe com filtros e paginação
export const listarEquipeApoio = async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      ativo, 
      page = 1, 
      limit = 10, 
      sort = 'primeiro_nome', 
      order = 'asc' 
    } = req.query;

    let baseQuery = `
      SELECT id, primeiro_nome, nome_apoio, email, telefone, ativo, 
             created_at, updated_at
      FROM equipe_apoio
    `;

    let countQuery = `SELECT COUNT(*) as total FROM equipe_apoio`;
    const queryParams: any[] = [];
    const conditions: string[] = [];

    // Filtro por busca textual
    if (search) {
      conditions.push(`(primeiro_nome ILIKE $${queryParams.length + 1} OR nome_apoio ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }

    // Filtro por status ativo
    if (ativo !== undefined) {
      conditions.push(`ativo = $${queryParams.length + 1}`);
      queryParams.push(ativo === 'true');
    }

    // Aplicar condições
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    // Ordenação
    const validSortFields = ['primeiro_nome', 'nome_apoio', 'email', 'created_at'];
    const sortField = validSortFields.includes(sort as string) ? sort : 'primeiro_nome';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
    baseQuery += ` ORDER BY ${sortField} ${sortOrder}`;

    // Paginação
    const offset = (Number(page) - 1) * Number(limit);
    baseQuery += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(Number(limit), offset);

    // Executar queries
    const [dataResult, countResult] = await Promise.all([
      pool.query(baseQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit e offset do count
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      data: dataResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Erro ao listar equipe de apoio:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar membro da equipe por ID
export const buscarMembroEquipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = `SELECT id, primeiro_nome, nome_apoio, email, telefone, ativo, created_at, updated_at FROM equipe_apoio WHERE id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Membro da equipe não encontrado' });
      return;
    }
    res.json({ data: result.rows[0] });
    return;
  } catch (error) {
    console.error('Erro ao buscar membro da equipe:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Criar novo membro da equipe
export const criarMembroEquipe = async (req: Request, res: Response) => {
  try {
    const { primeiro_nome, nome_apoio, email, telefone } = req.body;
    if (!primeiro_nome?.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Primeiro nome é obrigatório' });
      return;
    }
    if (!nome_apoio?.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Nome completo é obrigatório' });
      return;
    }
    if (email?.trim()) {
      const emailCheck = await pool.query('SELECT id FROM equipe_apoio WHERE email = $1', [email.trim().toLowerCase()]);
      if (emailCheck.rows.length > 0) {
        res.status(400).json({ error: 'DUPLICATE_ERROR', message: 'Email já está em uso por outro membro' });
        return;
      }
    }
    const query = `INSERT INTO equipe_apoio (primeiro_nome, nome_apoio, email, telefone) VALUES ($1, $2, $3, $4) RETURNING id, primeiro_nome, nome_apoio, email, telefone, ativo, created_at, updated_at`;
    const result = await pool.query(query, [primeiro_nome.trim(), nome_apoio.trim(), email?.trim().toLowerCase() || null, telefone?.trim() || null]);
    res.status(201).json({ data: result.rows[0], message: 'Membro da equipe criado com sucesso' });
    return;
  } catch (error) {
    console.error('Erro ao criar membro da equipe:', error);
    if ((error as any).code === '23505') {
      res.status(400).json({ error: 'DUPLICATE_ERROR', message: 'Email já existe' });
      return;
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Atualizar membro da equipe
export const atualizarMembroEquipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { primeiro_nome, nome_apoio, email, telefone, ativo } = req.body;
    if (!primeiro_nome?.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Primeiro nome é obrigatório' });
      return;
    }
    if (!nome_apoio?.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Nome completo é obrigatório' });
      return;
    }
    const checkQuery = 'SELECT id FROM equipe_apoio WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Membro da equipe não encontrado' });
      return;
    }
    if (email?.trim()) {
      const emailCheck = await pool.query('SELECT id FROM equipe_apoio WHERE email = $1 AND id != $2', [email.trim().toLowerCase(), id]);
      if (emailCheck.rows.length > 0) {
        res.status(400).json({ error: 'DUPLICATE_ERROR', message: 'Email já está em uso por outro membro' });
        return;
      }
    }
    const query = `UPDATE equipe_apoio SET primeiro_nome = $1, nome_apoio = $2, email = $3, telefone = $4, ativo = $5 WHERE id = $6 RETURNING id, primeiro_nome, nome_apoio, email, telefone, ativo, created_at, updated_at`;
    const result = await pool.query(query, [primeiro_nome.trim(), nome_apoio.trim(), email?.trim().toLowerCase() || null, telefone?.trim() || null, ativo !== undefined ? ativo : true, id]);
    res.json({ data: result.rows[0], message: 'Membro da equipe atualizado com sucesso' });
    return;
  } catch (error) {
    console.error('Erro ao atualizar membro da equipe:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Excluir membro da equipe
export const excluirMembroEquipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checkQuery = 'SELECT id FROM equipe_apoio WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Membro da equipe não encontrado' });
      return;
    }
    await pool.query('DELETE FROM equipe_apoio WHERE id = $1', [id]);
    res.json({ message: 'Membro da equipe excluído com sucesso' });
    return;
  } catch (error) {
    console.error('Erro ao excluir membro da equipe:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Estatísticas da equipe de apoio
export const estatisticasEquipeApoio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        ea.id,
        ea.primeiro_nome,
        ea.nome_apoio,
        ea.email,
        ea.ativo,
        COUNT(pea.processo_id) as total_processos_apoiados,
        COALESCE(AVG(p.valor_estimado), 0) as valor_medio_processos,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_processos
      FROM equipe_apoio ea
      LEFT JOIN processos_equipe_apoio pea ON ea.id = pea.equipe_apoio_id
      LEFT JOIN processos p ON pea.processo_id = p.id
      WHERE ea.id = $1
      GROUP BY ea.id, ea.primeiro_nome, ea.nome_apoio, ea.email, ea.ativo
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      // Se não existe a tabela de relacionamento ainda, retornar estatísticas básicas
      const basicQuery = `
        SELECT id, primeiro_nome, nome_apoio, email, ativo, created_at
        FROM equipe_apoio WHERE id = $1
      `;
      
      const basicResult = await pool.query(basicQuery, [id]);
      
      if (basicResult.rows.length === 0) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Membro da equipe não encontrado'
        });
      }

      const member = basicResult.rows[0];
      const stats = {
        ...member,
        total_processos_apoiados: 0,
        valor_medio_processos: 0,
        valor_total_processos: 0,
        dias_desde_cadastro: Math.floor((Date.now() - new Date(member.created_at).getTime()) / (1000 * 60 * 60 * 24))
      };

      return res.json({ data: stats });
    }

    const stats = result.rows[0];
    
    // Converter strings para números
    stats.total_processos_apoiados = parseInt(stats.total_processos_apoiados);
    stats.valor_medio_processos = parseFloat(stats.valor_medio_processos);
    stats.valor_total_processos = parseFloat(stats.valor_total_processos);

    res.json({ data: stats });
    return;
  } catch (error) {
    console.error('Erro ao buscar estatísticas da equipe de apoio:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    });
    return;
  }
}; 