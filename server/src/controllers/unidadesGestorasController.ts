import { Request, Response } from 'express';
import pool from '../database/connection';
import { UnidadeGestora } from '../types';

// Listar todas as unidades gestoras
export const getUnidadesGestoras = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ativo, search } = req.query;
    
    let query = `
      SELECT 
        id, sigla, nome_completo_unidade, 
        ativo, created_at, updated_at
      FROM unidades_gestoras 
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
      query += ` AND (sigla ILIKE $${paramCounter} OR nome_completo_unidade ILIKE $${paramCounter})`;
      params.push(`%${search}%`);
      paramCounter++;
    }

    query += ' ORDER BY sigla ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar unidades gestoras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter unidade gestora por ID
export const getUnidadeGestoraById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        id, sigla, nome_completo_unidade, 
        ativo, created_at, updated_at
      FROM unidades_gestoras 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Unidade gestora não encontrada' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter unidade gestora:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova unidade gestora
export const createUnidadeGestora = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sigla, nome_completo_unidade } = req.body;

    // Validações básicas
    if (!sigla || !nome_completo_unidade) {
      res.status(400).json({ 
        error: 'Sigla e nome completo da unidade são obrigatórios' 
      });
      return;
    }

    if (sigla.length > 20) {
      res.status(400).json({ 
        error: 'Sigla deve ter no máximo 20 caracteres' 
      });
      return;
    }

    // Verificar se sigla já existe
    const existingCheck = await pool.query(
      'SELECT id FROM unidades_gestoras WHERE sigla = $1',
      [sigla.toUpperCase()]
    );

    if (existingCheck.rows.length > 0) {
      res.status(409).json({ 
        error: 'Já existe uma unidade gestora com essa sigla' 
      });
      return;
    }

    const query = `
      INSERT INTO unidades_gestoras (sigla, nome_completo_unidade)
      VALUES ($1, $2)
      RETURNING id, sigla, nome_completo_unidade, 
                ativo, created_at, updated_at
    `;

    const result = await pool.query(query, [
      sigla.toUpperCase(),
      nome_completo_unidade
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar unidade gestora:', error);
    
    if (error.code === '23505') { // Violação de unique constraint
      res.status(409).json({ 
        error: 'Já existe uma unidade gestora com essa sigla' 
      });
      return;
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar unidade gestora
export const updateUnidadeGestora = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sigla, nome_completo_unidade, ativo } = req.body;

    // Validações básicas
    if (!sigla || !nome_completo_unidade) {
      res.status(400).json({ 
        error: 'Sigla e nome completo da unidade são obrigatórios' 
      });
      return;
    }

    if (sigla.length > 20) {
      res.status(400).json({ 
        error: 'Sigla deve ter no máximo 20 caracteres' 
      });
      return;
    }

    // Verificar se unidade gestora existe
    const unidadeCheck = await pool.query(
      'SELECT id FROM unidades_gestoras WHERE id = $1',
      [id]
    );

    if (unidadeCheck.rows.length === 0) {
      res.status(404).json({ error: 'Unidade gestora não encontrada' });
      return;
    }

    // Verificar se sigla já existe (exceto para a própria unidade)
    const existingCheck = await pool.query(
      'SELECT id FROM unidades_gestoras WHERE sigla = $1 AND id != $2',
      [sigla.toUpperCase(), id]
    );

    if (existingCheck.rows.length > 0) {
      res.status(409).json({ 
        error: 'Já existe uma unidade gestora com essa sigla' 
      });
      return;
    }

    // Verificar se há processos vinculados antes de desativar
    if (ativo === false) {
      const processosCheck = await pool.query(
        'SELECT COUNT(*) as total FROM processos WHERE ug_id = $1',
        [id]
      );

      const totalProcessos = parseInt(processosCheck.rows[0].total);
      if (totalProcessos > 0) {
        res.status(400).json({ 
          error: `Não é possível desativar. Existem ${totalProcessos} processo(s) vinculado(s) a esta unidade gestora.` 
        });
        return;
      }
    }

    const query = `
      UPDATE unidades_gestoras 
      SET 
        sigla = $1, 
        nome_completo_unidade = $2, 
        ativo = $3
      WHERE id = $4
      RETURNING id, sigla, nome_completo_unidade, 
                ativo, created_at, updated_at
    `;

    const result = await pool.query(query, [
      sigla.toUpperCase(),
      nome_completo_unidade,
      ativo !== undefined ? ativo : true,
      id
    ]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar unidade gestora:', error);
    
    if (error.code === '23505') { // Violação de unique constraint
      res.status(409).json({ 
        error: 'Já existe uma unidade gestora com essa sigla' 
      });
      return;
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar unidade gestora
export const deleteUnidadeGestora = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar se unidade gestora existe
    const unidadeCheck = await pool.query(
      'SELECT sigla FROM unidades_gestoras WHERE id = $1',
      [id]
    );

    if (unidadeCheck.rows.length === 0) {
      res.status(404).json({ error: 'Unidade gestora não encontrada' });
      return;
    }

    // Verificar se há processos vinculados
    const processosCheck = await pool.query(
      'SELECT COUNT(*) as total FROM processos WHERE ug_id = $1',
      [id]
    );

    const totalProcessos = parseInt(processosCheck.rows[0].total);
    if (totalProcessos > 0) {
      res.status(400).json({ 
        error: `Não é possível excluir. Existem ${totalProcessos} processo(s) vinculado(s) a esta unidade gestora.` 
      });
      return;
    }

    await pool.query('DELETE FROM unidades_gestoras WHERE id = $1', [id]);
    
    res.json({ 
      message: 'Unidade gestora excluída com sucesso',
      sigla: unidadeCheck.rows[0].sigla 
    });
  } catch (error) {
    console.error('Erro ao deletar unidade gestora:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter estatísticas da unidade gestora
export const getUnidadeGestoraStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        ug.sigla,
        ug.nome_completo_unidade,
        COUNT(p.id) as total_processos,
        COUNT(CASE WHEN p.conclusao = true THEN 1 END) as processos_concluidos,
        COUNT(CASE WHEN p.conclusao = false THEN 1 END) as processos_andamento,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total_estimado,
        COALESCE(SUM(p.valor_realizado), 0) as valor_total_realizado,
        COALESCE(AVG(p.valor_estimado), 0) as valor_medio_estimado,
        COUNT(DISTINCT p.modalidade_id) as modalidades_utilizadas,
        COUNT(DISTINCT p.responsavel_id) as responsaveis_envolvidos
      FROM unidades_gestoras ug
      LEFT JOIN processos p ON ug.id = p.ug_id
      WHERE ug.id = $1
      GROUP BY ug.id, ug.sigla, ug.nome_completo_unidade
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Unidade gestora não encontrada' });
      return;
    }

    const stats = result.rows[0];
    res.json({
      sigla: stats.sigla,
      nome_completo_unidade: stats.nome_completo_unidade,
      total_processos: parseInt(stats.total_processos),
      processos_concluidos: parseInt(stats.processos_concluidos),
      processos_andamento: parseInt(stats.processos_andamento),
      valor_total_estimado: parseFloat(stats.valor_total_estimado),
      valor_total_realizado: parseFloat(stats.valor_total_realizado),
      valor_medio_estimado: parseFloat(stats.valor_medio_estimado),
      modalidades_utilizadas: parseInt(stats.modalidades_utilizadas),
      responsaveis_envolvidos: parseInt(stats.responsaveis_envolvidos)
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas da unidade gestora:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}; 