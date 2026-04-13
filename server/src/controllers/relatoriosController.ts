import { Request, Response } from 'express';
import pool from '../database/connection';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Função utilitária para formatar datas do PostgreSQL para YYYY-MM-DD
const formatDate = (date: any): string | null => {
  if (!date) return null;
  // Se já estiver no formato 'YYYY-MM-DD', retorna direto
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  // Se vier como string ISO (ex: '2024-06-07T00:00:00.000Z'), extrai só a data
  if (typeof date === 'string' && date.includes('T')) return (date.split('T')[0] || null);
  // Se vier como Date
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
};

/*
 * =================================================================================
 *  Controlador de Relatórios (RelatóriosController)
 * ---------------------------------------------------------------------------------
 *  Este arquivo concentra todas as rotas de geração de relatórios do sistema SUPEL.
 *  Principais responsabilidades:
 *    • Listar relatórios disponíveis para o frontend.
 *    • Gerar relatórios tabulares em JSON para Processos, Economicidade e Criticidade.
 *    • Aplicar filtros dinâmicos recebidos via query-string.
 *    • Respeitar as regras de permissão: usuários comuns visualizam apenas
 *      processos associados ao seu responsável, enquanto administradores têm
 *      acesso irrestrito.
 *    • Retornar estatísticas adicionais utilizadas por gráficos.
 *
 *  IMPORTANTE: a exportação em PDF ainda não foi implementada. Atualmente os
 *  relatórios retornam dados em formato JSON, e a exportação Excel é tratada no
 *  frontend.
 *
 *  Todas as consultas foram otimizadas para evitar N+1 e realizar agregações
 *  básicas no PostgreSQL quando possível. Caso adicione novos relatórios,
 *  mantenha esta filosofia de performance.
 * =================================================================================
 */

// Obter lista de relatórios disponíveis
export const getRelatoriosDisponiveis = async (req: Request, res: Response) => {
  try {
    const relatorios = [
      {
        id: 'processos-geral',
        nome: 'Relatório Geral de Processos',
        descricao: 'Relatório completo com todos os processos e suas informações',
        parametros: ['periodo', 'modalidade', 'situacao', 'unidade_gestora', 'responsavel'],
        formato: ['PDF', 'Excel']
      },
      {
        id: 'economicidade',
        nome: 'Relatório de Economicidade',
        descricao: 'Análise de economia gerada nos processos licitatórios',
        parametros: ['periodo', 'modalidade'],
        formato: ['PDF', 'Excel']
      },
      {
        id: 'modalidades',
        nome: 'Relatório por Modalidades',
        descricao: 'Distribuição e estatísticas por modalidade de licitação',
        parametros: ['periodo', 'modalidade'],
        formato: ['PDF', 'Excel']
      },
      {
        id: 'situacoes',
        nome: 'Relatório de Situações',
        descricao: 'Análise temporal das situações dos processos',
        parametros: ['periodo', 'situacao'],
        formato: ['PDF', 'Excel']
      },
      {
        id: 'criticos',
        nome: 'Relatório de Processos Críticos',
        descricao: 'Processos parados há mais de 15 dias',
        parametros: ['periodo', 'dias_limite'],
        formato: ['PDF', 'Excel']
      }
    ];

    res.json(relatorios);
  } catch (error) {
    console.error('Erro ao obter relatórios disponíveis:', error);
    throw createError('Erro ao carregar relatórios disponíveis', 500);
  }
};

// Gerar relatório de processos geral
export const gerarRelatorioProcessos = async (req: AuthRequest, res: Response) => {
  try {
    const {
      data_inicio,
      data_fim,
      data_entrada_inicio,
      data_entrada_fim,
      data_sessao_inicio,
      data_sessao_fim,
      data_situacao_inicio,
      data_situacao_fim,
      data_pncp_inicio,
      data_pncp_fim,
      data_tce_1_inicio,
      data_tce_1_fim,
      data_tce_2_inicio,
      data_tce_2_fim,
      modalidade_id,
      situacao_id,
      unidade_gestora_id,
      responsavel_id,
      formato = 'json'
    } = req.query;

    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    let whereConditions = ['1=1'];
    let queryParams: any[] = [];
    let paramCount = 0;

    // --- FILTROS DE DATA GRANULARES ---
    
    // Data de Entrada (retrocompatível com data_inicio/fim)
    const dEntradaInicio = data_entrada_inicio || data_inicio;
    if (dEntradaInicio) {
      paramCount++;
      whereConditions.push(`p.data_entrada >= $${paramCount}`);
      queryParams.push(dEntradaInicio);
    }
    const dEntradaFim = data_entrada_fim || data_fim;
    if (dEntradaFim) {
      paramCount++;
      whereConditions.push(`p.data_entrada <= $${paramCount}`);
      queryParams.push(dEntradaFim);
    }

    // Data da Sessão
    if (data_sessao_inicio) {
      paramCount++;
      whereConditions.push(`p.data_sessao >= $${paramCount}`);
      queryParams.push(data_sessao_inicio);
    }
    if (data_sessao_fim) {
      paramCount++;
      whereConditions.push(`p.data_sessao <= $${paramCount}`);
      queryParams.push(data_sessao_fim);
    }

    // Data da Situação
    if (data_situacao_inicio) {
      paramCount++;
      whereConditions.push(`p.data_situacao >= $${paramCount}`);
      queryParams.push(data_situacao_inicio);
    }
    if (data_situacao_fim) {
      paramCount++;
      whereConditions.push(`p.data_situacao <= $${paramCount}`);
      queryParams.push(data_situacao_fim);
    }

    // Data PNCP
    if (data_pncp_inicio) {
      paramCount++;
      whereConditions.push(`p.data_pncp >= $${paramCount}`);
      queryParams.push(data_pncp_inicio);
    }
    if (data_pncp_fim) {
      paramCount++;
      whereConditions.push(`p.data_pncp <= $${paramCount}`);
      queryParams.push(data_pncp_fim);
    }

    // Data TCE 1
    if (data_tce_1_inicio) {
      paramCount++;
      whereConditions.push(`p.data_tce_1 >= $${paramCount}`);
      queryParams.push(data_tce_1_inicio);
    }
    if (data_tce_1_fim) {
      paramCount++;
      whereConditions.push(`p.data_tce_1 <= $${paramCount}`);
      queryParams.push(data_tce_1_fim);
    }

    // Data TCE 2
    if (data_tce_2_inicio) {
      paramCount++;
      whereConditions.push(`p.data_tce_2 >= $${paramCount}`);
      queryParams.push(data_tce_2_inicio);
    }
    if (data_tce_2_fim) {
      paramCount++;
      whereConditions.push(`p.data_tce_2 <= $${paramCount}`);
      queryParams.push(data_tce_2_fim);
    }

    // --- OUTROS FILTROS ---

    if (modalidade_id && modalidade_id !== 'all') {
      const modalidadeIds = Array.isArray(modalidade_id) ? modalidade_id : [modalidade_id];
      if (modalidadeIds.length > 0) {
        const placeholders = modalidadeIds.map(() => `$${++paramCount}`).join(',');
        whereConditions.push(`p.modalidade_id IN (${placeholders})`);
        queryParams.push(...modalidadeIds);
      }
    }

    if (situacao_id && situacao_id !== 'all') {
      const situacaoIds = Array.isArray(situacao_id) ? situacao_id : [situacao_id];
      if (situacaoIds.length > 0) {
        const placeholders = situacaoIds.map(() => `$${++paramCount}`).join(',');
        whereConditions.push(`p.situacao_id IN (${placeholders})`);
        queryParams.push(...situacaoIds);
      }
    }

    if (unidade_gestora_id && unidade_gestora_id !== 'all') {
      const ugIds = Array.isArray(unidade_gestora_id) ? unidade_gestora_id : [unidade_gestora_id];
      if (ugIds.length > 0) {
        const placeholders = ugIds.map(() => `$${++paramCount}`).join(',');
        whereConditions.push(`p.ug_id IN (${placeholders})`);
        queryParams.push(...ugIds);
      }
    }

    if (responsavel_id && responsavel_id !== 'all') {
      const responsavelIds = Array.isArray(responsavel_id) ? responsavel_id : [responsavel_id];
      if (responsavelIds.length > 0) {
        const placeholders = responsavelIds.map(() => `$${++paramCount}`).join(',');
        whereConditions.push(`p.responsavel_id IN (${placeholders})`);
        queryParams.push(...responsavelIds);
      }
    }

    const query = `
      SELECT 
        p.id,
        p.nup,
        p.objeto,
        p.numero_ano,
        p.data_entrada,
        p.data_sessao,
        p.data_pncp,
        p.data_tce_1,
        p.data_tce_2,
        p.valor_estimado,
        p.valor_realizado,
        p.desagio,
        p.percentual_reducao,
        p.data_situacao,
        p.conclusao,
        p.rp,
        p.observacoes,
        
        -- Modalidade
        m.sigla_modalidade as modalidade_sigla,
        m.nome_modalidade as modalidade_nome,
        m.cor_hex as modalidade_cor,
        
        -- Unidade Gestora
        ug.sigla as unidade_gestora_sigla,
        ug.nome_completo_unidade as unidade_gestora_nome,
        
        -- Responsável
        r.primeiro_nome as responsavel_primeiro_nome,
        r.nome_responsavel as responsavel_nome_completo,
        
        -- Situação
        s.nome_situacao,
        s.cor_hex as situacao_cor,
        s.eh_finalizadora,
        
        -- Cálculos
        CURRENT_DATE - p.data_situacao as dias_na_situacao,
        CASE 
          WHEN p.valor_realizado IS NOT NULL AND p.valor_estimado > 0 
          THEN ROUND(((p.valor_estimado - p.valor_realizado) / p.valor_estimado * 100), 2)
          ELSE NULL 
        END as economia_percentual
        
      FROM processos p
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
      LEFT JOIN responsaveis r ON p.responsavel_id = r.id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
      WHERE ${whereConditions.join(' AND ')}
      ${userFilter}
      ORDER BY p.data_entrada DESC, p.id DESC
    `;

    const result = await pool.query(query, queryParams);
    
    // Estatísticas do relatório
    const estatisticas = {
      total_processos: result.rows.length,
      valor_estimado_total: result.rows.reduce((sum, row) => sum + (parseFloat(row.valor_estimado) || 0), 0),
      valor_realizado_total: result.rows.reduce((sum, row) => sum + (parseFloat(row.valor_realizado) || 0), 0),
      processos_concluidos: result.rows.filter(row => row.conclusao).length,
      processos_em_andamento: result.rows.filter(row => !row.conclusao).length,
      economia_total: result.rows.reduce((sum, row) => {
        if (row.valor_realizado && row.valor_estimado) {
          return sum + (parseFloat(row.valor_estimado) - parseFloat(row.valor_realizado));
        }
        return sum;
      }, 0),
      modalidades_utilizadas: [...new Set(result.rows.map(row => row.modalidade_nome))].length,
      unidades_gestoras_envolvidas: [...new Set(result.rows.map(row => row.unidade_gestora_nome))].length
    };

    // Verificar se o usuário é responsável
    const user = (req as any).user;
    let isResponsavel = false;
    let nomeResponsavel = null;

    if (user && user.perfil === 'usuario') {
      const responsavelResult = await pool.query(
        'SELECT nome_responsavel FROM responsaveis WHERE email = $1',
        [user.email]
      );
      
      if (responsavelResult.rows.length > 0) {
        isResponsavel = true;
        nomeResponsavel = responsavelResult.rows[0].nome_responsavel;
      }
    }

    // Adicionar informações do usuário ao resultado
    const userInfo = {
      perfil: user?.perfil || 'usuario',
      is_responsavel: isResponsavel,
      nome_responsavel: nomeResponsavel
    };

    // Formatar datas nos resultados
    const processosFormatados = result.rows.map(row => ({
      ...row,
      data_entrada: formatDate(row.data_entrada),
      data_sessao: formatDate(row.data_sessao),
      data_pncp: formatDate(row.data_pncp),
      data_tce_1: formatDate(row.data_tce_1),
      data_tce_2: formatDate(row.data_tce_2),
      data_situacao: formatDate(row.data_situacao)
    }));

    const relatorioData = {
      titulo: 'Relatório Geral de Processos',
      data_geracao: new Date().toISOString(),
      filtros_aplicados: {
        data_inicio: data_inicio || 'Não especificado',
        data_fim: data_fim || 'Não especificado',
        modalidade: modalidade_id && modalidade_id !== 'all' ? modalidade_id : 'Todas',
        situacao: situacao_id && situacao_id !== 'all' ? situacao_id : 'Todas',
        unidade_gestora: unidade_gestora_id && unidade_gestora_id !== 'all' ? unidade_gestora_id : 'Todas',
        responsavel: responsavel_id && responsavel_id !== 'all' ? responsavel_id : 'Todos'
      },
      estatisticas,
      processos: processosFormatados,
      // Informações sobre o usuário para lógica de responsável
      user_info: userInfo
    };

    res.json(relatorioData);
  } catch (error) {
    console.error('❌ Erro ao gerar relatório de processos:', error);
    throw createError('Erro ao gerar relatório de processos', 500);
  }
};

// Gerar relatório de economicidade
export const gerarRelatorioEconomicidade = async (req: AuthRequest, res: Response) => {
  try {
    const { data_inicio, data_fim, modalidade_id } = req.query;

    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    let whereConditions = ['p.valor_realizado IS NOT NULL', 'p.valor_estimado > 0'];
    let queryParams: any[] = [];
    let paramCount = 0;

    if (data_inicio) {
      paramCount++;
      whereConditions.push(`p.data_entrada >= $${paramCount}`);
      queryParams.push(data_inicio);
    }

    if (data_fim) {
      paramCount++;
      whereConditions.push(`p.data_entrada <= $${paramCount}`);
      queryParams.push(data_fim);
    }

    if (modalidade_id && modalidade_id !== 'all') {
      const modalidadeIds = Array.isArray(modalidade_id) ? modalidade_id : [modalidade_id];
      if (modalidadeIds.length > 0) {
        const placeholders = modalidadeIds.map(() => `$${++paramCount}`).join(',');
        whereConditions.push(`p.modalidade_id IN (${placeholders})`);
        queryParams.push(...modalidadeIds);
      }
    }

    const query = `
      SELECT 
        p.id,
        p.nup,
        p.objeto,
        p.numero_ano,
        p.data_entrada,
        p.data_sessao,
        p.data_pncp,
        p.data_tce_1,
        p.data_tce_2,
        p.valor_estimado,
        p.valor_realizado,
        p.valor_estimado - p.valor_realizado as economia_absoluta,
        ROUND(((p.valor_estimado - p.valor_realizado) / p.valor_estimado * 100), 2) as economia_percentual,
        
        m.sigla_modalidade,
        m.nome_modalidade,
        ug.sigla as unidade_gestora,
        r.nome_responsavel as responsavel,
        s.nome_situacao
        
      FROM processos p
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
      LEFT JOIN responsaveis r ON p.responsavel_id = r.id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
      WHERE ${whereConditions.join(' AND ')}
      AND p.valor_realizado < p.valor_estimado
      ${userFilter}
      ORDER BY economia_absoluta DESC
    `;

    const result = await pool.query(query, queryParams);

    // Estatísticas de economicidade
    const estatisticas = {
      total_processos_com_economia: result.rows.length,
      economia_total: result.rows.reduce((sum, row) => sum + parseFloat(row.economia_absoluta), 0),
      economia_media_percentual: result.rows.length > 0 
        ? result.rows.reduce((sum, row) => sum + parseFloat(row.economia_percentual), 0) / result.rows.length 
        : 0,
      maior_economia: result.rows.length > 0 ? parseFloat(result.rows[0].economia_absoluta) : 0,
      menor_economia: result.rows.length > 0 ? parseFloat(result.rows[result.rows.length - 1].economia_absoluta) : 0
    };

    // Verificar se o usuário é responsável
    const user = (req as any).user;
    let isResponsavel = false;
    let nomeResponsavel = null;

    if (user && user.perfil === 'usuario') {
      const responsavelResult = await pool.query(
        'SELECT nome_responsavel FROM responsaveis WHERE email = $1',
        [user.email]
      );
      
      if (responsavelResult.rows.length > 0) {
        isResponsavel = true;
        nomeResponsavel = responsavelResult.rows[0].nome_responsavel;
      }
    }

    // Formatar datas nos resultados
    const processosFormatados = result.rows.map(row => ({
      ...row,
      data_entrada: formatDate(row.data_entrada),
      data_sessao: formatDate(row.data_sessao),
      data_pncp: formatDate(row.data_pncp),
      data_tce_1: formatDate(row.data_tce_1),
      data_tce_2: formatDate(row.data_tce_2)
    }));

    const relatorioData = {
      titulo: 'Relatório de Economicidade',
      data_geracao: new Date().toISOString(),
      estatisticas,
      processos: processosFormatados,
      // Informações sobre o usuário para lógica de responsável
      user_info: {
        perfil: user?.perfil || 'usuario',
        is_responsavel: isResponsavel,
        nome_responsavel: nomeResponsavel
      }
    };

    res.json(relatorioData);
  } catch (error) {
    console.error('❌ Erro ao gerar relatório de economicidade:', error);
    throw createError('Erro ao gerar relatório de economicidade', 500);
  }
};

// Gerar relatório de processos críticos
export const gerarRelatorioProcessosCriticos = async (req: AuthRequest, res: Response) => {
  try {
    const { dias_limite = 15 } = req.query;

    console.log(`🔄 Gerando relatório de processos críticos (>${dias_limite} dias)...`);

    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    const query = `
      SELECT 
        p.id,
        p.nup,
        p.objeto,
        p.numero_ano,
        p.data_entrada,
        p.data_sessao,
        p.data_pncp,
        p.data_tce_1,
        p.data_tce_2,
        p.data_situacao,
        CURRENT_DATE - p.data_situacao as dias_parado,
        p.valor_estimado,
        
        m.sigla_modalidade,
        m.nome_modalidade,
        ug.sigla as unidade_gestora,
        ug.nome_completo_unidade,
        r.nome_responsavel as responsavel,
        s.nome_situacao,
        s.cor_hex as situacao_cor
        
      FROM processos p
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
      LEFT JOIN responsaveis r ON p.responsavel_id = r.id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
      WHERE CURRENT_DATE - p.data_situacao >= $1
      AND s.eh_finalizadora = false
      ${userFilter}
      ORDER BY dias_parado DESC, p.valor_estimado DESC
    `;

    const result = await pool.query(query, [dias_limite]);

    const estatisticas = {
      total_processos_criticos: result.rows.length,
      dias_limite: parseInt(dias_limite as string),
      valor_total_parado: result.rows.reduce((sum, row) => sum + (parseFloat(row.valor_estimado) || 0), 0),
      maior_tempo_parado: result.rows.length > 0 ? parseInt(result.rows[0].dias_parado) : 0,
      distribuicao_por_situacao: {}
    };

    // Distribuição por situação
    const situacoes = [...new Set(result.rows.map(row => row.nome_situacao))];
    let distribuicao_por_situacao: Record<string, {quantidade:number, tempo_medio:number}> = {};
    situacoes.forEach(situacao => {
      const processosSituacao = result.rows.filter(row => row.nome_situacao === situacao);
      distribuicao_por_situacao[situacao] = {
        quantidade: processosSituacao.length,
        tempo_medio: Math.round(processosSituacao.reduce((sum, row) => sum + parseInt(row.dias_parado), 0) / processosSituacao.length)
      };
    });
    estatisticas.distribuicao_por_situacao = distribuicao_por_situacao;

    // Verificar se o usuário é responsável
    const user = (req as any).user;
    let isResponsavel = false;
    let nomeResponsavel = null;

    if (user && user.perfil === 'usuario') {
      const responsavelResult = await pool.query(
        'SELECT nome_responsavel FROM responsaveis WHERE email = $1',
        [user.email]
      );
      if (responsavelResult.rows.length > 0) {
        isResponsavel = true;
        nomeResponsavel = responsavelResult.rows[0].nome_responsavel;
      }
    }

    // Formatar datas nos resultados
    const processosFormatados = result.rows.map(row => ({
      ...row,
      data_entrada: formatDate(row.data_entrada),
      data_sessao: formatDate(row.data_sessao),
      data_pncp: formatDate(row.data_pncp),
      data_tce_1: formatDate(row.data_tce_1),
      data_tce_2: formatDate(row.data_tce_2),
      data_situacao: formatDate(row.data_situacao)
    }));

    const relatorioData = {
      titulo: 'Relatório de Processos Críticos',
      data_geracao: new Date().toISOString(),
      estatisticas,
      processos: processosFormatados,
      // Informações sobre o usuário para lógica de responsável
      user_info: {
        perfil: user?.perfil || 'usuario',
        is_responsavel: isResponsavel,
        nome_responsavel: nomeResponsavel
      }
    };

    res.json(relatorioData);
  } catch (error) {
    console.error('❌ Erro ao gerar relatório de processos críticos:', error);
    throw createError('Erro ao gerar relatório de processos críticos', 500);
  }
};

// Obter opções para filtros
export const getOpcoesRelatorios = async (req: Request, res: Response) => {
  try {
    console.log('🔄 Obtendo opções para filtros de relatórios...');

    const [modalidades, situacoes, unidadesGestoras, responsaveis] = await Promise.all([
      pool.query('SELECT id, sigla_modalidade, nome_modalidade FROM modalidades WHERE ativo = true ORDER BY sigla_modalidade'),
      pool.query('SELECT id, nome_situacao, cor_hex FROM situacoes WHERE ativo = true ORDER BY nome_situacao'),
      pool.query('SELECT id, sigla, nome_completo_unidade FROM unidades_gestoras WHERE ativo = true ORDER BY sigla'),
      pool.query('SELECT id, primeiro_nome, nome_responsavel FROM responsaveis WHERE ativo = true ORDER BY primeiro_nome')
    ]);

    const opcoes = {
      modalidades: modalidades.rows,
      situacoes: situacoes.rows,
      unidades_gestoras: unidadesGestoras.rows,
      responsaveis: responsaveis.rows
    };

    res.json(opcoes);
  } catch (error) {
    console.error('❌ Erro ao obter opções de relatórios:', error);
    throw createError('Erro ao carregar opções de filtros', 500);
  }
}; 