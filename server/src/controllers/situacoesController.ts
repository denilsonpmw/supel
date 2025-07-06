import { Request, Response } from 'express';
import pool from '../database/connection';
import { Situacao } from '../types';

// Listar situações com filtros e paginação
export const listarSituacoes = async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      ativo, 
      finalizadora,
      page = 1, 
      limit = 10, 
      sort = 'nome_situacao', 
      order = 'asc' 
    } = req.query;

    let baseQuery = `
      SELECT id, nome_situacao, descricao_situacao, eh_finalizadora, cor_hex, ativo, 
             created_at, updated_at
      FROM situacoes
    `;

    let countQuery = `SELECT COUNT(*) as total FROM situacoes`;
    const queryParams: any[] = [];
    const conditions: string[] = [];

    // Filtro por busca textual
    if (search) {
      conditions.push(`(nome_situacao ILIKE $${queryParams.length + 1} OR descricao_situacao ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }

    // Filtro por status ativo
    if (ativo !== undefined) {
      conditions.push(`ativo = $${queryParams.length + 1}`);
      queryParams.push(ativo === 'true');
    }

    // Filtro por situação finalizadora
    if (finalizadora !== undefined) {
      conditions.push(`eh_finalizadora = $${queryParams.length + 1}`);
      queryParams.push(finalizadora === 'true');
    }

    // Aplicar condições
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    // Ordenação
    const validSortFields = ['nome_situacao', 'eh_finalizadora', 'created_at'];
    const sortField = validSortFields.includes(sort as string) ? sort : 'nome_situacao';
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
    console.error('Erro ao listar situações:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar situação por ID
export const buscarSituacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = `SELECT id, nome_situacao, descricao_situacao, eh_finalizadora, cor_hex, ativo, created_at, updated_at FROM situacoes WHERE id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Situação não encontrada' });
      return;
    }
    res.json({ data: result.rows[0] });
    return;
  } catch (error) {
    console.error('Erro ao buscar situação:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Criar nova situação
export const criarSituacao = async (req: Request, res: Response) => {
  try {
    const { nome_situacao, descricao_situacao, eh_finalizadora, cor_hex } = req.body;
    if (!nome_situacao?.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Nome da situação é obrigatório' });
      return;
    }
    const duplicateCheck = await pool.query('SELECT id FROM situacoes WHERE nome_situacao = $1', [nome_situacao.trim()]);
    if (duplicateCheck.rows.length > 0) {
      res.status(400).json({ error: 'DUPLICATE_ERROR', message: 'Já existe uma situação com este nome' });
      return;
    }
    const query = `INSERT INTO situacoes (nome_situacao, descricao_situacao, eh_finalizadora, cor_hex) VALUES ($1, $2, $3, $4) RETURNING id, nome_situacao, descricao_situacao, eh_finalizadora, cor_hex, ativo, created_at, updated_at`;
    const result = await pool.query(query, [nome_situacao.trim(), descricao_situacao?.trim() || null, eh_finalizadora || false, cor_hex || '#3498db']);
    res.status(201).json({ data: result.rows[0], message: 'Situação criada com sucesso' });
    return;
  } catch (error) {
    console.error('Erro ao criar situação:', error);
    if ((error as any).code === '23505') {
      res.status(400).json({ error: 'DUPLICATE_ERROR', message: 'Situação já existe' });
      return;
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Atualizar situação
export const atualizarSituacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome_situacao, descricao_situacao, eh_finalizadora, cor_hex, ativo } = req.body;
    if (!nome_situacao?.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Nome da situação é obrigatório' });
      return;
    }
    const checkQuery = 'SELECT id FROM situacoes WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Situação não encontrada' });
      return;
    }
    const duplicateCheck = await pool.query('SELECT id FROM situacoes WHERE nome_situacao = $1 AND id != $2', [nome_situacao.trim(), id]);
    if (duplicateCheck.rows.length > 0) {
      res.status(400).json({ error: 'DUPLICATE_ERROR', message: 'Já existe uma situação com este nome' });
      return;
    }
    const query = `UPDATE situacoes SET nome_situacao = $1, descricao_situacao = $2, eh_finalizadora = $3, cor_hex = $4, ativo = $5 WHERE id = $6 RETURNING id, nome_situacao, descricao_situacao, eh_finalizadora, cor_hex, ativo, created_at, updated_at`;
    const result = await pool.query(query, [nome_situacao.trim(), descricao_situacao?.trim() || null, eh_finalizadora || false, cor_hex || '#3498db', ativo !== undefined ? ativo : true, id]);
    res.json({ data: result.rows[0], message: 'Situação atualizada com sucesso' });
    return;
  } catch (error) {
    console.error('Erro ao atualizar situação:', error);
    if ((error as any).code === '23505') {
      res.status(400).json({ error: 'DUPLICATE_ERROR', message: 'Situação já existe' });
      return;
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Excluir situação
export const excluirSituacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checkQuery = 'SELECT id FROM situacoes WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Situação não encontrada' });
      return;
    }
    await pool.query('DELETE FROM situacoes WHERE id = $1', [id]);
    res.json({ message: 'Situação excluída com sucesso' });
    return;
  } catch (error) {
    console.error('Erro ao excluir situação:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Estatísticas da situação
export const estatisticasSituacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        s.id,
        s.nome_situacao,
        s.eh_finalizadora,
        s.cor_hex,
        COUNT(p.id) as total_processos,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_estimado,
        COALESCE(SUM(p.valor_realizado), 0) as valor_total_realizado,
        COALESCE(AVG(p.valor_estimado), 0) as valor_medio_estimado,
        COALESCE(AVG(CURRENT_DATE - p.data_situacao), 0) as tempo_medio_dias
      FROM situacoes s
      LEFT JOIN processos p ON s.id = p.situacao_id
      WHERE s.id = $1
      GROUP BY s.id, s.nome_situacao, s.eh_finalizadora, s.cor_hex
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Situação não encontrada'
      });
    }

    const stats = result.rows[0];
    
    // Converter strings para números
    stats.total_processos = parseInt(stats.total_processos);
    stats.valor_total_estimado = parseFloat(stats.valor_total_estimado);
    stats.valor_total_realizado = parseFloat(stats.valor_total_realizado);
    stats.valor_medio_estimado = parseFloat(stats.valor_medio_estimado);
    stats.tempo_medio_dias = parseFloat(stats.tempo_medio_dias);

    res.json({ data: stats });
    return;
  } catch (error) {
    console.error('Erro ao buscar estatísticas da situação:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    });
    return;
  }
};

// Listar todas as situações (sem filtros, para auditoria)
export const listarTodasSituacoes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, nome_situacao, descricao_situacao, eh_finalizadora, cor_hex, ativo, created_at, updated_at FROM situacoes ORDER BY id');
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erro ao listar todas as situações:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
  }
}; 