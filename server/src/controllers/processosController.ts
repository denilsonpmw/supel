import { Request, Response } from 'express';
import pool from '../database/connection';
import { Processo, ProcessoFilter } from '../types';
import { parse } from 'csv-parse';

// Função utilitária para formatar datas do PostgreSQL para YYYY-MM-DD
const formatDate = (date: any): string | null => {
  if (!date) return null;
  if (typeof date === 'string') return date;
  if (date instanceof Date) {
    const parts = date.toISOString().split('T');
    return parts[0] || null;
  }
  return null;
};

// Função utilitária para padronizar NUP para o formato completo
function padronizarNupCompleto(input: string): string {
  if (!input) return '';
  const limpo = input.replace(/[^0-9/]/g, '');
  const match = limpo.match(/^(\d{1,6})\/(\d{4})$/);
  if (match && match[1] && match[2]) {
    const numero = match[1].padStart(6, '0');
    const ano = match[2];
    return `00000.0.${numero}/${ano}`;
  }
  if (/^00000\.0\.\d{6}\/\d{4}$/.test(input)) {
    return input;
  }
  return limpo;
}

// Listar processos com filtros e paginação
export const listarProcessos = async (req: Request, res: Response) => {
  try {
    // console.log('🔍 Controller - Parâmetros recebidos:', req.query);
    // console.log('🔍 Controller - Search term:', req.query.search);
    
    const { 
      search,
      nup,
      ug_id,
      responsavel_id,
      modalidade_id,
      situacao_id,
      conclusao,
      rp,
      data_entrada_inicio,
      data_entrada_fim,
      valor_estimado_min,
      valor_estimado_max,
      page = 1, 
      limit = 10, 
      sort = 'data_entrada', 
      order = 'desc' 
    } = req.query;

    let baseQuery = `
      SELECT 
        p.id, p.nup, p.objeto, p.ug_id, p.data_entrada, p.responsavel_id, 
        p.modalidade_id, p.numero_ano, p.rp, p.data_sessao, p.data_pncp, 
        p.data_tce_1, p.valor_estimado, p.valor_realizado, p.desagio, 
        p.percentual_reducao, p.situacao_id, p.data_situacao, p.data_tce_2, 
        p.conclusao, p.observacoes, p.created_at, p.updated_at,
        ug.sigla as ug_sigla, ug.nome_completo_unidade,
        r.primeiro_nome, r.nome_responsavel,
        m.sigla_modalidade, m.nome_modalidade,
        s.nome_situacao, s.cor_hex, s.eh_finalizadora
      FROM processos p
      LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
      LEFT JOIN responsaveis r ON p.responsavel_id = r.id  
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
    `;

    let countQuery = `SELECT COUNT(*) as total FROM processos p`;
    const queryParams: any[] = [];
    const conditions: string[] = [];

    // Filtro por busca textual
    if (search) {
      // console.log('🔍 Aplicando filtro de busca para:', search);
      conditions.push(`(p.nup ILIKE $${queryParams.length + 1} OR p.objeto ILIKE $${queryParams.length + 1} OR p.numero_ano ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
      // console.log('🔍 Condição de busca adicionada');
    }

    // Filtro por NUP específico
    if (nup) {
      conditions.push(`p.nup ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${nup}%`);
    }

    // Filtro por Unidade Gestora
    if (ug_id) {
      conditions.push(`p.ug_id = $${queryParams.length + 1}`);
      queryParams.push(ug_id);
    }

    // Filtro por Responsável
    if (responsavel_id) {
      conditions.push(`p.responsavel_id = $${queryParams.length + 1}`);
      queryParams.push(responsavel_id);
    }

    // Filtro por Modalidade
    if (modalidade_id) {
      conditions.push(`p.modalidade_id = $${queryParams.length + 1}`);
      queryParams.push(modalidade_id);
    }

    // Filtro por Situação
    if (situacao_id) {
      conditions.push(`p.situacao_id = $${queryParams.length + 1}`);
      queryParams.push(situacao_id);
    }

    // Filtro por conclusão
    if (conclusao !== undefined) {
      conditions.push(`p.conclusao = $${queryParams.length + 1}`);
      queryParams.push(conclusao === 'true');
    }

    // Filtro por RP (Registro de Preço)
    if (rp !== undefined) {
      conditions.push(`p.rp = $${queryParams.length + 1}`);
      queryParams.push(rp === 'true');
    }

    // Filtro por período de entrada
    if (data_entrada_inicio) {
      conditions.push(`p.data_entrada >= $${queryParams.length + 1}`);
      queryParams.push(data_entrada_inicio);
    }

    if (data_entrada_fim) {
      conditions.push(`p.data_entrada <= $${queryParams.length + 1}`);
      queryParams.push(data_entrada_fim);
    }

    // Filtro por faixa de valor
    if (valor_estimado_min) {
      conditions.push(`p.valor_estimado >= $${queryParams.length + 1}`);
      queryParams.push(valor_estimado_min);
    }

    if (valor_estimado_max) {
      conditions.push(`p.valor_estimado <= $${queryParams.length + 1}`);
      queryParams.push(valor_estimado_max);
    }

    // Aplicar condições
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    // Ordenação
    const validSortFields = [
      'nup', 'objeto', 'data_entrada', 'valor_estimado', 'data_situacao',
      'data_sessao', 'responsavel'
    ];
    const sortStr = String(sort);
    const sortField = validSortFields.includes(sortStr) ? sortStr : 'data_entrada';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    // Corrigir tipo de ordenação conforme o campo
    let orderByClause = '';
    if ([
      'data_entrada', 'data_situacao', 'data_sessao'
    ].includes(sortField)) {
      // Para campos de data, colocar NULLs por último quando ordenando DESC
      if (sortField === 'data_sessao' && sortOrder === 'DESC') {
        orderByClause = ` ORDER BY p.${sortField}::date ${sortOrder} NULLS LAST`;
      } else {
        orderByClause = ` ORDER BY p.${sortField}::date ${sortOrder}`;
      }
    } else if (['valor_estimado'].includes(sortField)) {
      orderByClause = ` ORDER BY p.${sortField}::numeric ${sortOrder}`;
    } else if (sortField === 'responsavel') {
      orderByClause = ` ORDER BY r.primeiro_nome ${sortOrder}`;
    } else {
      orderByClause = ` ORDER BY p.${sortField} ${sortOrder}`;
    }
    baseQuery += orderByClause;

    // Paginação
    const offset = (Number(page) - 1) * Number(limit);
    baseQuery += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(Number(limit), offset);

    // Executar queries
    // console.log('🔍 Query final:', baseQuery);
    // console.log('🔍 Parâmetros da query:', queryParams);
    
    const [dataResult, countResult] = await Promise.all([
      pool.query(baseQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);
    
    // console.log('🔍 Resultados encontrados:', dataResult.rows.length);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    // Formatar dados com relacionamentos
    const processos = dataResult.rows.map(row => ({
      id: row.id,
      nup: row.nup,
      objeto: row.objeto,
      ug_id: row.ug_id,
      data_entrada: formatDate(row.data_entrada),
      responsavel_id: row.responsavel_id,
      modalidade_id: row.modalidade_id,
      numero_ano: row.numero_ano,
      rp: row.rp,
      data_sessao: formatDate(row.data_sessao),
      data_pncp: formatDate(row.data_pncp),
      data_tce_1: formatDate(row.data_tce_1),
      valor_estimado: parseFloat(row.valor_estimado),
      valor_realizado: row.valor_realizado ? parseFloat(row.valor_realizado) : null,
      desagio: row.desagio ? parseFloat(row.desagio) : null,
      percentual_reducao: row.percentual_reducao ? parseFloat(row.percentual_reducao) : null,
      situacao_id: row.situacao_id,
      data_situacao: formatDate(row.data_situacao),
      data_tce_2: formatDate(row.data_tce_2),
      conclusao: row.conclusao,
      observacoes: row.observacoes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      // Relacionamentos
      unidade_gestora: {
        sigla: row.ug_sigla,
        nome_completo_unidade: row.nome_completo_unidade
      },
      responsavel: {
        primeiro_nome: row.primeiro_nome,
        nome_responsavel: row.nome_responsavel
      },
      modalidade: {
        sigla_modalidade: row.sigla_modalidade,
        nome_modalidade: row.nome_modalidade
      },
      situacao: {
        nome_situacao: row.nome_situacao,
        cor_hex: row.cor_hex,
        eh_finalizadora: row.eh_finalizadora
      }
    }));

    res.json({
      data: processos,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
    return;
  } catch (error) {
    console.error('Erro ao listar processos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return;
  }
};

// Buscar processo por ID
export const buscarProcesso = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.id, p.nup, p.objeto, p.ug_id, p.data_entrada, p.responsavel_id, 
        p.modalidade_id, p.numero_ano, p.rp, p.data_sessao, p.data_pncp, 
        p.data_tce_1, p.valor_estimado, p.valor_realizado, p.desagio, 
        p.percentual_reducao, p.situacao_id, p.data_situacao, p.data_tce_2, 
        p.conclusao, p.observacoes, p.created_at, p.updated_at,
        ug.sigla as ug_sigla, ug.nome_completo_unidade,
        r.primeiro_nome, r.nome_responsavel,
        m.sigla_modalidade, m.nome_modalidade,
        s.nome_situacao, s.cor_hex, s.eh_finalizadora
      FROM processos p
      LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
      LEFT JOIN responsaveis r ON p.responsavel_id = r.id  
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Processo não encontrado' });
      return;
    }

    const row = result.rows[0];
    const processo = {
      id: row.id,
      nup: row.nup,
      objeto: row.objeto,
      ug_id: row.ug_id,
      data_entrada: formatDate(row.data_entrada),
      responsavel_id: row.responsavel_id,
      modalidade_id: row.modalidade_id,
      numero_ano: row.numero_ano,
      rp: row.rp,
      data_sessao: formatDate(row.data_sessao),
      data_pncp: formatDate(row.data_pncp),
      data_tce_1: formatDate(row.data_tce_1),
      valor_estimado: parseFloat(row.valor_estimado),
      valor_realizado: row.valor_realizado ? parseFloat(row.valor_realizado) : null,
      desagio: row.desagio ? parseFloat(row.desagio) : null,
      percentual_reducao: row.percentual_reducao ? parseFloat(row.percentual_reducao) : null,
      situacao_id: row.situacao_id,
      data_situacao: formatDate(row.data_situacao),
      data_tce_2: formatDate(row.data_tce_2),
      conclusao: row.conclusao,
      observacoes: row.observacoes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      // Relacionamentos
      unidade_gestora: {
        sigla: row.ug_sigla,
        nome_completo_unidade: row.nome_completo_unidade
      },
      responsavel: {
        primeiro_nome: row.primeiro_nome,
        nome_responsavel: row.nome_responsavel
      },
      modalidade: {
        sigla_modalidade: row.sigla_modalidade,
        nome_modalidade: row.nome_modalidade
      },
      situacao: {
        nome_situacao: row.nome_situacao,
        cor_hex: row.cor_hex,
        eh_finalizadora: row.eh_finalizadora
      }
    };

    res.json({ data: processo });
    return;

  } catch (error) {
    console.error('Erro ao buscar processo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return;
  }
};

// Criar novo processo
export const criarProcesso = async (req: Request, res: Response) => {
  try {
    const {
      nup, objeto, ug_id, data_entrada, responsavel_id, modalidade_id, 
      numero_ano, rp, data_sessao, data_pncp, data_tce_1, valor_estimado, 
      valor_realizado, desagio, percentual_reducao, situacao_id, data_situacao, 
      data_tce_2, conclusao, observacoes 
    } = req.body;

    // Validações obrigatórias
    if (!nup || !objeto || !ug_id || !situacao_id) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: nup, objeto, ug_id, situacao_id' 
      });
    }

    // Padronizar NUP para o formato completo
    const nupPadronizado = padronizarNupCompleto(nup);

    // Validar se NUP já existe
    const nupExists = await pool.query('SELECT id FROM processos WHERE nup = $1', [nupPadronizado]);
    if (nupExists.rows.length > 0) {
      return res.status(400).json({ error: 'NUP já existe no sistema' });
    }

    // Função auxiliar para converter strings vazias em null
    const convertEmptyToNull = (value: any) => {
      if (value === '' || value === undefined) return null;
      return value;
    };

    // Função auxiliar para converter valores numéricos
    const convertNumericValue = (value: any) => {
      if (value === '' || value === undefined || value === null) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    // Função auxiliar para tratar datas como local do Brasil (YYYY-MM-DD)
    function toDateLocalBr(dateStr: string) {
      if (!dateStr) return null;
      // Se já está no formato YYYY-MM-DD, retorna como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // Se vier com T, pega só a parte da data
      if (dateStr.includes('T')) return dateStr.split('T')[0];
      // Tenta converter para Date e formatar
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
      return null;
    }

    // Tratar campos de data - converter strings vazias para null
    const processedDataEntrada = convertEmptyToNull(data_entrada) ? toDateLocalBr(data_entrada) : new Date().toISOString().slice(0, 10);
    const processedDataSessao = convertEmptyToNull(data_sessao) ? toDateLocalBr(data_sessao) : null;
    const processedDataPncp = convertEmptyToNull(data_pncp) ? toDateLocalBr(data_pncp) : null;
    const processedDataTce1 = convertEmptyToNull(data_tce_1) ? toDateLocalBr(data_tce_1) : null;
    const processedDataSituacao = convertEmptyToNull(data_situacao) ? toDateLocalBr(data_situacao) : new Date().toISOString().slice(0, 10);
    const processedDataTce2 = convertEmptyToNull(data_tce_2) ? toDateLocalBr(data_tce_2) : null;

    // Tratar valores numéricos
    const processedValorEstimado = convertNumericValue(valor_estimado) || 0; // valor_estimado não pode ser null
    const processedValorRealizado = convertNumericValue(valor_realizado);

    // Calcular deságio e percentual de redução automaticamente
    let calculatedDesagio = convertNumericValue(desagio);
    let calculatedPercentualReducao = convertNumericValue(percentual_reducao);

    if (processedValorEstimado && processedValorRealizado) {
      calculatedDesagio = processedValorEstimado - processedValorRealizado;
      calculatedPercentualReducao = ((processedValorEstimado - processedValorRealizado) / processedValorEstimado) * 100;
    }

    const query = `
      INSERT INTO processos (
        nup, objeto, ug_id, data_entrada, responsavel_id, modalidade_id, 
        numero_ano, rp, data_sessao, data_pncp, data_tce_1, valor_estimado, 
        valor_realizado, desagio, percentual_reducao, situacao_id, data_situacao, 
        data_tce_2, conclusao, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const values = [
      nupPadronizado, 
      objeto, 
      ug_id, 
      processedDataEntrada, 
      responsavel_id || null, 
      modalidade_id || null,
      numero_ano, 
      rp || false, 
      processedDataSessao, 
      processedDataPncp, 
      processedDataTce1, 
      processedValorEstimado,
      processedValorRealizado, 
      calculatedDesagio, 
      calculatedPercentualReducao, 
      situacao_id, 
      processedDataSituacao, 
      processedDataTce2, 
      conclusao || false, 
      observacoes
    ];

    const result = await pool.query(query, values);
    
    

    res.status(201).json({ data: { message: 'Processo criado com sucesso' } });
    return;

  } catch (error) {
    console.error('Erro ao criar processo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return;
  }
};

// Atualizar processo
export const atualizarProcesso = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nup, objeto, ug_id, data_entrada, responsavel_id, modalidade_id, 
      numero_ano, rp, data_sessao, data_pncp, data_tce_1, valor_estimado, 
      valor_realizado, desagio, percentual_reducao, situacao_id, data_situacao, 
      data_tce_2, conclusao, observacoes 
    } = req.body;

    // Verificar se processo existe
    const processoExists = await pool.query('SELECT id FROM processos WHERE id = $1', [id]);
    if (processoExists.rows.length === 0) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }

    // Padronizar NUP para o formato completo
    const nupPadronizado = nup ? padronizarNupCompleto(nup) : undefined;

    // Validar se NUP já existe em outro processo
    if (nupPadronizado) {
      const nupExists = await pool.query('SELECT id FROM processos WHERE nup = $1 AND id != $2', [nupPadronizado, id]);
      if (nupExists.rows.length > 0) {
        return res.status(400).json({ error: 'NUP já existe em outro processo' });
      }
    }

    // Função auxiliar para converter strings vazias em null
    const convertEmptyToNull = (value: any) => {
      if (value === '' || value === undefined) return null;
      return value;
    };

    // Função auxiliar para converter valores numéricos
    const convertNumericValue = (value: any) => {
      if (value === '' || value === undefined || value === null) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    // Função auxiliar para tratar datas como local do Brasil (YYYY-MM-DD)
    function toDateLocalBr(dateStr: string) {
      if (!dateStr) return null;
      // Se já está no formato YYYY-MM-DD, retorna como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // Se vier com T, pega só a parte da data
      if (dateStr.includes('T')) return dateStr.split('T')[0];
      // Tenta converter para Date e formatar
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
      return null;
    }

    // Tratar campos de data - converter strings vazias para null
    const processedDataEntrada = convertEmptyToNull(data_entrada) ? toDateLocalBr(data_entrada) : null;
    const processedDataSessao = convertEmptyToNull(data_sessao) ? toDateLocalBr(data_sessao) : null;
    const processedDataPncp = convertEmptyToNull(data_pncp) ? toDateLocalBr(data_pncp) : null;
    const processedDataTce1 = convertEmptyToNull(data_tce_1) ? toDateLocalBr(data_tce_1) : null;
    const processedDataSituacao = convertEmptyToNull(data_situacao) ? toDateLocalBr(data_situacao) : null;
    const processedDataTce2 = convertEmptyToNull(data_tce_2) ? toDateLocalBr(data_tce_2) : null;

    // Tratar valores numéricos
    const processedValorEstimado = convertNumericValue(valor_estimado);
    const processedValorRealizado = convertNumericValue(valor_realizado);

    // Calcular deságio e percentual de redução automaticamente
    let calculatedDesagio = convertNumericValue(desagio);
    let calculatedPercentualReducao = convertNumericValue(percentual_reducao);

    if (processedValorEstimado && processedValorRealizado) {
      calculatedDesagio = processedValorEstimado - processedValorRealizado;
      calculatedPercentualReducao = ((processedValorEstimado - processedValorRealizado) / processedValorEstimado) * 100;
    }

    const query = `
      UPDATE processos SET
        nup = COALESCE($1, nup),
        objeto = COALESCE($2, objeto),
        ug_id = COALESCE($3, ug_id),
        data_entrada = COALESCE($4, data_entrada),
        responsavel_id = COALESCE($5, responsavel_id),
        modalidade_id = COALESCE($6, modalidade_id),
        numero_ano = COALESCE($7, numero_ano),
        rp = COALESCE($8, rp),
        data_sessao = COALESCE($9, data_sessao),
        data_pncp = COALESCE($10, data_pncp),
        data_tce_1 = COALESCE($11, data_tce_1),
        valor_estimado = COALESCE($12, valor_estimado),
        valor_realizado = COALESCE($13, valor_realizado),
        desagio = COALESCE($14, desagio),
        percentual_reducao = COALESCE($15, percentual_reducao),
        situacao_id = COALESCE($16, situacao_id),
        data_situacao = COALESCE($17, data_situacao),
        data_tce_2 = COALESCE($18, data_tce_2),
        conclusao = COALESCE($19, conclusao),
        observacoes = COALESCE($20, observacoes),
        updated_at = NOW()
      WHERE id = $21
      RETURNING *
    `;

    const values = [
      nupPadronizado, 
      objeto, 
      ug_id, 
      processedDataEntrada, 
      responsavel_id, 
      modalidade_id,
      numero_ano, 
      rp, 
      processedDataSessao, 
      processedDataPncp, 
      processedDataTce1, 
      processedValorEstimado,
      processedValorRealizado, 
      calculatedDesagio, 
      calculatedPercentualReducao, 
      situacao_id, 
      processedDataSituacao, 
      processedDataTce2, 
      conclusao, 
      observacoes, 
      id
    ];

    const result = await pool.query(query, values);
    
    

    res.json({ data: { message: 'Processo atualizado com sucesso' } });
    return;

  } catch (error) {
    console.error('Erro ao atualizar processo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return;
  }
};

// Excluir processo
export const excluirProcesso = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se processo existe
    const processoExists = await pool.query('SELECT id FROM processos WHERE id = $1', [id]);
    if (processoExists.rows.length === 0) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }

    await pool.query('DELETE FROM processos WHERE id = $1', [id]);

    res.json({ data: { message: 'Processo excluído com sucesso' } });
    return;

  } catch (error) {
    console.error('Erro ao excluir processo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return;
  }
};

// Estatísticas de processo individual
export const estatisticasProcessoIndividual = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar o processo com relacionamentos
    const processoQuery = `
      SELECT 
        p.id, p.nup, p.objeto, p.ug_id, p.data_entrada, p.responsavel_id, 
        p.modalidade_id, p.numero_ano, p.rp, p.data_sessao, p.data_pncp, 
        p.data_tce_1, p.valor_estimado, p.valor_realizado, p.desagio, 
        p.percentual_reducao, p.situacao_id, p.data_situacao, p.data_tce_2, 
        p.conclusao, p.observacoes, p.created_at, p.updated_at,
        ug.sigla as ug_sigla, ug.nome_completo_unidade,
        r.primeiro_nome, r.nome_responsavel,
        m.sigla_modalidade, m.nome_modalidade,
        s.nome_situacao, s.cor_hex, s.eh_finalizadora
      FROM processos p
      LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
      LEFT JOIN responsaveis r ON p.responsavel_id = r.id  
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
      WHERE p.id = $1
    `;

    const processoResult = await pool.query(processoQuery, [id]);
    
    if (processoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }

    const processo = processoResult.rows[0];

    // Calcular dias desde entrada
    const dataEntrada = new Date(processo.data_entrada);
    const hoje = new Date();
    const diasDesdeEntrada = Math.floor((hoje.getTime() - dataEntrada.getTime()) / (1000 * 60 * 60 * 24));

    // Calcular dias na situação atual
    const dataSituacao = new Date(processo.data_situacao);
    const diasSituacaoAtual = Math.floor((hoje.getTime() - dataSituacao.getTime()) / (1000 * 60 * 60 * 24));

    // Calcular economicidade
    let economiaValor = 0;
    let economiaPercentual = 0;
    
    if (processo.valor_realizado && processo.valor_estimado > 0) {
      economiaValor = processo.valor_estimado - processo.valor_realizado;
      economiaPercentual = (economiaValor / processo.valor_estimado) * 100;
    }

    const estatisticas = {
      id: processo.id,
      nup: processo.nup,
      objeto: processo.objeto,
      unidade_gestora: processo.nome_completo_unidade,
      responsavel: processo.nome_responsavel,
      modalidade: processo.nome_modalidade,
      situacao: processo.nome_situacao,
      observacoes: processo.observacoes,
      eh_finalizadora: processo.eh_finalizadora,
      valor_estimado: parseFloat(processo.valor_estimado),
      valor_realizado: processo.valor_realizado ? parseFloat(processo.valor_realizado) : null,
      economia_valor: economiaValor,
      economia_percentual: economiaPercentual,
      dias_desde_entrada: diasDesdeEntrada,
      dias_situacao_atual: diasSituacaoAtual,
      conclusao: processo.conclusao,
      data_entrada: processo.data_entrada,
      data_situacao: processo.data_situacao,
      data_sessao: processo.data_sessao
    };

    res.json({ data: estatisticas });
    return;

  } catch (error) {
    console.error('Erro ao obter estatísticas do processo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return;
  }
};

// Estatísticas de processos
export const estatisticasProcesso = async (req: Request, res: Response) => {
  try {
    const queries = [
      'SELECT COUNT(*) as total FROM processos',
      'SELECT COUNT(*) as concluidos FROM processos WHERE conclusao = true',
      'SELECT COUNT(*) as em_andamento FROM processos WHERE conclusao = false',
      'SELECT AVG(valor_estimado) as valor_medio FROM processos',
      'SELECT SUM(valor_estimado) as valor_total FROM processos',
      `SELECT 
         s.nome_situacao, 
         s.cor_hex,
         COUNT(p.id) as quantidade
       FROM situacoes s
       LEFT JOIN processos p ON s.id = p.situacao_id
       GROUP BY s.id, s.nome_situacao, s.cor_hex
       ORDER BY quantidade DESC`,
      `SELECT 
         m.nome_modalidade, 
         m.sigla_modalidade,
         COUNT(p.id) as quantidade
       FROM modalidades m
       LEFT JOIN processos p ON m.id = p.modalidade_id
       GROUP BY m.id, m.nome_modalidade, m.sigla_modalidade
       ORDER BY quantidade DESC`
    ];

    const [
      totalResult,
      concluidosResult,
      emAndamentoResult,
      valorMedioResult,
      valorTotalResult,
      porSituacaoResult,
      porModalidadeResult
    ] = await Promise.all(queries.map(query => pool.query(query)));

    const total = parseInt(totalResult?.rows?.[0]?.total || '0');
    const concluidos = parseInt(concluidosResult?.rows?.[0]?.concluidos || '0');
    const em_andamento = parseInt(emAndamentoResult?.rows?.[0]?.em_andamento || '0');
    const valor_medio = parseFloat(valorMedioResult?.rows?.[0]?.valor_medio || '0');
    const valor_total = parseFloat(valorTotalResult?.rows?.[0]?.valor_total || '0');
    const por_situacao = (porSituacaoResult?.rows || []).map(row => ({ ...row }));
    const por_modalidade = (porModalidadeResult?.rows || []).map(row => ({ ...row }));

    const estatisticas = {
      totais: {
        processos: total,
        concluidos,
        em_andamento,
        valor_medio,
        valor_total
      },
      por_situacao,
      por_modalidade
    };

    res.json({ data: estatisticas });
    return;

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return;
  }
};

// Importar processos via CSV
export const importarProcessosCSV = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      console.error('Erro: Nenhum arquivo foi enviado');
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    // Pré-processamento: remover BOM e aspas duplas do início/fim de todas as linhas
    const lines = csvContent.replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n');
    // console.log('Primeira linha (cabeçalho original):', lines[0]);
    
    // Remove aspas do início e fim de TODAS as linhas
    const linesClean = lines.map(line => line.replace(/^"+|"+$/g, ''));
    // console.log('Primeira linha (cabeçalho limpo):', linesClean[0]);
    if (linesClean.length > 1) {
      // console.log('Segunda linha (dados original):', lines[1]);
      // console.log('Segunda linha (dados limpo):', linesClean[1]);
    }
    
    const csvContentClean = linesClean.join('\n');
    let records: Record<string, any>[] = [];
    try {
      records = await new Promise<Record<string, any>[]>((resolve, reject) => {
        parse(csvContentClean, {
          columns: true,
          skip_empty_lines: true,
          delimiter: detectDelimiter(csvContentClean)
        }, (err: any, output: any) => {
          if (err) reject(err);
          else resolve(output);
        });
      });
    } catch (parseError) {
      console.error('Erro ao fazer parse do CSV:', parseError);
      return res.status(400).json({ error: 'Erro ao ler o arquivo CSV. Verifique o formato.' });
    }

    if (records.length === 0) {
      console.error('Erro: Arquivo CSV deve conter pelo menos o cabeçalho e uma linha de dados');
      return res.status(400).json({ error: 'Arquivo CSV deve conter pelo menos o cabeçalho e uma linha de dados' });
    }

    // Verificar se o campo obrigatório NUP está presente
    const requiredFields = ['nup'];
    const firstRecord = records[0];
    if (!firstRecord) {
      console.error('Erro: Primeira linha do CSV está vazia ou inválida');
      return res.status(400).json({ error: 'Primeira linha do CSV está vazia ou inválida' });
    }
    
    const missingFields = requiredFields.filter(field => !(field in firstRecord));
    if (missingFields.length > 0) {
      console.error(`Erro: Campo obrigatório ausente no CSV: ${missingFields.join(', ')}`);
      return res.status(400).json({ 
        error: `Campo obrigatório ausente no CSV: ${missingFields.join(', ')}` 
      });
    }

    let importados = 0;
    const erros: string[] = [];
    const warnings: string[] = [];
    const detalhes: Array<{
      linha: number;
      nup: string;
      status: 'sucesso' | 'erro' | 'warning';
      mensagem: string;
    }> = [];

    // Processar cada linha de dados
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      
      // Verificar se a linha é válida primeiro
      if (!row || typeof row !== 'object') {
        erros.push(`Linha ${i + 2}: Linha inválida ou vazia`);
        detalhes.push({
          linha: i + 2,
          nup: 'N/A',
          status: 'erro',
          mensagem: 'Linha inválida ou vazia'
        });
        continue;
      }

      try {
        // row é garantidamente válido devido à verificação acima
        const validRow = row as Record<string, any>;
        
        // Verificar se validRow tem as propriedades necessárias
        if (!validRow || typeof validRow !== 'object') {
          erros.push(`Linha ${i + 2}: Linha inválida`);
          detalhes.push({
            linha: i + 2,
            nup: 'N/A',
            status: 'erro',
            mensagem: 'Linha inválida'
          });
          continue;
        }
        
        // Validar dados obrigatórios
        const nup = validRow.nup;
        if (!nup || typeof nup !== 'string' || nup.trim() === '') {
          erros.push(`Linha ${i + 2}: NUP é obrigatório`);
          detalhes.push({
            linha: i + 2,
            nup: 'N/A',
            status: 'erro',
            mensagem: 'NUP é obrigatório'
          });
          continue;
        }

        // Verificar se NUP já existe
        const existingProcess = await pool.query('SELECT id FROM processos WHERE nup = $1', [nup]);
        if (existingProcess.rows.length > 0) {
          warnings.push(`Linha ${i + 2}: NUP ${nup} já existe - ignorado`);
          detalhes.push({
            linha: i + 2,
            nup,
            status: 'warning',
            mensagem: 'NUP já existe no sistema'
          });
          continue;
        }

        // Buscar IDs das referências (case-insensitive)
        const siglaUnidadeGestora = validRow.sigla_unidade_gestora;
        if (!siglaUnidadeGestora || typeof siglaUnidadeGestora !== 'string') {
          erros.push(`Linha ${i + 2}: Sigla da unidade gestora é obrigatória`);
          detalhes.push({
            linha: i + 2,
            nup,
            status: 'erro',
            mensagem: 'Sigla da unidade gestora é obrigatória'
          });
          continue;
        }
        
        const unidadeGestora = await pool.query(
          'SELECT id FROM unidades_gestoras WHERE LOWER(sigla) = LOWER($1) AND ativo = true',
          [siglaUnidadeGestora]
        );
        if (unidadeGestora.rows.length === 0 || !unidadeGestora.rows[0]) {
          erros.push(`Linha ${i + 2}: Unidade gestora '${validRow.sigla_unidade_gestora}' não encontrada`);
          detalhes.push({
            linha: i + 2,
            nup,
            status: 'erro',
            mensagem: `Unidade gestora '${validRow.sigla_unidade_gestora}' não encontrada`
          });
          continue;
        }

        const responsavel = await pool.query(
          'SELECT id FROM responsaveis WHERE LOWER(primeiro_nome) = LOWER($1) AND ativo = true',
          [validRow.nome_responsavel]
        );
        if (responsavel.rows.length === 0 || !responsavel.rows[0]) {
          erros.push(`Linha ${i + 2}: Responsável '${validRow.nome_responsavel}' não encontrado`);
          detalhes.push({
            linha: i + 2,
            nup,
            status: 'erro',
            mensagem: `Responsável '${validRow.nome_responsavel}' não encontrado`
          });
          continue;
        }

        const modalidade = await pool.query(
          'SELECT id FROM modalidades WHERE LOWER(sigla_modalidade) = LOWER($1) AND ativo = true',
          [validRow.sigla_modalidade]
        );
        if (modalidade.rows.length === 0 || !modalidade.rows[0]) {
          erros.push(`Linha ${i + 2}: Modalidade '${validRow.sigla_modalidade}' não encontrada`);
          detalhes.push({
            linha: i + 2,
            nup,
            status: 'erro',
            mensagem: `Modalidade '${validRow.sigla_modalidade}' não encontrada`
          });
          continue;
        }

        const situacao = await pool.query(
          'SELECT id FROM situacoes WHERE LOWER(nome_situacao) = LOWER($1) AND ativo = true',
          [validRow.nome_situacao]
        );
        if (situacao.rows.length === 0 || !situacao.rows[0]) {
          erros.push(`Linha ${i + 2}: Situação '${validRow.nome_situacao}' não encontrada`);
          detalhes.push({
            linha: i + 2,
            nup,
            status: 'erro',
            mensagem: `Situação '${validRow.nome_situacao}' não encontrada`
          });
          continue;
        }

        // Função auxiliar para converter valores monetários brasileiros (com vírgula)
        const convertBrazilianNumeric = (value: any) => {
          if (!value || value === '' || value === undefined || value === null) return null;
          
          // Converter para string primeiro
          let stringValue = String(value).trim();
          
          // Remover símbolos monetários e espaços
          stringValue = stringValue.replace(/[R$\s]/g, '');
          
          // Se tem vírgula e ponto, assume formato brasileiro (1.234.567,89)
          if (stringValue.includes(',') && stringValue.includes('.')) {
            // Remove pontos (milhares) e substitui vírgula por ponto (decimal)
            stringValue = stringValue.replace(/\./g, '').replace(',', '.');
          }
          // Se tem apenas vírgula, assume que é decimal brasileiro (1234,89)
          else if (stringValue.includes(',') && !stringValue.includes('.')) {
            stringValue = stringValue.replace(',', '.');
          }
          // Se tem apenas ponto, pode ser americano (1234.89) ou brasileiro de milhares (1.234)
          // Assume americano se tiver 1-2 dígitos após o ponto, senão remove o ponto
          else if (stringValue.includes('.')) {
            const parts = stringValue.split('.');
            const lastPart = parts[parts.length - 1];
            if (parts.length > 0 && lastPart && lastPart.length <= 2) {
              // Provavelmente é decimal americano, manter como está
            } else {
              // Provavelmente é separador de milhares brasileiro, remover
              stringValue = stringValue.replace(/\./g, '');
            }
          }
          
          const parsed = parseFloat(stringValue);
          return isNaN(parsed) ? null : parsed;
        };

        // Extrair IDs com verificação de segurança
        const ugId = unidadeGestora.rows[0]?.id;
        const responsavelId = responsavel.rows[0]?.id;
        const modalidadeId = modalidade.rows[0]?.id;
        const situacaoId = situacao.rows[0]?.id;

        // Verificar se todos os IDs foram encontrados
        if (!ugId || !responsavelId || !modalidadeId || !situacaoId) {
          erros.push(`Linha ${i + 2}: Erro interno - IDs de referência não encontrados`);
          detalhes.push({
            linha: i + 2,
            nup,
            status: 'erro',
            mensagem: 'Erro interno - IDs de referência não encontrados'
          });
          continue;
        }

        // Preparar dados para inserção (validRow já foi validado anteriormente)
        const processedData = {
          nup: validRow.nup,
          objeto: validRow.objeto,
          ug_id: ugId,
          data_entrada: validRow.data_entrada || new Date().toISOString().split('T')[0],
          responsavel_id: responsavelId,
          modalidade_id: modalidadeId,
          numero_ano: validRow.numero_ano || null,
          rp: validRow.rp === 'true' || validRow.rp === 'verdadeiro' || validRow.rp === '1' || validRow.rp?.toLowerCase() === 'sim',
          data_sessao: validRow.data_sessao || null,
          data_pncp: validRow.data_pncp || null,
          data_tce_1: validRow.data_tce_1 || null,
          valor_estimado: convertBrazilianNumeric(validRow.valor_estimado) || 0,
          valor_realizado: convertBrazilianNumeric(validRow.valor_realizado),
          situacao_id: situacaoId,
          data_situacao: validRow.data_situacao || new Date().toISOString().split('T')[0],
          data_tce_2: validRow.data_tce_2 || null,
          conclusao: validRow.conclusao === 'true' || validRow.conclusao === 'verdadeiro' || validRow.conclusao === '1' || validRow.conclusao?.toLowerCase() === 'sim',
          observacoes: validRow.observacoes || null
        };

        // Inserir processo
        const insertQuery = `
          INSERT INTO processos (
            nup, objeto, ug_id, data_entrada, responsavel_id, modalidade_id, 
            numero_ano, rp, data_sessao, data_pncp, data_tce_1, valor_estimado, 
            valor_realizado, situacao_id, data_situacao, data_tce_2, conclusao, observacoes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `;

        await pool.query(insertQuery, [
          processedData.nup,
          processedData.objeto,
          processedData.ug_id,
          processedData.data_entrada,
          processedData.responsavel_id,
          processedData.modalidade_id,
          processedData.numero_ano || null,
          processedData.rp,
          processedData.data_sessao,
          processedData.data_pncp,
          processedData.data_tce_1,
          processedData.valor_estimado,
          processedData.valor_realizado,
          processedData.situacao_id,
          processedData.data_situacao,
          processedData.data_tce_2,
          processedData.conclusao,
          processedData.observacoes
        ]);

        importados++;
        detalhes.push({
          linha: i + 2,
          nup,
          status: 'sucesso',
          mensagem: 'Processo importado com sucesso'
        });

      } catch (error: any) {
        console.error(`Erro na linha ${i + 2}:`, error);
        erros.push(`Linha ${i + 2}: ${error.message}`);
        detalhes.push({
          linha: i + 2,
          nup: row?.nup || 'N/A',
          status: 'erro',
          mensagem: error.message
        });
      }
    }

    res.json({
      total: records.length, // Excluir cabeçalho
      importados,
      erros,
      warnings,
      detalhes
    });
    return;
  } catch (error: any) {
    console.error('Erro na importação CSV:', error);
    res.status(500).json({ error: 'Erro interno do servidor durante a importação' });
    return;
  }
};

function detectDelimiter(csv: string): string {
  if (csv.includes(';')) return ';';
  return ',';
} 