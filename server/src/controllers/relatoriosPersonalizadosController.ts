import { Request, Response } from 'express';
import db from '../database/connection';

interface AuthRequest extends Request {
  user?: { id: number };
}

export const listar = async (req: AuthRequest, res: Response) => {
  const usuarioId = req.user?.id;
  console.log('[Relatórios] Listando para usuarioId:', usuarioId);
  const result = await db.query(
    'SELECT * FROM relatorios_personalizados WHERE usuario_id = $1 ORDER BY criado_em DESC',
    [usuarioId]
  );
  console.log('[Relatórios] Resultados encontrados:', result.rows.length, result.rows.map(r => r.id));
  return res.json(result.rows);
};

export const criar = async (req: AuthRequest, res: Response) => {
  const usuarioId = req.user?.id;
  // Aceita tanto ordemColunas quanto ordem_colunas do frontend
  const { nome, descricao, categoria, campos, filtros, cor } = req.body;
  const ordem_colunas = req.body.ordem_colunas || req.body.ordemColunas || [];
  const result = await db.query(
    `INSERT INTO relatorios_personalizados (usuario_id, nome, descricao, categoria, campos, ordem_colunas, filtros, cor)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [usuarioId, nome, descricao, categoria, JSON.stringify(campos), JSON.stringify(ordem_colunas), JSON.stringify(filtros), cor]
  );
  return res.status(201).json(result.rows[0]);
};

export const editar = async (req: AuthRequest, res: Response) => {
  const usuarioId = req.user?.id;
  const { id } = req.params;
  const { nome, descricao, categoria, campos, filtros, cor } = req.body;
  const ordem_colunas = req.body.ordem_colunas || req.body.ordemColunas || [];
  const result = await db.query(
    `UPDATE relatorios_personalizados SET nome=$1, descricao=$2, categoria=$3, campos=$4, ordem_colunas=$5, filtros=$6, cor=$7, atualizado_em=NOW()
     WHERE id=$8 AND usuario_id=$9 RETURNING *`,
    [nome, descricao, categoria, JSON.stringify(campos), JSON.stringify(ordem_colunas), JSON.stringify(filtros), cor, id, usuarioId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Relatório não encontrado' });
  return res.json(result.rows[0]);
};

export const excluir = async (req: AuthRequest, res: Response) => {
  const usuarioId = req.user?.id;
  const { id } = req.params;
  const result = await db.query(
    'DELETE FROM relatorios_personalizados WHERE id=$1 AND usuario_id=$2 RETURNING *',
    [id, usuarioId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Relatório não encontrado' });
  return res.json({ success: true });
};
