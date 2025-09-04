import { Request, Response } from 'express';
import pool from '../database/connection';

interface IndicadoresFilters {
  dataInicio: string;
  dataFim: string;
  colunaDataInicio: string;
  colunaDataFim: string;
  modalidadeId?: number;
  responsavelId?: number; // Filtro automático aplicado pelo middleware
}

interface TempoMedioResult {
  modalidade: string;
  nome_modalidade: string;
  tempo_medio: number;
  total_processos: number;
  total_dias: number;
}

interface EficaciaResult {
  modalidade: string;
  nome_modalidade: string;
  finalizados: number;
  sem_sucesso: number;
  total: number;
  total_dias: number;
  taxa_sucesso: number;
}

export const getIndicadoresGerenciais = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      dataInicio,
      dataFim,
      colunaDataInicio = 'data_entrada',
      colunaDataFim = 'data_situacao',
      modalidadeId
    } = req.query as any;

    // Validação de parâmetros obrigatórios
    if (!dataInicio || !dataFim) {
      res.status(400).json({
        error: 'Parâmetros dataInicio e dataFim são obrigatórios'
      });
      return;
    }

    // Validação das colunas de data permitidas
    const colunasPermitidas = [
      'data_entrada', 'data_sessao', 'data_pncp', 'data_tce_1', 
      'data_situacao', 'data_tce_2', 'created_at', 'updated_at'
    ];
    
    if (!colunasPermitidas.includes(colunaDataInicio) || !colunasPermitidas.includes(colunaDataFim)) {
      res.status(400).json({
        error: 'Colunas de data inválidas'
      });
      return;
    }

    // Filtros do usuário (aplicados pelo middleware)
    const filtrosUsuario = (req as any).userFilters || {};

    // Query para tempo médio por modalidade
    const tempoMedioQuery = `
      SELECT 
        m.sigla_modalidade as modalidade,
        m.nome_modalidade as nome_modalidade,
        ROUND(AVG(EXTRACT(EPOCH FROM (p.${colunaDataFim}::timestamp - p.${colunaDataInicio}::timestamp)) / 86400), 2) as tempo_medio,
        COUNT(*) as total_processos,
        SUM(EXTRACT(EPOCH FROM (p.${colunaDataFim}::timestamp - p.${colunaDataInicio}::timestamp)) / 86400) as total_dias
      FROM processos p
      INNER JOIN modalidades m ON p.modalidade_id = m.id
      INNER JOIN situacoes s ON p.situacao_id = s.id
      WHERE 
        s.eh_finalizadora = true
        AND p.${colunaDataInicio} IS NOT NULL 
        AND p.${colunaDataFim} IS NOT NULL
        AND p.${colunaDataInicio} BETWEEN $1 AND $2
        AND LOWER(m.sigla_modalidade) != 'credenciamento'
        AND LOWER(m.nome_modalidade) NOT LIKE '%credenciamento%'
        ${modalidadeId ? 'AND p.modalidade_id = $3' : ''}
        ${filtrosUsuario.responsavelCondition || ''}
      GROUP BY m.id, m.sigla_modalidade, m.nome_modalidade
      ORDER BY tempo_medio DESC
    `;

    // Query para eficácia por modalidade
    const eficaciaQuery = `
      SELECT 
        m.sigla_modalidade as modalidade,
        m.nome_modalidade as nome_modalidade,
        COUNT(CASE WHEN s.nome_situacao = 'Finalizado' THEN 1 END) as finalizados,
        COUNT(CASE WHEN s.nome_situacao IN ('Arquivado', 'Cancelado', 'Deserto', 'Fracassado', 'Revogado') THEN 1 END) as sem_sucesso,
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN p.${colunaDataInicio} IS NOT NULL AND p.${colunaDataFim} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (p.${colunaDataFim}::timestamp - p.${colunaDataInicio}::timestamp)) / 86400 
          ELSE 0 END), 0) as total_dias,
        ROUND((COUNT(CASE WHEN s.nome_situacao = 'Finalizado' THEN 1 END) * 100.0 / COUNT(*)), 2) as taxa_sucesso
      FROM processos p
      INNER JOIN modalidades m ON p.modalidade_id = m.id
      INNER JOIN situacoes s ON p.situacao_id = s.id
      WHERE 
        s.eh_finalizadora = true
        AND p.${colunaDataInicio} BETWEEN $1 AND $2
        AND LOWER(m.sigla_modalidade) != 'credenciamento'
        AND LOWER(m.nome_modalidade) NOT LIKE '%credenciamento%'
        ${modalidadeId ? 'AND p.modalidade_id = $3' : ''}
        ${filtrosUsuario.responsavelCondition || ''}
      GROUP BY m.id, m.sigla_modalidade, m.nome_modalidade
      ORDER BY taxa_sucesso DESC
    `;

    // Parâmetros para as queries
    const params = modalidadeId 
      ? [dataInicio, dataFim, modalidadeId, ...(filtrosUsuario.params || [])]
      : [dataInicio, dataFim, ...(filtrosUsuario.params || [])];

    // Executar queries em paralelo
    const [tempoMedioResult, eficaciaResult] = await Promise.all([
      pool.query<TempoMedioResult>(tempoMedioQuery, params),
      pool.query<EficaciaResult>(eficaciaQuery, params)
    ]);

    // Calcular resumo geral
    const totalProcessos = eficaciaResult.rows.reduce((acc: number, row: EficaciaResult) => acc + parseInt(row.total.toString()), 0);
    const totalFinalizados = eficaciaResult.rows.reduce((acc: number, row: EficaciaResult) => acc + parseInt(row.finalizados.toString()), 0);
    const tempoMedioGeral = tempoMedioResult.rows.length > 0
      ? Math.round(tempoMedioResult.rows.reduce((acc: number, row: TempoMedioResult) => acc + (parseFloat(row.tempo_medio.toString()) * parseInt(row.total_processos.toString())), 0) / 
          tempoMedioResult.rows.reduce((acc: number, row: TempoMedioResult) => acc + parseInt(row.total_processos.toString()), 0))
      : 0;
    const taxaSucessoGeral = totalProcessos > 0 ? Math.round((totalFinalizados / totalProcessos) * 100 * 10) / 10 : 0;

    // Formatar dados de tempo médio
    const tempoMedio = tempoMedioResult.rows.map((row: TempoMedioResult) => ({
      modalidade: row.modalidade,
      nome_modalidade: row.nome_modalidade,
      tempoMedio: Math.round(parseFloat(row.tempo_medio.toString())),
      totalProcessos: parseInt(row.total_processos.toString()),
      totalDias: Math.round(parseFloat(row.total_dias.toString()))
    }));

    // Formatar dados de eficácia
    const eficacia = eficaciaResult.rows.map((row: EficaciaResult) => ({
      modalidade: row.modalidade,
      nome_modalidade: row.nome_modalidade,
      finalizados: parseInt(row.finalizados.toString()),
      semSucesso: parseInt(row.sem_sucesso.toString()),
      total: parseInt(row.total.toString()),
      totalDias: Math.round(parseFloat(row.total_dias.toString())),
      taxaSucesso: parseFloat(row.taxa_sucesso.toString())
    }));

    const response = {
      tempoMedio,
      eficacia,
      resumoGeral: {
        totalProcessos,
        tempoMedioGeral,
        taxaSucessoGeral
      },
      filtros: {
        dataInicio,
        dataFim,
        colunaDataInicio,
        colunaDataFim,
        modalidadeId: modalidadeId || null
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Erro ao buscar indicadores gerenciais:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao buscar indicadores gerenciais'
    });
  }
};
