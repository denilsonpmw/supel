import { Request, Response } from 'express';
import pool from '../database/connection';

// Listar todas as adesões
export const getAdesoes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, ug_id, situacao_id } = req.query;
    
    let query = `
      SELECT 
        pa.*,
        ug.sigla as unidade_gestora_sigla,
        ug.nome_completo_unidade as unidade_gestora_nome,
        s.nome_situacao,
        s.cor_hex as situacao_cor_hex,
        s.eh_finalizadora as situacao_eh_finalizadora
      FROM processos_adesao pa
      LEFT JOIN unidades_gestoras ug ON pa.ug_id = ug.id
      LEFT JOIN situacoes s ON pa.situacao_id = s.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCounter = 1;

    // Filtros de busca
    if (search) {
      query += ` AND (pa.nup ILIKE $${paramCounter} OR pa.objeto ILIKE $${paramCounter} OR pa.fornecedor ILIKE $${paramCounter})`;
      params.push(`%${search}%`);
      paramCounter++;
    }

    if (ug_id) {
      query += ` AND pa.ug_id = $${paramCounter}`;
      params.push(ug_id);
      paramCounter++;
    }

    if (situacao_id) {
      query += ` AND pa.situacao_id = $${paramCounter}`;
      params.push(situacao_id);
      paramCounter++;
    }

    query += ' ORDER BY pa.data_entrada DESC, pa.id DESC';

    const result = await pool.query(query, params);
    res.json({
        data: result.rows,
        pagination: {
            total: result.rows.length,
            page: 1,
            limit: result.rows.length,
            totalPages: 1
        }
    });
  } catch (error) {
    console.error('Erro ao listar processos de adesão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter adesão por ID
export const getAdesaoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        pa.*,
        ug.sigla as unidade_gestora_sigla,
        ug.nome_completo_unidade as unidade_gestora_nome,
        s.nome_situacao,
        s.cor_hex as situacao_cor_hex,
        s.eh_finalizadora as situacao_eh_finalizadora
      FROM processos_adesao pa
      LEFT JOIN unidades_gestoras ug ON pa.ug_id = ug.id
      LEFT JOIN situacoes s ON pa.situacao_id = s.id
      WHERE pa.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Processo de adesão não encontrado' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter processo de adesão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova adesão
export const createAdesao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
        nup, objeto, ug_id, valor, fornecedor, 
        situacao_id, data_entrada, data_situacao, observacoes 
    } = req.body;

    // Validações básicas
    if (!nup || !objeto || !ug_id || !fornecedor || !situacao_id || !data_entrada || !data_situacao) {
      res.status(400).json({ error: 'Campos obrigatórios faltando' });
      return;
    }

    // Verificar NUP único
    const checkNup = await pool.query('SELECT id FROM processos_adesao WHERE nup = $1', [nup]);
    if (checkNup.rows.length > 0) {
      res.status(400).json({ error: 'Já existe um processo com este NUP' });
      return;
    }

    const query = `
      INSERT INTO processos_adesao (
        nup, objeto, ug_id, valor, fornecedor, 
        situacao_id, data_entrada, data_situacao, observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      nup, objeto, ug_id, valor || 0, fornecedor, 
      situacao_id, data_entrada, data_situacao, observacoes || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar processo de adesão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar adesão
export const updateAdesao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
        nup, objeto, ug_id, valor, fornecedor, 
        situacao_id, data_entrada, data_situacao, observacoes 
    } = req.body;

    // Validações básicas
    if (!nup || !objeto || !ug_id || !fornecedor || !situacao_id || !data_entrada || !data_situacao) {
      res.status(400).json({ error: 'Campos obrigatórios faltando' });
      return;
    }

    // Verificar se existe
    const adesaoCheck = await pool.query('SELECT id FROM processos_adesao WHERE id = $1', [id]);
    if (adesaoCheck.rows.length === 0) {
      res.status(404).json({ error: 'Processo de adesão não encontrado' });
      return;
    }

    // Verificar NUP único se alterou
    const checkNup = await pool.query('SELECT id FROM processos_adesao WHERE nup = $1 AND id != $2', [nup, id]);
    if (checkNup.rows.length > 0) {
      res.status(400).json({ error: 'Já existe um processo com este NUP' });
      return;
    }

    const query = `
      UPDATE processos_adesao 
      SET 
        nup = $1, 
        objeto = $2, 
        ug_id = $3, 
        valor = $4, 
        fornecedor = $5, 
        situacao_id = $6, 
        data_entrada = $7, 
        data_situacao = $8, 
        observacoes = $9
      WHERE id = $10
      RETURNING *
    `;

    const result = await pool.query(query, [
      nup, objeto, ug_id, valor || 0, fornecedor, 
      situacao_id, data_entrada, data_situacao, observacoes || null,
      id
    ]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar processo de adesão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar adesão
export const deleteAdesao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const adesaoCheck = await pool.query('SELECT id FROM processos_adesao WHERE id = $1', [id]);
    if (adesaoCheck.rows.length === 0) {
      res.status(404).json({ error: 'Processo de adesão não encontrado' });
      return;
    }

    await pool.query('DELETE FROM processos_adesao WHERE id = $1', [id]);
    res.json({ message: 'Processo de adesão excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar processo de adesão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
