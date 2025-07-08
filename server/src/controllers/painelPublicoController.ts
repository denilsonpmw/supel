import { Request, Response } from 'express';
import pool from '../database/connection';
import { createError } from '../middleware/errorHandler';

/**
 * LÓGICA DO PAINEL PÚBLICO:
 * 
 * O painel exibe processos divididos em três grupos baseados na data_sessao:
 * - Semana Passada: Processos com data_sessao na semana anterior (seg-dom)
 * - Semana Atual: Processos com data_sessao na semana corrente (seg-dom)
 * - Próxima Semana: Processos com data_sessao na próxima semana (seg-dom)
 * 
 * IMPORTANTE: Embora a semana seja calculada de segunda a domingo para fins de
 * agrupamento, as sessões (data_sessao) ocorrem apenas de segunda a sexta-feira.
 * A data_sessao é a data do julgamento/sessão do processo.
 */

// Função utilitária para calcular início e fim de semana
// IMPORTANTE: A semana vai de segunda a domingo, mas as sessões (data_sessao) 
// ocorrem apenas de segunda a sexta-feira
function getWeekBounds(date: Date, weekOffset: number = 0) {
  // Criar uma nova data no timezone local para evitar problemas com UTC
  // Usar UTC para garantir consistência entre ambientes
  const targetDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayOfWeek = targetDate.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  // Início da semana (segunda-feira 00:00:00) em UTC
  const startOfWeek = new Date(targetDate);
  startOfWeek.setUTCDate(targetDate.getUTCDate() + mondayOffset + (weekOffset * 7));
  startOfWeek.setUTCHours(0, 0, 0, 0);
  
  // Fim da semana (domingo 23:59:59) em UTC
  // Nota: Embora as sessões ocorram apenas de seg-sex, calculamos até domingo
  // para garantir que processos de sexta-feira sejam incluídos corretamente
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
  endOfWeek.setUTCHours(23, 59, 59, 999);
  
  return { startOfWeek, endOfWeek };
}

// Obter processos da semana atual
export const getProcessosSemanaAtual = async (req: Request, res: Response) => {
  try {
    console.log('📊 Obtendo processos da semana atual...');

    // Calcular início e fim da semana atual (segunda a domingo) - usar data local
    const today = new Date();
    const { startOfWeek, endOfWeek } = getWeekBounds(today, 0);

    console.log(`📅 Hoje: ${today.toISOString()}`);
    console.log(`📅 Início da semana atual: ${startOfWeek.toISOString()} (${startOfWeek.toLocaleDateString('en-CA')})`);
    console.log(`📅 Fim da semana atual: ${endOfWeek.toISOString()} (${endOfWeek.toLocaleDateString('en-CA')})`);

    const query = `
      SELECT 
        p.id,
        p.nup,
        p.objeto,
        p.numero_ano,
        p.data_sessao,
        p.valor_estimado,
        
        -- Modalidade
        m.sigla_modalidade,
        m.nome_modalidade,
        m.cor_hex as modalidade_cor,
        
        -- Responsável
        r.primeiro_nome,
        r.nome_responsavel,
        
        -- Situação
        s.nome_situacao,
        s.cor_hex as situacao_cor,
        s.eh_finalizadora,
        
        -- Unidade Gestora
        ug.sigla as sigla_unidade
        
      FROM processos p
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      LEFT JOIN responsaveis r ON p.responsavel_id = r.id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
      LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
      WHERE DATE(p.data_sessao) >= DATE($1) AND DATE(p.data_sessao) <= DATE($2)
      ORDER BY p.data_sessao ASC, p.numero_ano ASC
    `;

    const result = await pool.query(query, [
      startOfWeek.toLocaleDateString('en-CA'), // YYYY-MM-DD format
      endOfWeek.toLocaleDateString('en-CA')
    ]);
    
    console.log(`✅ Encontrados ${result.rows.length} processos da semana atual`);

    const dadosResposta = {
      periodo: {
        inicio: startOfWeek.toISOString(),
        fim: endOfWeek.toISOString(),
        descricao: 'Semana Atual'
      },
      total_processos: result.rows.length,
      processos: result.rows
    };

    res.json(dadosResposta);
  } catch (error) {
    console.error('❌ Erro ao obter processos da semana atual:', error);
    throw createError('Erro ao carregar processos da semana atual', 500);
  }
};

// Obter processos da semana passada
export const getProcessosSemanaPassada = async (req: Request, res: Response) => {
  try {
    console.log('📊 Obtendo processos da semana passada...');

    // Calcular início e fim da semana passada
    const today = new Date();
    const { startOfWeek: startOfLastWeek, endOfWeek: endOfLastWeek } = getWeekBounds(today, -1);

    console.log(`📅 Hoje: ${today.toISOString()}`);
    console.log(`📅 Início da semana passada: ${startOfLastWeek.toISOString()} (${startOfLastWeek.toLocaleDateString('en-CA')})`);
    console.log(`📅 Fim da semana passada: ${endOfLastWeek.toISOString()} (${endOfLastWeek.toLocaleDateString('en-CA')})`);

    const query = `
      SELECT 
        p.id,
        p.nup,
        p.objeto,
        p.numero_ano,
        p.data_sessao,
        p.data_situacao,
        p.valor_estimado,
        
        -- Modalidade
        m.sigla_modalidade,
        m.nome_modalidade,
        m.cor_hex as modalidade_cor,
        
        -- Responsável
        r.primeiro_nome,
        r.nome_responsavel,
        
        -- Situação
        s.nome_situacao,
        s.cor_hex as situacao_cor,
        s.eh_finalizadora,
        
        -- Unidade Gestora
        ug.sigla as sigla_unidade
        
      FROM processos p
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      LEFT JOIN responsaveis r ON p.responsavel_id = r.id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
      LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
      WHERE DATE(p.data_sessao) >= DATE($1) AND DATE(p.data_sessao) <= DATE($2)
      ORDER BY p.data_sessao ASC, p.numero_ano ASC
    `;

    const result = await pool.query(query, [
      startOfLastWeek.toLocaleDateString('en-CA'), // YYYY-MM-DD format
      endOfLastWeek.toLocaleDateString('en-CA')
    ]);
    
    console.log(`✅ Encontrados ${result.rows.length} processos da semana passada`);

    const dadosResposta = {
      periodo: {
        inicio: startOfLastWeek.toISOString(),
        fim: endOfLastWeek.toISOString(),
        descricao: 'Semana Passada'
      },
      total_processos: result.rows.length,
      processos: result.rows
    };

    res.json(dadosResposta);
  } catch (error) {
    console.error('❌ Erro ao obter processos da semana passada:', error);
    throw createError('Erro ao carregar processos da semana passada', 500);
  }
};

// Obter processos da próxima semana
export const getProcessosProximaSemana = async (req: Request, res: Response) => {
  try {
    console.log('📊 Obtendo processos da próxima semana...');

    // Calcular início e fim da próxima semana
    const today = new Date();
    const { startOfWeek: startOfNextWeek, endOfWeek: endOfNextWeek } = getWeekBounds(today, 1);

    console.log(`📅 Hoje: ${today.toISOString()}`);
    console.log(`📅 Início da próxima semana: ${startOfNextWeek.toISOString()} (${startOfNextWeek.toLocaleDateString('en-CA')})`);
    console.log(`📅 Fim da próxima semana: ${endOfNextWeek.toISOString()} (${endOfNextWeek.toLocaleDateString('en-CA')})`);

    const query = `
      SELECT 
        p.id,
        p.nup,
        p.objeto,
        p.numero_ano,
        p.data_sessao,
        p.valor_estimado,
        
        -- Modalidade
        m.sigla_modalidade,
        m.nome_modalidade,
        m.cor_hex as modalidade_cor,
        
        -- Responsável
        r.primeiro_nome,
        r.nome_responsavel,
        
        -- Situação
        s.nome_situacao,
        s.cor_hex as situacao_cor,
        s.eh_finalizadora,
        
        -- Unidade Gestora
        ug.sigla as sigla_unidade
        
      FROM processos p
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      LEFT JOIN responsaveis r ON p.responsavel_id = r.id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
      LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
      WHERE DATE(p.data_sessao) >= DATE($1) AND DATE(p.data_sessao) <= DATE($2)
      ORDER BY p.data_sessao ASC, p.numero_ano ASC
    `;

    const result = await pool.query(query, [
      startOfNextWeek.toLocaleDateString('en-CA'), // YYYY-MM-DD format
      endOfNextWeek.toLocaleDateString('en-CA')
    ]);
    
    console.log(`✅ Encontrados ${result.rows.length} processos da próxima semana`);

    const dadosResposta = {
      periodo: {
        inicio: startOfNextWeek.toISOString(),
        fim: endOfNextWeek.toISOString(),
        descricao: 'Próxima Semana'
      },
      total_processos: result.rows.length,
      processos: result.rows
    };

    res.json(dadosResposta);
  } catch (error) {
    console.error('❌ Erro ao obter processos da próxima semana:', error);
    throw createError('Erro ao carregar processos da próxima semana', 500);
  }
};

// Obter todos os dados do painel público de uma vez
export const getDadosPainelPublico = async (req: Request, res: Response) => {
  try {
    console.log('📊 Obtendo todos os dados do painel público...');

    // Calcular as três semanas
    const today = new Date();
    
    // Usar função utilitária para garantir consistência
    const lastWeek = getWeekBounds(today, -1);
    const currentWeek = getWeekBounds(today, 0);
    const nextWeek = getWeekBounds(today, 1);

    const startOfLastWeek = lastWeek.startOfWeek;
    const endOfLastWeek = lastWeek.endOfWeek;
    const startOfWeek = currentWeek.startOfWeek;
    const endOfWeek = currentWeek.endOfWeek;
    const startOfNextWeek = nextWeek.startOfWeek;
    const endOfNextWeek = nextWeek.endOfWeek;

    console.log(`📅 Dados Completos - Hoje: ${today.toISOString()}`);
    console.log(`📅 Semana Passada: ${startOfLastWeek.toISOString()} até ${endOfLastWeek.toISOString()}`);
    console.log(`📅 Semana Atual: ${startOfWeek.toISOString()} até ${endOfWeek.toISOString()}`);
    console.log(`📅 Próxima Semana: ${startOfNextWeek.toISOString()} até ${endOfNextWeek.toISOString()}`);

    const query = `
      SELECT 
        p.id,
        p.nup,
        p.objeto,
        p.numero_ano,
        p.data_sessao,
        p.data_situacao,
        p.valor_estimado,
        
        -- Modalidade
        m.sigla_modalidade,
        m.nome_modalidade,
        m.cor_hex as modalidade_cor,
        
        -- Responsável
        r.primeiro_nome,
        r.nome_responsavel,
        
        -- Situação
        s.nome_situacao,
        s.cor_hex as situacao_cor,
        s.eh_finalizadora,
        
        -- Unidade Gestora
        ug.sigla as sigla_unidade,
        
        -- Classificação da semana (usando apenas a data, ignorando horário)
        CASE 
          WHEN DATE(p.data_sessao) >= DATE($1) AND DATE(p.data_sessao) <= DATE($2) THEN 'passada'
          WHEN DATE(p.data_sessao) >= DATE($3) AND DATE(p.data_sessao) <= DATE($4) THEN 'atual'
          WHEN DATE(p.data_sessao) >= DATE($5) AND DATE(p.data_sessao) <= DATE($6) THEN 'proxima'
        END as semana_tipo
        
      FROM processos p
      LEFT JOIN modalidades m ON p.modalidade_id = m.id
      LEFT JOIN responsaveis r ON p.responsavel_id = r.id
      LEFT JOIN situacoes s ON p.situacao_id = s.id
      LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
      WHERE (DATE(p.data_sessao) >= DATE($1) AND DATE(p.data_sessao) <= DATE($2))
         OR (DATE(p.data_sessao) >= DATE($3) AND DATE(p.data_sessao) <= DATE($4))
         OR (DATE(p.data_sessao) >= DATE($5) AND DATE(p.data_sessao) <= DATE($6))
      ORDER BY p.data_sessao ASC, p.numero_ano ASC
    `;

    const result = await pool.query(query, [
      startOfLastWeek.toLocaleDateString('en-CA'), endOfLastWeek.toLocaleDateString('en-CA'),
      startOfWeek.toLocaleDateString('en-CA'), endOfWeek.toLocaleDateString('en-CA'),
      startOfNextWeek.toLocaleDateString('en-CA'), endOfNextWeek.toLocaleDateString('en-CA')
    ]);

    // Separar processos por semana
    const processosSemanaPassada = result.rows.filter(row => row.semana_tipo === 'passada');
    const processosSemanaAtual = result.rows.filter(row => row.semana_tipo === 'atual');
    const processosProximaSemana = result.rows.filter(row => row.semana_tipo === 'proxima');

    console.log(`✅ Dados do painel: ${processosSemanaPassada.length} (passada), ${processosSemanaAtual.length} (atual), ${processosProximaSemana.length} (próxima)`);

    const dadosResposta = {
      data_atualizacao: new Date().toISOString(),
      semana_passada: {
        periodo: {
          inicio: startOfLastWeek.toISOString(),
          fim: endOfLastWeek.toISOString(),
          descricao: 'Semana Passada'
        },
        total_processos: processosSemanaPassada.length,
        processos: processosSemanaPassada
      },
      semana_atual: {
        periodo: {
          inicio: startOfWeek.toISOString(),
          fim: endOfWeek.toISOString(),
          descricao: 'Semana Atual'
        },
        total_processos: processosSemanaAtual.length,
        processos: processosSemanaAtual
      },
      proxima_semana: {
        periodo: {
          inicio: startOfNextWeek.toISOString(),
          fim: endOfNextWeek.toISOString(),
          descricao: 'Próxima Semana'
        },
        total_processos: processosProximaSemana.length,
        processos: processosProximaSemana
      },
      total_geral: result.rows.length
    };

    res.json(dadosResposta);
  } catch (error) {
    console.error('❌ Erro ao obter dados do painel público:', error);
    throw createError('Erro ao carregar dados do painel público', 500);
  }
};
