import { Request, Response } from 'express';
import pool from '../database/connection.js';
import { pcpSyncService } from '../services/pcpSyncService.js';
import { syncStatusManager } from '../services/SyncStatusManager.js';

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

    // Filtros fixos
    conditions.push('vencedor = true');
    
    // Filtros de data
    if (dataInicio) {
      paramCount++;
      conditions.push(`dataabertura_date >= $${paramCount}`);
      params.push(dataInicio);
    }
    
    if (dataFim) {
      paramCount++;
      conditions.push(`dataabertura_date <= $${paramCount}`);
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
      conditions.push(`(numero ILIKE $${paramCount} OR razaosocial ILIKE $${paramCount})`);
      params.push(`%${numero}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para contar total de registros
    const countQuery = `SELECT COUNT(*) as total FROM microempresas_licitacoes ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const totalRecords = parseInt(countResult.rows[0].total);

    // Mapear orderBy para colunas reais
    const orderByMap: { [key: string]: string } = {
      'dataAberturaPropostas': 'dataabertura_date',
      'dataAbertura_date': 'dataabertura_date',
      'numero': 'numero',
      'razaoSocial': 'razaosocial',
      'valor_negociado': 'valor_negociado'
    };
    const sortColumn = orderByMap[String(orderBy)] || 'dataabertura_date';

    // Query para buscar registros paginados
    const offset = (Number(page) - 1) * Number(limit);
    const dataQuery = `
      SELECT * FROM microempresas_licitacoes 
      ${whereClause}
      ORDER BY ${sortColumn} ${orderDir}
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

    res.json({
      data: dataResult.rows,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / Number(limit)),
        total: totalRecords,
        recordsPerPage: Number(limit)
      },
      stats: {
        totalLicitacoes: parseInt(stats.total_licitacoes),
        totalParticipacoes: parseInt(stats.total_participacoes),
        participacoesME: parseInt(stats.participacoes_me),
        totalVencedores: parseInt(stats.contratacoes_pj),
        contratacoesME: parseInt(stats.contratacoes_me),
        percentualParticipacoesME: stats.total_participacoes > 0 ? 
          ((stats.participacoes_me / stats.total_participacoes) * 100).toFixed(1) : '0',
        percentualContratacoesME: stats.contratacoes_pj > 0 ? 
          ((stats.contratacoes_me / stats.contratacoes_pj) * 100).toFixed(1) : '0'
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados ME/EPP:', error);
    res.status(500).json({ error: 'Erro interno ao buscar dados ME/EPP' });
  }
};

export const getCollectedDataStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataInicio, dataFim, tipo } = req.query;
    
    // Construir WHERE clause baseado nos filtros
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (dataInicio) {
      paramCount++;
      conditions.push(`dataabertura_date >= $${paramCount}`);
      params.push(dataInicio);
    }
    
    if (dataFim) {
      paramCount++;
      conditions.push(`dataabertura_date <= $${paramCount}`);
      params.push(dataFim);
    }

    if (tipo) {
      paramCount++;
      // Mapear IDs de modalidade para padrões de tipo_licitacao (mesma lógica do getCollectedData)
      const modalidadeMap: { [key: string]: string[] } = {
        '10': ['Concorr%ncia%'],
        '11': ['Credenciamento%'],
        '12': ['Dispensa%Eletr%nica%'],
        '13': ['Preg%o%Eletr%nico%', 'Registro%Pre%os%Eletr%nico%']
      };
      
      const tipoString = String(tipo);
      const padroes = modalidadeMap[tipoString];
      
      if (padroes) {
        if (padroes.length === 1) {
          conditions.push(`tipo_licitacao ILIKE $${paramCount}`);
          params.push(padroes[0]);
        } else {
          const orConditions = padroes.map((_, index) => `tipo_licitacao ILIKE $${paramCount + index}`).join(' OR ');
          conditions.push(`(${orConditions})`);
          params.push(...padroes);
          paramCount += padroes.length - 1;
        }
      } else {
        conditions.push(`tipo_licitacao ILIKE $${paramCount}`);
        params.push(`%${tipo}%`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT ("idlicitacao" || '-' || "cnpj")) as total_participacoes,
        COUNT(DISTINCT CASE WHEN vencedor = true THEN ("idlicitacao" || '-' || "cnpj") END) as total_vencedores,
        COUNT(DISTINCT CASE WHEN vencedor = true AND "declaracaome" = true THEN ("idlicitacao" || '-' || "cnpj") END) as vencedores_me
      FROM microempresas_licitacoes ${whereClause}
    `;
    
    const statsResult = await pool.query(statsQuery, params);
    const stats = statsResult.rows[0];

    const totalVencedores = parseInt(stats.total_vencedores || 0);
    const vencedoresMe = parseInt(stats.vencedores_me || 0);
    const vencedoresDemais = totalVencedores - vencedoresMe;

    res.json({
      totalVencedores,
      vencedoresMe,
      vencedoresDemais,
      percentualMe: totalVencedores > 0 ? ((vencedoresMe / totalVencedores) * 100).toFixed(0) : '0',
      dataAtualizacao: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas ME/EPP:', error);
    res.status(500).json({ error: 'Erro interno ao buscar estatísticas ME/EPP' });
  }
};

export const syncPcpData = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🚀 [PCP Sync] Requisição recebida. Iniciando processamento em background...');
    
    // Se já estiver sincronizando, não iniciar outra
    const currentStatus = syncStatusManager.getStatus();
    if (currentStatus.isSyncing) {
      res.status(409).json({
        success: false,
        message: 'Já existe uma sincronização em andamento.',
        status: currentStatus
      });
      return;
    }

    // Responder IMEDIATAMENTE ao frontend para evitar timeout
    res.status(202).json({
      success: true,
      message: 'Sincronização iniciada com sucesso em segundo plano.',
      timestamp: new Date().toISOString()
    });

    // Executar a sincronização em background
    pcpSyncService.sincronizarTudo([2024, 2025])
      .then(result => {
        console.log(`✅ [PCP Sync] Concluído com sucesso: ${result.syncedCount} sincronizados, ${result.skippedCount} pulados.`);
      })
      .catch(error => {
        console.error('❌ [PCP Sync] Erro crítico no processamento de background:', error.message);
      });

  } catch (error: any) {
    console.error('Erro ao disparar sincronização PCP:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Erro ao iniciar sincronização',
        message: error.message
      });
    }
  }
};

export const getSyncStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = syncStatusManager.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter status da sincronização' });
  }
};
