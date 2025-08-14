import { Request, Response, NextFunction } from 'express';
import pool from '../database/connection';
import { createError } from '../middleware/errorHandler';
import { DashboardMetrics } from '../types';
import { AuthRequest } from '../middleware/auth';
import { filtrarProcessosSemOutliers, logDadosEstatisticos, ProcessoValor, filtrarProcessosComDetalhesOutliers, ProcessoOutlier } from '../utils/statisticsUtils';

// Obter métricas do dashboard (com filtro de outliers)
export const getDashboardMetrics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    // console.log('🔍 Filtro de usuário aplicado:', userFilter);

    // PRIMEIRO: Buscar todos os processos para análise estatística COM DETALHES
    const processosEstatisticosQuery = `
      SELECT 
        p.id,
        p.nup,
        p.objeto,
        ug.sigla as ug_sigla,
        p.valor_estimado,
        p.conclusao
      FROM processos p
      JOIN situacoes s ON p.situacao_id = s.id
      LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
      WHERE s.ativo = true
      AND p.valor_estimado > 0
      ${userFilter}
    `;

    const processosEstatisticosResult = await pool.query(processosEstatisticosQuery);
    const processos = processosEstatisticosResult.rows.map(row => ({
      id: row.id,
      nup: row.nup,
      objeto: row.objeto,
      ug_sigla: row.ug_sigla || 'N/A',
      valor_estimado: parseFloat(row.valor_estimado)
    }));

    // Aplicar filtro estatístico para remover outliers
    const { processosValidos, dadosEstatisticos } = filtrarProcessosComDetalhesOutliers(processos, 2);
    
    // Log dos dados estatísticos
    logDadosEstatisticos(dadosEstatisticos, 'Dashboard - Métricas Principais');

    // Obter IDs dos processos válidos
    const idsProcessosValidos = processosValidos.map((p: ProcessoOutlier) => p.id);
    
    // Se não há processos válidos, retornar métricas zeradas
    if (idsProcessosValidos.length === 0) {
      console.log('⚠️ Nenhum processo válido após filtro estatístico para métricas');
      const metricsVazias: DashboardMetrics = {
        processos_ativos: { total: 0, valor_associado: 0 },
        processos_andamento: { total: 0, valor_associado: 0 },
        processos_concluidos: { total: 0, valor_associado: 0 },
        economicidade: { total: 0, valor_economizado: 0, percentual: 0 },
        estimado_concluidos: { total: 0, valor_estimado: 0 }
      };
      res.json({ data: metricsVazias });
      return;
    }

    // AGORA: Buscar métricas apenas dos processos válidos
    // 1. Processos Ativos (Universo Filtrado)
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
      AND p.id = ANY($1)
      ${userFilter}
    `, [idsProcessosValidos]);

    // 2. Processos Concluídos (Subconjunto dos Ativos Filtrados)
    const processosConcluidosResult = await pool.query(`
      SELECT 
        COUNT(*) as total, 
        COALESCE(SUM(p.valor_realizado), 0) as valor_associado
      FROM processos p
      JOIN situacoes s ON p.situacao_id = s.id
      WHERE s.ativo = true AND p.conclusao = true
      AND p.id = ANY($1)
      ${userFilter}
    `, [idsProcessosValidos]);

    // 3. Economicidade (apenas processos válidos)
    const economicidadeResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(p.valor_estimado - p.valor_realizado), 0) as valor_economizado
      FROM processos p
      WHERE p.conclusao = true 
      AND p.valor_realizado IS NOT NULL 
      AND p.valor_realizado < p.valor_estimado
      AND p.id = ANY($1)
      ${userFilter}
    `, [idsProcessosValidos]);

    // 4. Valor estimado dos processos concluídos (para cálculo de percentual de economicidade)
    const valorEstimadoConcluidosResult = await pool.query(`
      SELECT COALESCE(SUM(p.valor_estimado), 0) as valor_estimado_concluidos
      FROM processos p
      WHERE p.conclusao = true
      AND p.id = ANY($1)
      ${userFilter}
    `, [idsProcessosValidos]);

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

    console.log(`📊 Métricas do dashboard (filtradas): ${totalAtivos} processos ativos`);
    console.log(`🔢 Outliers removidos das métricas: ${dadosEstatisticos.processosOutliers}`);

    res.json({ 
      data: metrics,
      estatisticas_filtro: {
        processos_originais: dadosEstatisticos.totalProcessos,
        processos_validos: dadosEstatisticos.processosValidos,
        outliers_removidos: dadosEstatisticos.processosOutliers,
        media_valores: dadosEstatisticos.media,
        desvio_padrao: dadosEstatisticos.desvioPadrao,
        valor_maximo_permitido: dadosEstatisticos.valorMaximoPermitido
      }
    });
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

// Obter evolução temporal dos processos (com filtro de outliers)
export const getProcessEvolution = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { periodo = '12', tipo = 'estimado' } = req.query;
    
    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';
    
    const valorField = tipo === 'realizado' ? 'valor_realizado' : 'valor_estimado';
    
    // PRIMEIRO: Buscar todos os processos para análise estatística
    const processosEstatisticosQuery = `
      SELECT 
        p.id,
        p.valor_estimado,
        DATE_TRUNC('month', p.data_entrada) as mes
      FROM processos p
      WHERE p.data_entrada >= CURRENT_DATE - INTERVAL '${periodo} months'
      AND p.valor_estimado > 0
      ${tipo === 'realizado' ? 'AND p.valor_realizado IS NOT NULL' : ''}
      ${userFilter}
    `;

    const processosEstatisticosResult = await pool.query(processosEstatisticosQuery);
    const processos: ProcessoValor[] = processosEstatisticosResult.rows.map(row => ({
      id: row.id,
      valor_estimado: parseFloat(row.valor_estimado)
    }));

    // Aplicar filtro estatístico para remover outliers
    const { processosValidos, dadosEstatisticos } = filtrarProcessosSemOutliers(processos, 2);
    
    // Log dos dados estatísticos
    logDadosEstatisticos(dadosEstatisticos, 'Evolução Temporal de Processos');

    // Obter IDs dos processos válidos
    const idsProcessosValidos = processosValidos.map(p => p.id);
    
    // Se não há processos válidos, retornar evolução vazia
    if (idsProcessosValidos.length === 0) {
      console.log('⚠️ Nenhum processo válido após filtro estatístico para evolução');
      res.json({ data: [] });
      return;
    }
    
    // SEGUNDA QUERY: Buscar evolução apenas dos processos válidos
    const query = `
      SELECT 
        DATE_TRUNC('month', p.data_entrada) as mes,
        COUNT(*) as total_processos,
        COALESCE(SUM(p.${valorField}), 0) as valor_total
      FROM processos p
      WHERE p.data_entrada >= CURRENT_DATE - INTERVAL '${periodo} months'
      AND p.id = ANY($1)
      ${tipo === 'realizado' ? 'AND p.valor_realizado IS NOT NULL' : ''}
      ${userFilter}
      GROUP BY DATE_TRUNC('month', p.data_entrada)
      ORDER BY mes ASC
    `;

    const result = await pool.query(query, [idsProcessosValidos]);

    const evolution = result.rows.map(row => ({
      mes: row.mes,
      total_processos: parseInt(row.total_processos),
      valor_total: parseFloat(row.valor_total),
    }));

    console.log(`📈 Evolução temporal processada (filtrada): ${evolution.length} períodos`);

    res.json({ 
      data: evolution,
      estatisticas_filtro: {
        processos_originais: dadosEstatisticos.totalProcessos,
        processos_validos: dadosEstatisticos.processosValidos,
        outliers_removidos: dadosEstatisticos.processosOutliers
      }
    });
  } catch (error) {
    console.error('Erro ao obter evolução dos processos:', error);
    next(createError('Erro ao carregar evolução dos processos', 500));
  }
};

// Obter distribuição de valores por modalidade (com filtro de outliers)
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
    
    // PRIMEIRA QUERY: Buscar todos os processos individualmente para análise estatística
    const processosQuery = `
      SELECT 
        p.id,
        p.valor_estimado,
        p.modalidade_id,
        m.sigla_modalidade,
        m.nome_modalidade,
        m.cor_hex
      FROM processos p
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      WHERE m.ativo = true
      AND p.valor_estimado > 0
      ${tipo === 'realizado' ? 'AND p.valor_realizado IS NOT NULL' : ''}
      ${userFilter}
    `;

    const processosResult = await pool.query(processosQuery);
    const processos: (ProcessoValor & { modalidade_id: number })[] = processosResult.rows.map(row => ({
      id: row.id,
      valor_estimado: parseFloat(row.valor_estimado),
      modalidade_id: row.modalidade_id
    }));

    // Aplicar filtro estatístico para remover outliers
    const { processosValidos, dadosEstatisticos } = filtrarProcessosSemOutliers(processos, 2);
    
    // Log dos dados estatísticos
    logDadosEstatisticos(dadosEstatisticos, 'Distribuição por Modalidade - Valores');

    // Obter IDs dos processos válidos para usar na query principal
    const idsProcessosValidos = processosValidos.map(p => p.id);
    
    // Se não há processos válidos, retornar dados vazios
    if (idsProcessosValidos.length === 0) {
      console.log('⚠️ Nenhum processo válido após filtro estatístico');
      res.json({ data: [], total_geral: 0, tipo_valor: tipo });
      return;
    }

    // SEGUNDA QUERY: Buscar dados agregados apenas dos processos válidos
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
      AND p.id = ANY($1)
      ${tipo === 'realizado' ? 'AND p.valor_realizado IS NOT NULL' : ''}
      ${userFilter}
      GROUP BY m.id, m.sigla_modalidade, m.nome_modalidade, m.cor_hex
      HAVING COALESCE(SUM(p.${valorField}), 0) > 0
      ORDER BY valor_total DESC
    `;

    const result = await pool.query(query, [idsProcessosValidos]);

    // console.log('✅ Dados de distribuição de valores obtidos (pós-filtro):', result.rows);

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

    console.log(`📊 Distribuição processada (filtrada): ${distribution.length} modalidades`);
    console.log(`💰 Total geral (pós-filtro): R$ ${totalGeral.toLocaleString('pt-BR')}`);

    res.json({ 
      data: distribution, 
      total_geral: totalGeral, 
      tipo_valor: tipo,
      estatisticas: {
        processos_originais: dadosEstatisticos.totalProcessos,
        processos_validos: dadosEstatisticos.processosValidos,
        outliers_removidos: dadosEstatisticos.processosOutliers,
        media_valores: dadosEstatisticos.media,
        desvio_padrao: dadosEstatisticos.desvioPadrao,
        valor_maximo_permitido: dadosEstatisticos.valorMaximoPermitido
      }
    });
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
        s.cor_hex as cor_situacao,
        p.data_situacao,
        r.email as responsavel_email
      FROM processos p
      JOIN unidades_gestoras ug ON p.ug_id = ug.id
      JOIN modalidades m ON p.modalidade_id = m.id
      JOIN situacoes s ON p.situacao_id = s.id
      LEFT JOIN responsaveis r ON p.responsavel_id = r.id
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
      data_situacao: row.data_situacao,
      responsavel_email: row.responsavel_email
    }));

    res.json({ data: processosAndamento });
  } catch (error) {
    console.error('Erro ao obter processos em andamento:', error);
    next(createError('Erro ao carregar processos em andamento', 500));
  }
};

// Obter detalhes dos processos outliers (ocultos)
export const getOutliersDetalhes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // console.log('📊 Iniciando busca por detalhes de outliers...');

    // Construir filtro de usuário se não for administrador
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    // Buscar todos os processos para análise estatística COM DETALHES
    const processosEstatisticosQuery = `
      SELECT 
        p.id,
        p.nup,
        p.objeto,
        ug.sigla as ug_sigla,
        p.valor_estimado,
        p.modalidade_id,
        m.sigla_modalidade as modalidade_sigla,
        p.numero_ano,
        p.situacao_id,
        s.nome_situacao as situacao,
        s.cor_hex as cor_situacao,
        p.data_entrada,
        p.data_situacao
      FROM processos p
      JOIN situacoes s ON p.situacao_id = s.id
      JOIN unidades_gestoras ug ON p.ug_id = ug.id
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      WHERE s.ativo = true
      AND p.valor_estimado > 0
      ${userFilter}
    `;

    const processosEstatisticosResult = await pool.query(processosEstatisticosQuery);
    const processos = processosEstatisticosResult.rows.map(row => ({
      id: row.id,
      nup: row.nup,
      objeto: row.objeto,
      ug_sigla: row.ug_sigla || 'N/A',
      modalidade_sigla: row.modalidade_sigla || 'N/A',
      numero_ano: row.numero_ano,
      situacao: row.situacao,
      cor_situacao: row.cor_situacao || '#6B7280',
      data_entrada: row.data_entrada,
      data_situacao: row.data_situacao,
      valor_estimado: parseFloat(row.valor_estimado)
    }));

    // console.log('🔍 Total de processos encontrados:', processos.length);
    // if (processos.length > 0) {
    //   console.log('🔍 Primeiro processo - raw data:', {
    //     modalidade_id: processosEstatisticosResult.rows[0].modalidade_id,
    //     modalidade_sigla: processosEstatisticosResult.rows[0].modalidade_sigla,
    //     situacao_id: processosEstatisticosResult.rows[0].situacao_id,
    //     situacao: processosEstatisticosResult.rows[0].situacao,
    //     cor_situacao: processosEstatisticosResult.rows[0].cor_situacao,
    //     data_situacao: processosEstatisticosResult.rows[0].data_situacao
    //   });
    //   console.log('🔍 Primeiro processo após mapeamento:', JSON.stringify(processos[0], null, 2));
    // }

    // Aplicar filtro estatístico para identificar outliers
    const { processosValidos, dadosEstatisticos } = filtrarProcessosComDetalhesOutliers(processos, 2);
    
    // Log dos dados estatísticos
    logDadosEstatisticos(dadosEstatisticos, 'Dashboard - Detalhes de Outliers');

    // Função para formatar NUP abreviado (últimos 11 caracteres como no modal de processos em andamento)
    const formatNupAbreviado = (nup: string): string => {
      if (!nup) return '';
      return nup.slice(-11); // Pega os últimos 11 caracteres como no modal de andamento
    };

    // Retornar apenas os outliers com seus detalhes
    const outliersFormatados = (dadosEstatisticos.outliersDetalhados || []).map(outlier => ({
      id: outlier.id,
      nup: formatNupAbreviado(outlier.nup),
      objeto: outlier.objeto,
      unidade_gestora: outlier.ug_sigla,
      modalidade: outlier.modalidade_sigla || 'N/A',
      numero_ano: outlier.numero_ano || '',
      situacao: outlier.situacao || 'N/A',
      cor_situacao: outlier.cor_situacao || '#6B7280',
      data_situacao: outlier.data_situacao || null,
      valor_estimado: outlier.valor_estimado,
      valor_formatado: new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(outlier.valor_estimado)
    }));

    // console.log(`📊 Encontrados ${outliersFormatados.length} outliers com detalhes`);
    // console.log('🔍 Primeiro outlier formatado:', JSON.stringify(outliersFormatados[0], null, 2));
    
    res.json({ 
      data: outliersFormatados,
      estatisticas: {
        totalProcessos: dadosEstatisticos.totalProcessos,
        processosValidos: dadosEstatisticos.processosValidos,
        processosOutliers: dadosEstatisticos.processosOutliers,
        limiteOutlier: dadosEstatisticos.limiteOutlier,
        media: dadosEstatisticos.media,
        desvioPadrao: dadosEstatisticos.desvioPadrao
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter detalhes dos outliers:', error);
    next(createError('Erro ao carregar detalhes dos outliers', 500));
  }
}; 