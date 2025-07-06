import { Request, Response } from 'express';
import pool from '../database/connection';
import { Modalidade } from '../types';

// Função auxiliar para criar erro personalizado
const createError = (message: string, status: number = 400) => {
  const error = new Error(message) as any;
  error.status = status;
  return error;
};

// Listar todas as modalidades
export const getModalidades = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ativo, search } = req.query;
    
    let query = `
      SELECT 
        id, sigla_modalidade, nome_modalidade, descricao_modalidade, 
        ativo, created_at, updated_at,
        COALESCE(cor_hex, '#3498db') as cor_hex
      FROM modalidades 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCounter = 1;

    // Filtro por ativo
    if (ativo !== undefined) {
      query += ` AND ativo = $${paramCounter}`;
      params.push(ativo === 'true');
      paramCounter++;
    }

    // Filtro de busca
    if (search) {
      query += ` AND (sigla_modalidade ILIKE $${paramCounter} OR nome_modalidade ILIKE $${paramCounter})`;
      params.push(`%${search}%`);
      paramCounter++;
    }

    query += ' ORDER BY sigla_modalidade ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar modalidades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter modalidade por ID
export const getModalidadeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        m.*,
        COUNT(p.id) as total_processos
      FROM modalidades m
      LEFT JOIN processos p ON m.id = p.modalidade_id
      WHERE m.id = $1
      GROUP BY m.id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Modalidade não encontrada' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter modalidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova modalidade
export const createModalidade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sigla_modalidade, nome_modalidade, descricao_modalidade, cor_hex } = req.body;

    // Validações básicas
    if (!sigla_modalidade || !nome_modalidade) {
      res.status(400).json({ 
        error: 'Sigla e nome da modalidade são obrigatórios' 
      });
      return;
    }

    if (sigla_modalidade.length > 20) {
      res.status(400).json({ 
        error: 'Sigla deve ter no máximo 20 caracteres' 
      });
      return;
    }

    if (cor_hex && !/^#[0-9A-Fa-f]{6}$/.test(cor_hex)) {
      res.status(400).json({ 
        error: 'Cor deve estar no formato hexadecimal (#RRGGBB)' 
      });
      return;
    }

    // Verificar se sigla já existe
    const existingCheck = await pool.query(
      'SELECT id FROM modalidades WHERE sigla_modalidade = $1',
      [sigla_modalidade.toUpperCase()]
    );

    if (existingCheck.rows.length > 0) {
      res.status(409).json({ 
        error: 'Já existe uma modalidade com essa sigla' 
      });
      return;
    }

    // Adicionar coluna cor_hex se não existir
    await pool.query(`
      ALTER TABLE modalidades 
      ADD COLUMN IF NOT EXISTS cor_hex VARCHAR(7) DEFAULT '#3498db'
    `);

    const query = `
      INSERT INTO modalidades (sigla_modalidade, nome_modalidade, descricao_modalidade, cor_hex)
      VALUES ($1, $2, $3, $4)
      RETURNING id, sigla_modalidade, nome_modalidade, descricao_modalidade, 
                ativo, created_at, updated_at, cor_hex
    `;

    const result = await pool.query(query, [
      sigla_modalidade.toUpperCase(),
      nome_modalidade,
      descricao_modalidade || null,
      cor_hex || '#3498db'
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar modalidade:', error);
    
    if (error.code === '23505') { // Violação de unique constraint
      res.status(409).json({ 
        error: 'Já existe uma modalidade com essa sigla' 
      });
      return;
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar modalidade
export const updateModalidade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sigla_modalidade, nome_modalidade, descricao_modalidade, ativo, cor_hex } = req.body;

    // Validações básicas
    if (!sigla_modalidade || !nome_modalidade) {
      res.status(400).json({ 
        error: 'Sigla e nome da modalidade são obrigatórios' 
      });
      return;
    }

    if (sigla_modalidade.length > 20) {
      res.status(400).json({ 
        error: 'Sigla deve ter no máximo 20 caracteres' 
      });
      return;
    }

    if (cor_hex && !/^#[0-9A-Fa-f]{6}$/.test(cor_hex)) {
      res.status(400).json({ 
        error: 'Cor deve estar no formato hexadecimal (#RRGGBB)' 
      });
      return;
    }

    // Verificar se modalidade existe
    const modalidadeCheck = await pool.query(
      'SELECT id FROM modalidades WHERE id = $1',
      [id]
    );

    if (modalidadeCheck.rows.length === 0) {
      res.status(404).json({ error: 'Modalidade não encontrada' });
      return;
    }

    // Verificar se sigla já existe (exceto para a própria modalidade)
    const existingCheck = await pool.query(
      'SELECT id FROM modalidades WHERE sigla_modalidade = $1 AND id != $2',
      [sigla_modalidade.toUpperCase(), id]
    );

    if (existingCheck.rows.length > 0) {
      res.status(409).json({ 
        error: 'Já existe uma modalidade com essa sigla' 
      });
      return;
    }

    // Verificar se há processos vinculados antes de desativar
    if (ativo === false) {
      const processosCheck = await pool.query(
        'SELECT COUNT(*) as total FROM processos WHERE modalidade_id = $1',
        [id]
      );

      const totalProcessos = parseInt(processosCheck.rows[0].total);
      if (totalProcessos > 0) {
        res.status(400).json({ 
          error: `Não é possível desativar. Existem ${totalProcessos} processo(s) vinculado(s) a esta modalidade.` 
        });
        return;
      }
    }

    const query = `
      UPDATE modalidades 
      SET 
        sigla_modalidade = $1, 
        nome_modalidade = $2, 
        descricao_modalidade = $3,
        ativo = $4,
        cor_hex = $5
      WHERE id = $6
      RETURNING id, sigla_modalidade, nome_modalidade, descricao_modalidade, 
                ativo, created_at, updated_at, cor_hex
    `;

    const result = await pool.query(query, [
      sigla_modalidade.toUpperCase(),
      nome_modalidade,
      descricao_modalidade || null,
      ativo !== undefined ? ativo : true,
      cor_hex || '#3498db',
      id
    ]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar modalidade:', error);
    
    if (error.code === '23505') { // Violação de unique constraint
      res.status(409).json({ 
        error: 'Já existe uma modalidade com essa sigla' 
      });
      return;
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar modalidade
export const deleteModalidade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar se modalidade existe
    const modalidadeCheck = await pool.query(
      'SELECT sigla_modalidade FROM modalidades WHERE id = $1',
      [id]
    );

    if (modalidadeCheck.rows.length === 0) {
      res.status(404).json({ error: 'Modalidade não encontrada' });
      return;
    }

    // Verificar se há processos vinculados
    const processosCheck = await pool.query(
      'SELECT COUNT(*) as total FROM processos WHERE modalidade_id = $1',
      [id]
    );

    const totalProcessos = parseInt(processosCheck.rows[0].total);
    if (totalProcessos > 0) {
      res.status(400).json({ 
        error: `Não é possível excluir. Existem ${totalProcessos} processo(s) vinculado(s) a esta modalidade.` 
      });
      return;
    }

    await pool.query('DELETE FROM modalidades WHERE id = $1', [id]);

    res.json({ 
      message: `Modalidade ${modalidadeCheck.rows[0].sigla_modalidade} excluída com sucesso` 
    });
  } catch (error) {
    console.error('Erro ao deletar modalidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter estatísticas da modalidade
export const getModalidadeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Primeiro, verificar se a modalidade existe
    const modalidadeCheck = await pool.query(
      'SELECT id, sigla_modalidade, nome_modalidade FROM modalidades WHERE id = $1',
      [id]
    );

    if (modalidadeCheck.rows.length === 0) {
      res.status(404).json({ error: 'Modalidade não encontrada' });
      return;
    }

    const modalidade = modalidadeCheck.rows[0];

    // Query para estatísticas dos processos
    const statsQuery = `
      SELECT 
        COUNT(p.id) as total_processos,
        COUNT(CASE WHEN p.conclusao = true THEN 1 END) as processos_concluidos,
        COUNT(CASE WHEN p.conclusao = false THEN 1 END) as processos_andamento,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_estimado,
        COALESCE(SUM(p.valor_realizado), 0) as valor_total_realizado,
        COALESCE(AVG(p.valor_estimado), 0) as valor_medio_estimado
      FROM modalidades m
      LEFT JOIN processos p ON m.id = p.modalidade_id
      WHERE m.id = $1
      GROUP BY m.id
    `;

    const result = await pool.query(statsQuery, [id]);
    
    const stats = result.rows[0] || {
      total_processos: 0,
      processos_concluidos: 0,
      processos_andamento: 0,
      valor_total_estimado: 0,
      valor_total_realizado: 0,
      valor_medio_estimado: 0
    };
    
    // Formatar resposta
    const response = {
      sigla_modalidade: modalidade.sigla_modalidade,
      nome_modalidade: modalidade.nome_modalidade,
      total_processos: parseInt(stats.total_processos) || 0,
      processos_concluidos: parseInt(stats.processos_concluidos) || 0,
      processos_andamento: parseInt(stats.processos_andamento) || 0,
      valor_total_estimado: parseFloat(stats.valor_total_estimado) || 0,
      valor_total_realizado: parseFloat(stats.valor_total_realizado) || 0,
      valor_medio_estimado: parseFloat(stats.valor_medio_estimado) || 0
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao obter estatísticas da modalidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}; 