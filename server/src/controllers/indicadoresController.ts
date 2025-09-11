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
      colunaDataInicio = 'data_sessao', // padrão alterado para Data da Sessão
      colunaDataFim = 'data_tce_2',     // padrão alterado para Data Conclusão
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

    // Query para tempo médio por modalidade - sempre retorna todas as modalidades
    const tempoMedioQuery = `
      SELECT 
        m.sigla_modalidade as modalidade,
        m.nome_modalidade as nome_modalidade,
        ROUND(AVG(CASE WHEN p.id IS NOT NULL THEN EXTRACT(EPOCH FROM (p.${colunaDataFim}::timestamp - p.${colunaDataInicio}::timestamp)) / 86400 END), 2) as tempo_medio,
        COUNT(p.id) as total_processos,
        COALESCE(SUM(CASE WHEN p.id IS NOT NULL THEN EXTRACT(EPOCH FROM (p.${colunaDataFim}::timestamp - p.${colunaDataInicio}::timestamp)) / 86400 END), 0) as total_dias
      FROM modalidades m
      LEFT JOIN processos p ON p.modalidade_id = m.id 
        AND p.${colunaDataInicio} IS NOT NULL 
        AND p.${colunaDataFim} IS NOT NULL
        AND p.${colunaDataInicio} BETWEEN $1 AND $2
        ${modalidadeId ? `AND p.modalidade_id = $3` : ''}
        ${filtrosUsuario.responsavelCondition ? filtrosUsuario.responsavelCondition.replace('p.responsavel_id', 'p.responsavel_id') : ''}
      LEFT JOIN situacoes s ON p.situacao_id = s.id AND s.eh_finalizadora = true
      WHERE 
        LOWER(m.sigla_modalidade) != 'credenciamento'
        AND LOWER(m.nome_modalidade) NOT LIKE '%credenciamento%'
      GROUP BY m.id, m.sigla_modalidade, m.nome_modalidade
      ORDER BY tempo_medio DESC NULLS LAST
    `;

    // Query para eficácia por modalidade - sempre retorna todas as modalidades
    const eficaciaQuery = `
      SELECT 
        m.sigla_modalidade as modalidade,
        m.nome_modalidade as nome_modalidade,
        COUNT(CASE WHEN s.nome_situacao = 'Finalizado' THEN 1 END) as finalizados,
        COUNT(CASE WHEN s.nome_situacao IN ('Arquivado', 'Cancelado', 'Deserto', 'Fracassado', 'Revogado') THEN 1 END) as sem_sucesso,
  COUNT(DISTINCT p.id) as total,
        COALESCE(SUM(CASE WHEN p.${colunaDataInicio} IS NOT NULL AND p.${colunaDataFim} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (p.${colunaDataFim}::timestamp - p.${colunaDataInicio}::timestamp)) / 86400 
          ELSE 0 END), 0) as total_dias,
        ROUND((COUNT(CASE WHEN s.nome_situacao = 'Finalizado' THEN 1 END) * 100.0 / NULLIF(COUNT(p.id), 0)), 2) as taxa_sucesso
      FROM modalidades m
      LEFT JOIN processos p ON p.modalidade_id = m.id 
        AND p.${colunaDataInicio} BETWEEN $1 AND $2
        ${modalidadeId ? `AND p.modalidade_id = $3` : ''}
        ${filtrosUsuario.responsavelCondition ? filtrosUsuario.responsavelCondition.replace('p.responsavel_id', 'p.responsavel_id') : ''}
      LEFT JOIN situacoes s ON p.situacao_id = s.id AND s.eh_finalizadora = true
      WHERE 
        LOWER(m.sigla_modalidade) != 'credenciamento'
        AND LOWER(m.nome_modalidade) NOT LIKE '%credenciamento%'
      GROUP BY m.id, m.sigla_modalidade, m.nome_modalidade
      ORDER BY taxa_sucesso DESC NULLS LAST
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
    const totalProcessos = eficaciaResult.rows.reduce((acc: number, row: EficaciaResult) => acc + parseInt((row.total || 0).toString()), 0);
    const totalFinalizados = eficaciaResult.rows.reduce((acc: number, row: EficaciaResult) => acc + parseInt((row.finalizados || 0).toString()), 0);
    const tempoMedioGeral = tempoMedioResult.rows.length > 0
      ? Math.round(tempoMedioResult.rows.reduce((acc: number, row: TempoMedioResult) => acc + (parseFloat((row.tempo_medio || 0).toString()) * parseInt((row.total_processos || 0).toString())), 0) / 
          tempoMedioResult.rows.reduce((acc: number, row: TempoMedioResult) => acc + parseInt((row.total_processos || 0).toString()), 0))
      : 0;
    const taxaSucessoGeral = totalProcessos > 0 ? Math.round((totalFinalizados / totalProcessos) * 100 * 10) / 10 : 0;

    // Formatar dados de tempo médio
    const tempoMedio = tempoMedioResult.rows.map((row: TempoMedioResult) => ({
      modalidade: row.modalidade,
      nome_modalidade: row.nome_modalidade,
      tempoMedio: Math.round(parseFloat((row.tempo_medio || 0).toString())),
      totalProcessos: parseInt((row.total_processos || 0).toString()),
      totalDias: Math.round(parseFloat((row.total_dias || 0).toString())),
      // Adiciona label customizado para colunaDataFim
      labelDataFim: colunaDataFim === 'data_tce_2' ? 'Data Conclusão' : colunaDataFim
    }));

    // Formatar dados de eficácia
    const eficacia = eficaciaResult.rows.map((row: EficaciaResult) => ({
      modalidade: row.modalidade,
      nome_modalidade: row.nome_modalidade,
      finalizados: parseInt((row.finalizados || 0).toString()),
      semSucesso: parseInt((row.sem_sucesso || 0).toString()),
      total: parseInt((row.total || 0).toString()),
      totalDias: Math.round(parseFloat((row.total_dias || 0).toString())),
      taxaSucesso: parseFloat((row.taxa_sucesso || 0).toString())
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
