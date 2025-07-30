import { Request, Response, NextFunction } from 'express';
import pool from '../database/connection';
import { createError } from '../middleware/errorHandler';
import { DashboardMetrics } from '../types';
import { AuthRequest } from '../middleware/auth';

// Obter métricas do dashboard
export const getDashboardMetrics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    // console.log('🔍 Filtro de usuário aplicado:', userFilter);

    // 1. Processos Ativos (Universo Total)
    const processosAtivosResult = await pool.query(`
      SELECT 
        COUNT(*) as total, 
        COALESCE(SUM(CASE 
                      WHEN p.conclusao = true THEN p.valor_realizado 
                      ELSE p.valor_estimado 
                    END), 0) as valor_associado
      FROM processos p
      JOIN situacoes s ON p.situacao_id = s.id
      WHERE s.ativo = true
      ${userFilter}
    `);

    // 2. Processos Concluídos (Subconjunto dos Ativos)
    const processosConcluidosResult = await pool.query(`
      SELECT 
        COUNT(*) as total, 
        COALESCE(SUM(p.valor_realizado), 0) as valor_associado
      FROM processos p
      JOIN situacoes s ON p.situacao_id = s.id
      WHERE s.ativo = true AND p.conclusao = true
      ${userFilter}
    `);

    // 3. Economicidade
    const economicidadeResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(p.valor_estimado - p.valor_realizado), 0) as valor_economizado
      FROM processos p
      WHERE p.conclusao = true 
      AND p.valor_realizado IS NOT NULL 
      AND p.valor_realizado < p.valor_estimado
      ${userFilter}
    `);

    // 4. Valor estimado dos processos concluídos (para cálculo de percentual de economicidade)
    const valorEstimadoConcluidosResult = await pool.query(`
      SELECT COALESCE(SUM(p.valor_estimado), 0) as valor_estimado_concluidos
      FROM processos p
      WHERE p.conclusao = true
      ${userFilter}
    `);

    const totalAtivos = parseInt(processosAtivosResult.rows[0].total);
    const valorAtivos = parseFloat(processosAtivosResult.rows[0].valor_associado);
    const totalConcluidos = parseInt(processosConcluidosResult.rows[0].total);
    const valorConcluidos = parseFloat(processosConcluidosResult.rows[0].valor_associado);

    const valorEconomizado = parseFloat(economicidadeResult.rows[0].valor_economizado);
    const valorEstimadoConcluidos = parseFloat(valorEstimadoConcluidosResult.rows[0].valor_estimado_concluidos);
    const percentualEconomicidade = valorEstimadoConcluidos > 0 
      ? (valorEconomizado / valorEstimadoConcluidos) * 100 
      : 0;

    const metrics: DashboardMetrics = {
      processos_ativos: {
        total: totalAtivos,
        valor_associado: valorAtivos,
      },
      processos_andamento: {
        total: totalAtivos - totalConcluidos,
        valor_associado: valorAtivos - valorConcluidos,
      },
      processos_concluidos: {
        total: totalConcluidos,
        valor_associado: valorConcluidos,
      },
      economicidade: {
        total: parseInt(economicidadeResult.rows[0].total),
        valor_economizado: valorEconomizado,
        percentual: percentualEconomicidade
      },
      estimado_concluidos: {
        total: totalConcluidos,
        valor_estimado: valorEstimadoConcluidos,
      },
    };

    res.json({ data: metrics });
  } catch (error) {
    console.error('Erro ao obter métricas do dashboard:', error);
    next(createError('Erro ao carregar métricas do dashboard', 500));
  }
};

// Obter dados para o mapa de calor das situações
export const getHeatmapData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // console.log('🔄 Iniciando busca de dados do mapa de calor...');

    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    const heatmapQuery = `
      WITH situacoes_metricas AS (
        SELECT 
          s.id,
          s.nome_situacao,
          COALESCE(s.cor_hex, '#3B82F6') as cor_hex,
          COUNT(p.id) as total_processos,
          ROUND(AVG(CURRENT_DATE - p.data_situacao)) as tempo_medio_dias,
          -- Processos críticos (>15 dias)
          COUNT(CASE 
            WHEN (CURRENT_DATE - p.data_situacao) > 15 
            THEN 1 
          END) as processos_criticos,
          -- Percentual de críticos
          ROUND(
            (COUNT(CASE 
              WHEN (CURRENT_DATE - p.data_situacao) > 15 
              THEN 1 
            END) * 100.0 / NULLIF(COUNT(p.id), 0)), 2
          ) as percentual_criticos,
          -- Processos em atenção (7-15 dias)
          COUNT(CASE 
            WHEN (CURRENT_DATE - p.data_situacao) BETWEEN 7 AND 15 
            THEN 1 
          END) as processos_atencao,
          -- Percentual em atenção
          ROUND(
            (COUNT(CASE 
              WHEN (CURRENT_DATE - p.data_situacao) BETWEEN 7 AND 15 
              THEN 1 
            END) * 100.0 / NULLIF(COUNT(p.id), 0)), 2
          ) as percentual_atencao
        FROM situacoes s
        LEFT JOIN processos p ON s.id = p.situacao_id
        WHERE s.ativo = true 
        AND s.eh_finalizadora = false
        ${userFilter}
        GROUP BY s.id, s.nome_situacao, s.cor_hex
      )
      SELECT 
        *,
        -- Score de criticidade (0-100)
        ROUND(
          LEAST(100, 
            (total_processos * 0.3) + 
            (tempo_medio_dias * 0.4) + 
            (percentual_criticos * 0.3)
          )
        ) as score_criticidade,
        -- Score de tamanho visual
        ROUND(
          (tempo_medio_dias * 0.7) + 
          (total_processos * 0.3)
        ) as score_tamanho_visual
      FROM situacoes_metricas
      ORDER BY score_tamanho_visual DESC
    `;

    const result = await pool.query(heatmapQuery);

    // console.log('✅ Dados do mapa de calor obtidos:', result.rows);

    const heatmapData = result.rows.map(row => ({
      id: row.id,
      nome_situacao: row.nome_situacao,
      cor_hex: row.cor_hex,
      total_processos: parseInt(row.total_processos) || 0,
      tempo_medio_dias: parseInt(row.tempo_medio_dias) || 0,
      processos_criticos: parseInt(row.processos_criticos) || 0,
      percentual_criticos: parseFloat(row.percentual_criticos) || 0,
      processos_atencao: parseInt(row.processos_atencao) || 0,
      percentual_atencao: parseFloat(row.percentual_atencao) || 0,
      score_criticidade: parseInt(row.score_criticidade) || 0,
      score_tamanho_visual: isNaN(parseInt(row.score_tamanho_visual)) ? 60 : parseInt(row.score_tamanho_visual)
    }));

    // console.log('🎨 Dados do mapa de calor processados:', heatmapData);

    res.json({ data: heatmapData });
  } catch (error) {
    console.error('❌ Erro ao obter dados do mapa de calor:', error);
    next(createError('Erro ao carregar dados do mapa de calor', 500));
  }
};

// Obter distribuição por modalidade
export const getModalidadeDistribution = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // console.log('🔄 Iniciando busca de dados de distribuição por modalidade...');

    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    const query = `
      SELECT 
        m.id,
        m.sigla_modalidade as sigla,
        m.nome_modalidade as nome,
        COALESCE(m.cor_hex, '#3B82F6') as cor_hex,
        COUNT(p.id) as total_processos,
        COALESCE(SUM(p.valor_estimado), 0) as valor_total
      FROM modalidades m
      LEFT JOIN processos p ON m.id = p.modalidade_id
      WHERE m.ativo = true
      ${userFilter}
      GROUP BY m.id, m.sigla_modalidade, m.nome_modalidade, m.cor_hex
      ORDER BY total_processos DESC
    `;

    const result = await pool.query(query);

    // console.log('✅ Dados de modalidades obtidos:', result.rows);

    const distribution = result.rows.map(row => ({
      id: row.id,
      sigla: row.sigla,
      nome: row.nome,
      cor_hex: row.cor_hex,
      total_processos: parseInt(row.total_processos) || 0,
      valor_total: parseFloat(row.valor_total) || 0
    }));

    // console.log('📊 Dados de modalidades processados:', distribution);

    res.json({ data: distribution });
  } catch (error) {
    console.error('❌ Erro ao obter distribuição por modalidade:', error);
    next(createError('Erro ao carregar distribuição por modalidade', 500));
  }
};

// Obter evolução temporal dos processos
export const getProcessEvolution = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { periodo = '12', tipo = 'estimado' } = req.query;
    
    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND responsavel_id = ${(req as any).userResponsavelId}` 
      : '';
    
    const valorField = tipo === 'realizado' ? 'valor_realizado' : 'valor_estimado';
    
    const query = `
      SELECT 
        DATE_TRUNC('month', data_entrada) as mes,
        COUNT(*) as total_processos,
        COALESCE(SUM(${valorField}), 0) as valor_total
      FROM processos
      WHERE data_entrada >= CURRENT_DATE - INTERVAL '${periodo} months'
      ${tipo === 'realizado' ? 'AND valor_realizado IS NOT NULL' : ''}
      ${userFilter}
      GROUP BY DATE_TRUNC('month', data_entrada)
      ORDER BY mes ASC
    `;

    const result = await pool.query(query);

    const evolution = result.rows.map(row => ({
      mes: row.mes,
      total_processos: parseInt(row.total_processos),
      valor_total: parseFloat(row.valor_total),
    }));

    res.json({ data: evolution });
  } catch (error) {
    console.error('Erro ao obter evolução dos processos:', error);
    next(createError('Erro ao carregar evolução dos processos', 500));
  }
};

// Obter processos críticos (parados há muito tempo)
// Obter distribuição de valores por modalidade
export const getModalidadeDistributionValores = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tipo = 'estimado' } = req.query;
    
    // console.log('🔄 Iniciando busca de distribuição de valores por modalidade...');
    // console.log('📊 Tipo de valor:', tipo);

    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    const valorField = tipo === 'realizado' ? 'valor_realizado' : 'valor_estimado';
    
    const query = `
      SELECT 
        m.id,
        m.sigla_modalidade as sigla,
        m.nome_modalidade as nome,
        COALESCE(m.cor_hex, '#3B82F6') as cor_hex,
        COUNT(p.id) as total_processos,
        COALESCE(SUM(p.${valorField}), 0) as valor_total,
        COALESCE(SUM(p.valor_estimado), 0) as valor_estimado_total,
        COALESCE(SUM(p.valor_realizado), 0) as valor_realizado_total
      FROM modalidades m
      LEFT JOIN processos p ON m.id = p.modalidade_id
      WHERE m.ativo = true
      ${tipo === 'realizado' ? 'AND p.valor_realizado IS NOT NULL' : ''}
      ${userFilter}
      GROUP BY m.id, m.sigla_modalidade, m.nome_modalidade, m.cor_hex
      HAVING COALESCE(SUM(p.${valorField}), 0) > 0
      ORDER BY valor_total DESC
    `;

    const result = await pool.query(query);

    // console.log('✅ Dados de distribuição de valores obtidos:', result.rows);

    // Calcular total geral para percentuais
    const totalGeral = result.rows.reduce((sum, row) => sum + parseFloat(row.valor_total), 0);

    const distribution = result.rows.map(row => ({
      id: row.id,
      sigla: row.sigla,
      nome: row.nome,
      cor_hex: row.cor_hex,
      total_processos: parseInt(row.total_processos),
      valor_total: parseFloat(row.valor_total),
      valor_estimado_total: parseFloat(row.valor_estimado_total),
      valor_realizado_total: parseFloat(row.valor_realizado_total),
      percentual: totalGeral > 0 ? parseFloat(((parseFloat(row.valor_total) / totalGeral) * 100).toFixed(1)) : 0
    }));

    // console.log('📊 Distribuição processada:', distribution);
    // console.log('💰 Total geral:', totalGeral);

    res.json({ data: distribution, total_geral: totalGeral, tipo_valor: tipo });
  } catch (error) {
    console.error('❌ Erro ao obter distribuição de valores por modalidade:', error);
    next(createError('Erro ao carregar distribuição de valores por modalidade', 500));
  }
};

export const getProcessosCriticos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    const query = `
      SELECT 
        p.id,
        p.nup,
        p.objeto,
        ug.sigla as unidade_gestora,
        r.nome_responsavel,
        s.nome_situacao,
        s.cor_hex,
        p.data_situacao,
        (CURRENT_DATE - p.data_situacao) as dias_parado,
        p.valor_estimado
      FROM processos p
      JOIN unidades_gestoras ug ON p.ug_id = ug.id
      JOIN responsaveis r ON p.responsavel_id = r.id
      JOIN situacoes s ON p.situacao_id = s.id
      WHERE (CURRENT_DATE - p.data_situacao) > 30
      AND s.eh_finalizadora = false
      ${userFilter}
      ORDER BY dias_parado DESC
      LIMIT 20
    `;

    const result = await pool.query(query);

    const processosCriticos = result.rows.map(row => ({
      id: row.id,
      nup: row.nup,
      objeto: row.objeto,
      unidade_gestora: row.unidade_gestora,
      responsavel: row.nome_responsavel,
      nome_situacao: row.nome_situacao,
      cor_hex: row.cor_hex,
      data_situacao: row.data_situacao,
      dias_parado: parseInt(row.dias_parado) || 0,
      valor_estimado: parseFloat(row.valor_estimado) || 0,
    }));

    res.json({ data: processosCriticos });
  } catch (error) {
    console.error('Erro ao obter processos críticos:', error);
    next(createError('Erro ao carregar processos críticos', 500));
  }
};

// Obter processos em andamento
export const getProcessosAndamento = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    const query = `
      SELECT 
        p.id,
        p.nup,
        p.objeto,
        ug.sigla as unidade_gestora_sigla,
        m.sigla_modalidade as modalidade_sigla,
        p.numero_ano,
        p.data_sessao,
        p.valor_estimado,
        s.nome_situacao as situacao,
        s.cor_hex as cor_situacao
      FROM processos p
      JOIN unidades_gestoras ug ON p.ug_id = ug.id
      JOIN modalidades m ON p.modalidade_id = m.id
      JOIN situacoes s ON p.situacao_id = s.id
      WHERE s.ativo = true 
      AND p.conclusao = false
      ${userFilter}
      ORDER BY p.data_sessao DESC NULLS LAST, p.data_entrada DESC
    `;

    const result = await pool.query(query);

    const processosAndamento = result.rows.map(row => ({
      id: row.id,
      nup: row.nup,
      objeto: row.objeto,
      unidade_gestora_sigla: row.unidade_gestora_sigla,
      modalidade_sigla: row.modalidade_sigla,
      numero_ano: row.numero_ano,
      data_sessao: row.data_sessao,
      valor_estimado: parseFloat(row.valor_estimado) || 0,
      situacao: row.situacao,
      cor_situacao: row.cor_situacao || '#6B7280', // Cor padrão se não houver
    }));

    res.json({ data: processosAndamento });
  } catch (error) {
    console.error('Erro ao obter processos em andamento:', error);
    next(createError('Erro ao carregar processos em andamento', 500));
  }
}; 