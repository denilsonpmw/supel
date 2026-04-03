import { Request, Response } from 'express';
import pool from '../database/connection.js';

export const getCollectedData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      tipo, 
      numero, 
      dataInicio,
      dataFim,
      orderBy = 'dataAbertura_date', 
      orderDir = 'desc' 
    } = req.query;
    
    console.log('🔍 Buscando dados ME/EPP do banco de dados...');

    // Construir WHERE clause baseado nos filtros
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Filtros de data
    if (dataInicio) {
      paramCount++;
      conditions.push(`dataAbertura_date >= $${paramCount}`);
      params.push(dataInicio);
    }
    
    if (dataFim) {
      paramCount++;
      conditions.push(`dataAbertura_date <= $${paramCount}`);
      params.push(dataFim);
    }

    // Filtro por tipo de licitação
    if (tipo) {
      paramCount++;
      // Mapear IDs de modalidade para padrões de tipo_licitacao
      const modalidadeMap: { [key: string]: string[] } = {
        '10': ['Concorr%ncia%'],  // Concorrência por Menor Preço
        '11': ['Credenciamento%'],
        '12': ['Dispensa%Eletr%nica%'], // Dispensa Eletrônica 
        '13': ['Preg%o%Eletr%nico%', 'Registro%Pre%os%Eletr%nico%'] // Pregão Eletrônico e Registro de Preços Eletrônico
      };
      
      const tipoString = String(tipo);
      const padroes = modalidadeMap[tipoString];
      
      if (padroes) {
        if (padroes.length === 1) {
          conditions.push(`tipo_licitacao ILIKE $${paramCount}`);
          params.push(padroes[0]);
        } else {
          // Múltiplos padrões (como para PE que inclui RPE)
          const orConditions = padroes.map((_, index) => `tipo_licitacao ILIKE $${paramCount + index}`).join(' OR ');
          conditions.push(`(${orConditions})`);
          params.push(...padroes);
          paramCount += padroes.length - 1; // Ajustar contador
        }
      } else {
        // Fallback para busca direta por texto
        conditions.push(`tipo_licitacao ILIKE $${paramCount}`);
        params.push(`%${tipo}%`);
      }
    }

    // Filtro por número da licitação ou razão social
    if (numero) {
      paramCount++;
      conditions.push(`(numero ILIKE $${paramCount} OR razaoSocial ILIKE $${paramCount})`);
      params.push(`%${numero}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para contar total de registros
    const countQuery = `SELECT COUNT(*) as total FROM microempresas_licitacoes ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const totalRecords = parseInt(countResult.rows[0].total);

    // Query para buscar registros paginados
    const offset = (Number(page) - 1) * Number(limit);
    const dataQuery = `
      SELECT * FROM microempresas_licitacoes 
      ${whereClause}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    params.push(Number(limit), offset);

    const dataResult = await pool.query(dataQuery, params);

    // Calcular estatísticas globais (sem filtros de paginação, mas com filtros de data/tipo)
    const statsParams = params.slice(0, paramCount); // Remove limit e offset
    const statsWhereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT "idlicitacao") as total_licitacoes,
        COUNT(DISTINCT ("idlicitacao" || '-' || "cnpj")) as total_participacoes,
        COUNT(DISTINCT CASE WHEN "declaracaome" = true THEN ("idlicitacao" || '-' || "cnpj") END) as participacoes_me,
        COUNT(DISTINCT CASE WHEN vencedor = true THEN ("idlicitacao" || '-' || "cnpj") END) as contratacoes_pj,
        COUNT(DISTINCT CASE WHEN vencedor = true AND "declaracaome" = true THEN ("idlicitacao" || '-' || "cnpj") END) as contratacoes_me
      FROM microempresas_licitacoes ${statsWhereClause}
    `;
    
    const statsResult = await pool.query(statsQuery, statsParams);
    const stats = statsResult.rows[0];

    console.log(`📊 Stats: ${stats.total_licitacoes} licitações, ${stats.total_participacoes} participações, ${stats.participacoes_me} participações ME, ${stats.contratacoes_pj} contratações PJ, ${stats.contratacoes_me} contratações ME`);

    res.json({
      data: dataResult.rows,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / Number(limit)),
        totalRecords,
        recordsPerPage: Number(limit)
      },
      stats: {
        totalLicitacoes: parseInt(stats.total_licitacoes),
        totalParticipacoes: parseInt(stats.total_participacoes),
        participacoesME: parseInt(stats.participacoes_me),
        totalVencedores: parseInt(stats.contratacoes_pj), // Mantém compatibilidade
        contratacoesME: parseInt(stats.contratacoes_me),
        percentualParticipacoesME: stats.total_participacoes > 0 ? 
          ((stats.participacoes_me / stats.total_participacoes) * 100).toFixed(1) : '0',
        percentualContratacoesME: stats.contratacoes_pj > 0 ? 
          ((stats.contratacoes_me / stats.contratacoes_pj) * 100).toFixed(1) : '0'
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados ME/EPP:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao buscar dados ME/EPP'
    });
  }
};

export const getCollectedDataStats = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 Buscando estatísticas ME/EPP do banco de dados...');

    const statsQuery = `
      SELECT 
        COUNT(*) as total_registros,
        COUNT(DISTINCT "idlicitacao") as total_licitacoes,
        COUNT(DISTINCT "cnpj") as total_participantes,
        COUNT(DISTINCT CASE WHEN vencedor = true THEN "cnpj" END) as total_vencedores,
        COUNT(DISTINCT "tipoempresa") as tipos_empresa,
        COUNT(DISTINCT "tipo_licitacao") as tipos_licitacao
      FROM microempresas_licitacoes
    `;
    
    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    res.json({
      totalRegistros: parseInt(stats.total_registros),
      totalLicitacoes: parseInt(stats.total_licitacoes),
      totalParticipantes: parseInt(stats.total_participantes),
      totalVencedores: parseInt(stats.total_vencedores),
      tiposEmpresa: parseInt(stats.tipos_empresa),
      tiposLicitacao: parseInt(stats.tipos_licitacao),
      percentualVencedores: stats.total_participantes > 0 ? 
        ((stats.total_vencedores / stats.total_participantes) * 100).toFixed(2) : '0',
      dataAtualizacao: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas ME/EPP:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao buscar estatísticas ME/EPP'
    });
  }
};
