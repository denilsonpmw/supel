import { Request, Response } from 'express';
import pool from '../database/connection.js';
import { pcpSyncService } from '../services/pcpSyncService.js';
import { syncStatusManager } from '../services/SyncStatusManager.js';

export const getCollectedData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      tipo = '', 
      numero = '',
      situacao = '',
      cd_situacao = '',
      ug_id = '',
      dataInicio = '',
      dataFim = '',
      orderBy = 'dataAbertura_date',
      orderDir = 'DESC'
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const offset = (pageNumber - 1) * limitNumber;

    // Construir condições WHERE dinamicamente
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (tipo && tipo.toString().trim()) {
      conditions.push(`tipo_licitacao ILIKE $${paramIndex}`);
      params.push(`%${tipo.toString().trim()}%`);
      paramIndex++;
    }

    if (numero && numero.toString().trim()) {
      conditions.push(`numero_licitacao ILIKE $${paramIndex}`);
      params.push(`%${numero.toString().trim()}%`);
      paramIndex++;
    }

    if (situacao && situacao.toString().trim()) {
      conditions.push(`situacao ILIKE $${paramIndex}`);
      params.push(`%${situacao.toString().trim()}%`);
      paramIndex++;
    }

    if (cd_situacao && cd_situacao.toString().trim()) {
      conditions.push(`cd_situacao = $${paramIndex}`);
      params.push(parseInt(cd_situacao as string));
      paramIndex++;
    }

    if (ug_id && ug_id.toString().trim()) {
      conditions.push(`ug_id = $${paramIndex}`);
      params.push(parseInt(ug_id as string));
      paramIndex++;
    }

    if (dataInicio && dataInicio.toString().trim()) {
      conditions.push(`dataAbertura_date >= $${paramIndex}`);
      params.push(dataInicio);
      paramIndex++;
    }

    if (dataFim && dataFim.toString().trim()) {
      conditions.push(`dataAbertura_date <= $${paramIndex}`);
      params.push(dataFim);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM microempresas_licitacoes 
      ${whereClause}
    `;

    // Map orderBy to actual database column
    let sortCol = 'dataabertura_date';
    if (orderBy === 'numero') sortCol = 'numero';
    if (orderBy === 'tipo_licitacao') sortCol = 'tipo_licitacao';
    
    // Query para buscar registros paginados
    const dataQuery = `
      SELECT 
        id,
        idlicitacao,
        numero,
        tipo_licitacao,
        objeto,
        dataabertura_date as data_abertura_iso,
        situacao,
        vencedor,
        razaosocial,
        cnpj,
        declaracaome,
        tipoempresa,
        valor_negociado,
        ug_id,
        cd_situacao
      FROM microempresas_licitacoes 
      ${whereClause}
      ORDER BY ${sortCol} ${orderDir === 'DESC' ? 'DESC' : 'ASC'}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Executar queries
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, [...params, limitNumber, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNumber);

    // Formatar dados para compatibilidade com o frontend
    const data = dataResult.rows.map((row: any) => {
      // Garantir formato YYYY-MM-DD para strings de data para evitar problemas de locale do servidor
      let dataIso = null;
      if (row.data_abertura_iso) {
        const d = new Date(row.data_abertura_iso);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dataIso = `${year}-${month}-${day}`;
        }
      }

      return {
        id: row.id,
        idlicitacao: row.idlicitacao,
        numero: row.numero,
        tipo_licitacao: row.tipo_licitacao,
        objeto: row.objeto,
        dataAberturaPropostas: dataIso,
        dataAberturaIso: dataIso,
        situacao: row.situacao,
        vencedor: row.vencedor,
        razaosocial: row.razaosocial,
        cnpj: row.cnpj,
        declaracaome: row.declaracaome,
        tipoempresa: row.tipoempresa,
        valor_negociado: row.valor_negociado,
        ug_id: row.ug_id,
        cd_situacao: row.cd_situacao
      };
    });

    res.json({
      data,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages
      },
      stats: {
        totalLicitacoes: total,
        totalParticipacoes: total, // Na nossa lógica 1 row = 1 vencedor
        participacoesME: total, // Simplificado, pois estamos focando em ME
        totalVencedores: total
      }
    });

  } catch (error) {
    console.error('❌ Erro ao carregar dados do banco:', error);
    res.status(500).json({
      error: 'Erro interno ao carregar dados'
    });
  }
};

export const getCollectedDataStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataInicio, dataFim, tipo } = req.query;
    
    // Construir WHERE clause baseado nos filtros para as estatísticas
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dataInicio && dataInicio.toString().trim()) {
      conditions.push(`dataabertura_date >= $${paramIndex}`);
      params.push(dataInicio);
      paramIndex++;
    }

    if (dataFim && dataFim.toString().trim()) {
      conditions.push(`dataabertura_date <= $${paramIndex}`);
      params.push(dataFim);
      paramIndex++;
    }

    if (tipo && tipo.toString().trim()) {
      // Tentar converter de ID para nome se for numérico, ou usar ILIKE se for texto
      if (!isNaN(Number(tipo))) {
        // Mapeamento simples para as modalidades mais comuns no dashboard
        const modalidadeMap: { [key: string]: string } = {
          '10': 'Concorrência',
          '12': 'Dispensa Eletrônica',
          '13': 'Pregão Eletrônico'
        };
        const nomeMod = modalidadeMap[tipo.toString()];
        if (nomeMod) {
          conditions.push(`tipo_licitacao ILIKE $${paramIndex}`);
          params.push(`%${nomeMod}%`);
          paramIndex++;
        }
      } else {
        conditions.push(`tipo_licitacao ILIKE $${paramIndex}`);
        params.push(`%${tipo.toString().trim()}%`);
        paramIndex++;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const statsQuery = `
      SELECT 
        COUNT(*) as total_registros,
        COUNT(DISTINCT numero) as total_licitacoes,
        COUNT(DISTINCT CASE WHEN vencedor = true THEN numero END) as total_vencedores_licitacao,
        COUNT(DISTINCT CASE WHEN vencedor = true AND declaracaome = true THEN id END) as vencedores_me
      FROM microempresas_licitacoes
      ${whereClause}
    `;

    const result = await pool.query(statsQuery, params);
    const stats = result.rows[0];

    const totalVencedores = parseInt(stats.total_registros || 0);
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
    console.error('❌ Erro ao buscar estatísticas ME/EPP:', error);
    res.status(500).json({ error: 'Erro interno ao buscar estatísticas ME/EPP' });
  }
};

export const getFilterOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        array_agg(DISTINCT tipo_licitacao ORDER BY tipo_licitacao) FILTER (WHERE tipo_licitacao IS NOT NULL) as tipos,
        array_agg(DISTINCT situacao ORDER BY situacao) FILTER (WHERE situacao IS NOT NULL) as situacoes,
        array_agg(DISTINCT cd_situacao ORDER BY cd_situacao) FILTER (WHERE cd_situacao IS NOT NULL) as codigos_situacao,
        array_agg(DISTINCT ug_id ORDER BY ug_id) FILTER (WHERE ug_id IS NOT NULL) as ugs
      FROM microempresas_licitacoes
    `;
    const result = await pool.query(query);
    const options = result.rows[0];
    
    res.json({
      tipos: options.tipos || [],
      situacoes: options.situacoes || [],
      codigosSituacao: options.codigos_situacao || [],
      ugs: options.ugs || []
    });
  } catch (error) {
    console.error('❌ Erro ao buscar opções de filtro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
    pcpSyncService.sincronizarTudo()
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

export const resetPcpData = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = 'TRUNCATE TABLE microempresas_licitacoes';
    await pool.query(query);
    res.json({ message: 'Dados do PCP removidos com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao resetar dados PCP:', error);
    res.status(500).json({ error: 'Erro interno ao resetar dados PCP' });
  }
};
