import { Request, Response } from 'express';
import pool from '../database/connection';
import { Responsavel } from '../types';
import { AuthRequest } from '../middleware/auth';

// Listar responsáveis com filtros e paginação
export const listarResponsaveis = async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      ativo, 
      page = 1, 
      limit = 10, 
      sort = 'nome_responsavel', 
      order = 'asc' 
    } = req.query;

    let baseQuery = `
      SELECT id, primeiro_nome, nome_responsavel, email, telefone, ativo, 
             created_at, updated_at
      FROM responsaveis
    `;

    let countQuery = `SELECT COUNT(*) as total FROM responsaveis`;
    const queryParams: any[] = [];
    const conditions: string[] = [];

    // Filtro por busca textual
    if (search) {
      conditions.push(`(nome_responsavel ILIKE $${queryParams.length + 1} OR primeiro_nome ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1})`);
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
    const validSortFields = ['nome_responsavel', 'primeiro_nome', 'email', 'created_at'];
    const sortField = validSortFields.includes(sort as string) ? sort : 'nome_responsavel';
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
    console.error('Erro ao listar responsáveis:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar responsável por ID
export const buscarResponsavel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = `SELECT id, primeiro_nome, nome_responsavel, email, telefone, ativo, created_at, updated_at FROM responsaveis WHERE id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Responsável não encontrado' });
      return;
    }
    res.json({ data: result.rows[0] });
    return;
  } catch (error) {
    console.error('Erro ao buscar responsável:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Criar novo responsável
export const criarResponsavel = async (req: Request, res: Response) => {
  try {
    const { primeiro_nome, nome_responsavel, email, telefone } = req.body;
    if (!primeiro_nome?.trim() || !nome_responsavel?.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Primeiro nome e nome completo são obrigatórios' });
      return;
    }
    if (email) {
      const emailCheck = await pool.query('SELECT id FROM responsaveis WHERE email = $1 AND id != $2', [email, 0]);
      if (emailCheck.rows.length > 0) {
        res.status(400).json({ error: 'DUPLICATE_EMAIL', message: 'Já existe um responsável com este email' });
        return;
      }
    }
    const query = `INSERT INTO responsaveis (primeiro_nome, nome_responsavel, email, telefone) VALUES ($1, $2, $3, $4) RETURNING id, primeiro_nome, nome_responsavel, email, telefone, ativo, created_at, updated_at`;
    const result = await pool.query(query, [primeiro_nome.trim(), nome_responsavel.trim(), email?.trim() || null, telefone?.trim() || null]);
    res.status(201).json({ data: result.rows[0], message: 'Responsável criado com sucesso' });
    return;
  } catch (error) {
    console.error('Erro ao criar responsável:', error);
    if ((error as any).code === '23505') {
      res.status(400).json({ error: 'DUPLICATE_ERROR', message: 'Responsável já existe' });
      return;
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Atualizar responsável
export const atualizarResponsavel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { primeiro_nome, nome_responsavel, email, telefone, ativo } = req.body;
    if (!primeiro_nome?.trim() || !nome_responsavel?.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Primeiro nome e nome completo são obrigatórios' });
      return;
    }
    const checkQuery = 'SELECT id FROM responsaveis WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Responsável não encontrado' });
      return;
    }
    if (email) {
      const emailCheck = await pool.query('SELECT id FROM responsaveis WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        res.status(400).json({ error: 'DUPLICATE_EMAIL', message: 'Já existe um responsável com este email' });
        return;
      }
    }
    const query = `UPDATE responsaveis SET primeiro_nome = $1, nome_responsavel = $2, email = $3, telefone = $4, ativo = $5 WHERE id = $6 RETURNING id, primeiro_nome, nome_responsavel, email, telefone, ativo, created_at, updated_at`;
    const result = await pool.query(query, [primeiro_nome.trim(), nome_responsavel.trim(), email?.trim() || null, telefone?.trim() || null, ativo !== undefined ? ativo : true, id]);
    res.json({ data: result.rows[0], message: 'Responsável atualizado com sucesso' });
    return;
  } catch (error) {
    console.error('Erro ao atualizar responsável:', error);
    if ((error as any).code === '23505') {
      res.status(400).json({ error: 'DUPLICATE_ERROR', message: 'Dados duplicados' });
      return;
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Excluir responsável
export const excluirResponsavel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checkQuery = 'SELECT id FROM responsaveis WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Responsável não encontrado' });
      return;
    }
    await pool.query('DELETE FROM responsaveis WHERE id = $1', [id]);
    res.json({ message: 'Responsável excluído com sucesso' });
    return;
  } catch (error) {
    console.error('Erro ao excluir responsável:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Estatísticas do responsável
export const estatisticasResponsavel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        r.id,
        r.primeiro_nome,
        r.nome_responsavel,
        COUNT(p.id) as total_processos,
        COUNT(CASE WHEN s.eh_finalizadora = true THEN 1 END) as processos_concluidos,
        COUNT(CASE WHEN s.eh_finalizadora = false THEN 1 END) as processos_andamento,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_estimado,
        COALESCE(SUM(p.valor_realizado), 0) as valor_total_realizado,
        CASE 
          WHEN COUNT(p.id) > 0 THEN COALESCE(AVG(p.valor_estimado), 0)
          ELSE 0 
        END as valor_medio_estimado
      FROM responsaveis r
      LEFT JOIN processos p ON r.id = p.responsavel_id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
      WHERE r.id = $1
      GROUP BY r.id, r.primeiro_nome, r.nome_responsavel
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Responsável não encontrado' });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do responsável:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Análise de processos por responsável com dados por modalidade
export const analisePorResponsavel = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 [CONTADOR-RESPONSAVEIS] Análise por responsável - SEM FILTROS aplicados');
    
    const query = `
      SELECT 
        r.id,
        r.primeiro_nome,
        r.nome_responsavel,
        COUNT(p.id) as total_processos,
        COUNT(CASE WHEN s.eh_finalizadora = true THEN 1 END) as processos_concluidos,
        COUNT(CASE WHEN s.eh_finalizadora = false THEN 1 END) as processos_andamento,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_estimado,
        COALESCE(SUM(p.valor_realizado), 0) as valor_total_realizado,
        CASE 
          WHEN COUNT(p.id) > 0 THEN COALESCE(AVG(p.valor_estimado), 0)
          ELSE 0 
        END as valor_medio_estimado
      FROM responsaveis r
      LEFT JOIN processos p ON r.id = p.responsavel_id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
      WHERE r.ativo = true
      GROUP BY r.id, r.primeiro_nome, r.nome_responsavel
      HAVING COUNT(p.id) > 0
      ORDER BY COUNT(p.id) DESC
    `;

    const result = await pool.query(query);
    console.log('✅ [CONTADOR-RESPONSAVEIS] Análise encontrada:', result.rows.length, 'responsáveis');
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar análise por responsável:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Distribuição de processos por modalidade para um responsável específico
export const distribuicaoModalidadesPorResponsavel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log('🔍 [CONTADOR-RESPONSAVEIS] Modalidades por responsável ID:', id, '- SEM FILTROS aplicados');
    
    const query = `
      SELECT 
        m.id,
        m.sigla_modalidade as sigla,
        m.nome_modalidade as nome,
        m.cor_hex,
        COUNT(p.id) as total_processos,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_estimado,
        COALESCE(SUM(p.valor_realizado), 0) as valor_total_realizado
      FROM modalidades m
      LEFT JOIN processos p ON m.id = p.modalidade_id AND p.responsavel_id = $1
      GROUP BY m.id, m.sigla_modalidade, m.nome_modalidade, m.cor_hex
      HAVING COUNT(p.id) > 0
      ORDER BY COUNT(p.id) DESC
    `;

    const result = await pool.query(query, [id]);
    console.log('✅ [CONTADOR-RESPONSAVEIS] Modalidades do responsável encontradas:', result.rows.length);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar distribuição de modalidades por responsável:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Distribuição geral de processos por modalidade (todos os responsáveis)
export const distribuicaoModalidadesGeral = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 [CONTADOR-RESPONSAVEIS] Distribuição geral modalidades - SEM FILTROS aplicados');
    
    const query = `
      SELECT 
        m.id,
        m.sigla_modalidade as sigla,
        m.nome_modalidade as nome,
        m.cor_hex,
        COUNT(p.id) as total_processos,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_estimado,
        COALESCE(SUM(p.valor_realizado), 0) as valor_total_realizado
      FROM modalidades m
      LEFT JOIN processos p ON m.id = p.modalidade_id
      INNER JOIN responsaveis r ON p.responsavel_id = r.id AND r.ativo = true
      GROUP BY m.id, m.sigla_modalidade, m.nome_modalidade, m.cor_hex
      HAVING COUNT(p.id) > 0
      ORDER BY COUNT(p.id) DESC
    `;

    const result = await pool.query(query);
    console.log('✅ [CONTADOR-RESPONSAVEIS] Modalidades encontradas:', result.rows.length, 'modalidades');
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar distribuição geral de modalidades:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Evolução mensal de processos por responsável
export const evolucaoMensalPorResponsavel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log('🔍 [CONTADOR-RESPONSAVEIS] Evolução mensal por responsável ID:', id, '- SEM FILTROS aplicados');
    
    const query = `
      SELECT 
        DATE_TRUNC('month', p.data_entrada) as mes,
        COUNT(p.id) as total_processos,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_estimado,
        COALESCE(SUM(p.valor_realizado), 0) as valor_total_realizado
      FROM processos p
      WHERE p.responsavel_id = $1
        AND p.data_entrada >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year'
      GROUP BY DATE_TRUNC('month', p.data_entrada)
      ORDER BY mes ASC
    `;

    const result = await pool.query(query, [id]);
    
    // Formatar os dados para incluir meses sem processos
    const processedData = result.rows.map(row => ({
      mes: row.mes.toISOString().slice(0, 7), // YYYY-MM format
      total_processos: parseInt(row.total_processos),
      valor_total_estimado: parseFloat(row.valor_total_estimado) || 0,
      valor_total_realizado: parseFloat(row.valor_total_realizado) || 0
    }));

    console.log('✅ [CONTADOR-RESPONSAVEIS] Evolução do responsável encontrada:', processedData.length, 'meses');
    res.json({ data: processedData });
  } catch (error) {
    console.error('Erro ao buscar evolução mensal por responsável:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Evolução mensal geral (todos os responsáveis)
export const evolucaoMensalGeral = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 [CONTADOR-RESPONSAVEIS] Evolução mensal geral - SEM FILTROS aplicados');
    
    const query = `
      SELECT 
        DATE_TRUNC('month', p.data_entrada) as mes,
        COUNT(p.id) as total_processos,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_estimado,
        COALESCE(SUM(p.valor_realizado), 0) as valor_total_realizado
      FROM processos p
      INNER JOIN responsaveis r ON p.responsavel_id = r.id AND r.ativo = true
      WHERE p.data_entrada >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year'
      GROUP BY DATE_TRUNC('month', p.data_entrada)
      ORDER BY mes ASC
    `;

    const result = await pool.query(query);
    
    // Formatar os dados
    const processedData = result.rows.map(row => ({
      mes: row.mes.toISOString().slice(0, 7), // YYYY-MM format
      total_processos: parseInt(row.total_processos),
      valor_total_estimado: parseFloat(row.valor_total_estimado) || 0,
      valor_total_realizado: parseFloat(row.valor_total_realizado) || 0
    }));

    console.log('✅ [CONTADOR-RESPONSAVEIS] Evolução encontrada:', processedData.length, 'meses');
    res.json({ data: processedData });
  } catch (error) {
    console.error('Erro ao buscar evolução mensal geral:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
    return;
  }
};

// Evolução mensal de processos por responsável
export const evolucaoMensalResponsavel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ano = new Date().getFullYear() } = req.query;

    const query = `
      SELECT 
        DATE_TRUNC('month', p.data_abertura) as mes,
        TO_CHAR(DATE_TRUNC('month', p.data_abertura), 'MM/YYYY') as mes_formatado,
        COUNT(p.id) as total_processos,
        COUNT(CASE WHEN p.conclusao = true THEN 1 END) as processos_concluidos,
        COUNT(CASE WHEN p.conclusao = false THEN 1 END) as processos_andamento,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_estimado,
        COALESCE(SUM(p.valor_realizado), 0) as valor_total_realizado
      FROM processos p
      WHERE p.responsavel_id = $1 
        AND EXTRACT(YEAR FROM p.data_abertura) = $2
      GROUP BY DATE_TRUNC('month', p.data_abertura)
      ORDER BY mes
    `;

    const result = await pool.query(query, [id, ano]);
    
    const evolutionData = result.rows.map(row => ({
      mes: row.mes_formatado,
      total_processos: parseInt(row.total_processos),
      processos_concluidos: parseInt(row.processos_concluidos),
      processos_andamento: parseInt(row.processos_andamento),
      valor_total_estimado: parseFloat(row.valor_total_estimado),
      valor_total_realizado: parseFloat(row.valor_total_realizado)
    }));

    res.json({ data: evolutionData });
    return;
  } catch (error) {
    console.error('Erro ao buscar evolução mensal do responsável:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    });
    return;
  }
};

// Ranking de responsáveis por modalidade
export const rankingPorModalidade = async (req: Request, res: Response) => {
  try {
    const { modalidadeId } = req.params;
    const { ano = new Date().getFullYear() } = req.query;

    const query = `
      SELECT 
        r.id,
        r.primeiro_nome,
        r.nome_responsavel,
        m.sigla_modalidade as modalidade_sigla,
        m.nome_modalidade as modalidade_nome,
        m.cor_hex as modalidade_cor,
        COUNT(p.id) as total_processos,
        COUNT(CASE WHEN p.conclusao = true THEN 1 END) as processos_concluidos,
        COUNT(CASE WHEN p.conclusao = false THEN 1 END) as processos_andamento,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_estimado,
        COALESCE(SUM(p.valor_realizado), 0) as valor_total_realizado,
        ROUND(AVG(CASE WHEN p.conclusao = true THEN 
          EXTRACT(EPOCH FROM (p.data_conclusao - p.data_abertura)) / 86400 
        END), 2) as tempo_medio_conclusao_dias
      FROM responsaveis r
      INNER JOIN processos p ON r.id = p.responsavel_id
      INNER JOIN modalidades m ON p.modalidade_id = m.id
      WHERE r.ativo = true 
        AND m.id = $1
        AND EXTRACT(YEAR FROM p.data_abertura) = $2
      GROUP BY r.id, r.primeiro_nome, r.nome_responsavel, m.sigla_modalidade, m.nome_modalidade, m.cor_hex
      ORDER BY total_processos DESC, processos_concluidos DESC
    `;

    const result = await pool.query(query, [modalidadeId, ano]);
    
    const rankingData = result.rows.map(row => ({
      id: row.id,
      primeiro_nome: row.primeiro_nome,
      nome_responsavel: row.nome_responsavel,
      modalidade_sigla: row.modalidade_sigla,
      modalidade_nome: row.modalidade_nome,
      modalidade_cor: row.modalidade_cor,
      total_processos: parseInt(row.total_processos),
      processos_concluidos: parseInt(row.processos_concluidos),
      processos_andamento: parseInt(row.processos_andamento),
      valor_total_estimado: parseFloat(row.valor_total_estimado),
      valor_total_realizado: parseFloat(row.valor_total_realizado),
      tempo_medio_conclusao_dias: parseFloat(row.tempo_medio_conclusao_dias) || 0,
      taxa_conclusao: row.total_processos > 0 
        ? Math.round((parseInt(row.processos_concluidos) / parseInt(row.total_processos)) * 100) 
        : 0
    }));

    res.json({ data: rankingData });
    return;
  } catch (error) {
    console.error('Erro ao buscar ranking por modalidade:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    });
    return;
  }
};
