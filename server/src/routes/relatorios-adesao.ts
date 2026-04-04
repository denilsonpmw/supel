import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../database/connection';

const router = Router();

router.use(authenticateToken);

// GET /api/reports/adesoes
// Retorna todos os processos de adesão com joins e filtros opcionais
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { situacao_id, ug_id, data_inicio, data_fim } = req.query;

    let query = `
      SELECT
        pa.id,
        pa.nup,
        pa.objeto,
        pa.valor,
        pa.fornecedor,
        pa.data_entrada,
        pa.data_situacao,
        pa.observacoes,
        ug.sigla AS unidade_gestora_sigla,
        ug.nome_completo_unidade AS unidade_gestora_nome,
        s.nome_situacao,
        s.cor_hex AS situacao_cor_hex
      FROM processos_adesao pa
      LEFT JOIN unidades_gestoras ug ON pa.ug_id = ug.id
      LEFT JOIN situacoes s ON pa.situacao_id = s.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (situacao_id) {
      query += ` AND pa.situacao_id = $${paramCount++}`;
      params.push(situacao_id);
    }

    if (ug_id) {
      query += ` AND pa.ug_id = $${paramCount++}`;
      params.push(ug_id);
    }

    if (data_inicio) {
      query += ` AND pa.data_entrada >= $${paramCount++}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND pa.data_entrada <= $${paramCount++}`;
      params.push(data_fim);
    }

    query += ' ORDER BY pa.data_entrada DESC, pa.id DESC';

    const result = await pool.query(query, params);
    const adesoes = result.rows;

    // Calcular estatísticas
    const totalValor = adesoes.reduce((sum: number, a: any) => {
      const v = parseFloat(a.valor);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);

    res.json({
      adesoes,
      estatisticas: {
        total: adesoes.length,
        valor_total: totalValor
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de adesões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
