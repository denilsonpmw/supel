import pool from '../database/connection.js';
import { pcpApiService, PcpLicitacaoResumo } from './pcpApiService';
import { syncStatusManager } from './SyncStatusManager';

export class PcpSyncService {
  /**
   * Sincroniza os dados do PCP para todas as unidades mapeadas
   */
  async sincronizarTudo(anos: number[] = []): Promise<any> {
    try {
      // Se não informar anos, calcular automaticamente de 2025 até o ano atual
      if (anos.length === 0) {
        const currentYear = new Date().getFullYear();
        for (let y = 2025; y <= currentYear; y++) {
          anos.push(y);
        }
      }
      
      console.log(`🚀 Iniciando sincronização global para os anos: ${anos.join(', ')}`);

      // Limpar registros antigos que podem ter sido sincronizados por engano anteriormente (2022, 2023, 2024)
      // Agora também limpamos baseados na data de abertura real, para ser mais rigoroso
      await pool.query("DELETE FROM microempresas_licitacoes WHERE ano < 2025 OR dataabertura_date < '2025-01-01'");
      console.log('🧹 Limpeza rigorosa de registros antigos (< 2025) concluída.');
      // 1. Buscar unidades com chaves configuradas
      const { rows: unidades } = await pool.query(
        'SELECT id, sigla, pcp_public_key FROM unidades_gestoras WHERE pcp_public_key IS NOT NULL AND ativo = true'
      );

      // Iniciar status
      syncStatusManager.start(unidades.length);

      let unitIndex = 1;
      for (const ug of unidades) {
        await this.sincronizarUG(ug, anos, unitIndex);
        unitIndex++;
      }

      syncStatusManager.finish('completed');
      return syncStatusManager.getStatus();
    } catch (err: any) {
      console.error('Erro geral na sincronização:', err);
      syncStatusManager.finish('error', `Erro crítico: ${err.message}`);
      throw err;
    }
  }

  /**
   * Sincroniza dados de uma UG específica
   */
  async sincronizarUG(ug: any, anos: number[], unitIndex: number): Promise<void> {
    console.log(`🔄 Sincronizando: ${ug.sigla || ug.id}...`);
    
    for (const ano of anos) {
      try {
        const processosResumo = await pcpApiService.listarProcessos(ug.pcp_public_key, ano);
        
        // Filtrar as modalidades antes de processar
        const processosFiltrados = processosResumo.filter((resumo: any) => {
          const tipo = (resumo.tipoLicitacao || '').toUpperCase();
          const pular = tipo.includes('CREDENCIMENTO') || 
                       tipo.includes('DISPENSA PRESENCIAL') || 
                       tipo.includes('INEXIGIBILIDADE');
          return !pular;
        });

        const totalOriginal = processosResumo.length;
        const totalAposFiltro = processosFiltrados.length;
        const ignoradosPorModalidade = totalOriginal - totalAposFiltro;

        if (ignoradosPorModalidade > 0) {
          console.log(`ℹ️ Ignorados ${ignoradosPorModalidade} processos por modalidade (Credenciamento, Dispensa Presencial ou Inexigibilidade)`);
        }

        // Atualizar status da unidade com o total de processos filtrados para progresso real
        syncStatusManager.updateUnit(unitIndex, ug.sigla || `Unidade ${ug.id}`, totalAposFiltro);
        
        // Adicionar ao total global
        syncStatusManager.addTotalProcesses(totalAposFiltro);

        for (const resumo of processosFiltrados) {
          try {
            // VERIFICAÇÃO DE SKIP OTORIDADE:
            // Já verificamos se a situação mudou antes de buscar detalhes para ganhar velocidade
            const shouldSkipByStatus = await this.verificarSkip(resumo.idLicitacao, resumo.cdSituacao);
            
            if (shouldSkipByStatus) {
              syncStatusManager.incrementProcessed(false, true);
              continue;
            }

            const detalhes = await pcpApiService.obterDetalhes(ug.pcp_public_key, resumo.idLicitacao);
            if (!detalhes) {
              syncStatusManager.incrementProcessed(false, true);
              continue;
            }

            // FILTRO DE SITUAÇÃO: Apenas "Sessão Pública Finalizada"
            const situacaoNormalizada = (detalhes.situacao || '').toUpperCase();
            if (!situacaoNormalizada.includes('SESSÃO PÚBLICA FINALIZADA')) {
              console.log(`⏭️ Ignorando processo ${resumo.NUMERO}: Situação não finalizada (${detalhes.situacao})`);
              syncStatusManager.incrementProcessed(false, true);
              continue;
            }
            
            const participantes = detalhes.Participantes || [];
            if (participantes.length === 0) {
              const listaVencedores = detalhes.Vencedores || detalhes.vencedores || [];
              if (listaVencedores.length > 0) {
                for (const v of listaVencedores) {
                const result = await this.upsertLicitacao(resumo, detalhes, v, ug.id);
                if (result === true) syncStatusManager.incrementInserted();
                else if (result === false) syncStatusManager.incrementUpdated();
                }
              } else {
                const result = await this.upsertLicitacao(resumo, detalhes, null, ug.id);
                if (result === true) syncStatusManager.incrementInserted();
                else if (result === false) syncStatusManager.incrementUpdated();
              }
            } else {
              for (const p of participantes) {
                const result = await this.upsertLicitacao(resumo, detalhes, p, ug.id);
                if (result === true) syncStatusManager.incrementInserted();
                else if (result === false) syncStatusManager.incrementUpdated();
              }
            }
            syncStatusManager.incrementProcessed(true, false);
          } catch (err: any) {
            const errorMsg = `Erro no processo ${resumo.NUMERO} (UG ${ug.sigla || ug.id}): ${err.message}`;
            console.error(errorMsg);
            syncStatusManager.addError(errorMsg);
            syncStatusManager.incrementProcessed(false, false); // Considera processado mas com erro
          }
        }
      } catch (err: any) {
        const errorMsg = `Erro ao listar processos do ano ${ano} para UG ${ug.sigla || ug.id}: ${err.message}`;
        console.error(errorMsg);
        syncStatusManager.addError(errorMsg);
      }
    }
  }

  /**
   * Verifica se o processo já existe e tem a mesma situação numérica
   * Otimização para economizar chamadas de API de detalhes
   */
  private async verificarSkip(idLicitacao: number, cdSituacao: number): Promise<boolean> {
    try {
      // Verificamos se existe pelo menos um registro com este idLicitacao
      // e comparamos a situação. Como a situação no banco é texto, e no resumo é número,
      // essa verificação é básica. Se as situações de finalização forem conhecidas, 
      // poderíamos ser mais precisos. Por enquanto, se o status for "Finalizado" (17 no PCP em alguns casos)
      // e já estiver no banco, pulamos.
      
      const { rows } = await pool.query(
        "SELECT cd_situacao FROM microempresas_licitacoes WHERE idlicitacao = $1 LIMIT 1",
        [idLicitacao]
      );

      if (rows.length === 0) return false;

      const cdSituacaoDB = rows[0].cd_situacao;

      // Se o código da situação for idêntico ao que já temos, podemos pular com segurança
      // (pois já temos os vencedores e valores finais salvos para este status)
      if (cdSituacaoDB === cdSituacao) {
        return true;
      }

      return false;
    } catch (err) {
      return false; // Em caso de erro na verificação, melhor sincronizar
    }
  }

  /**
   * Converte data do formato PCP (geralmente DD/MM/YYYY) para objeto Date
   * Evita problemas de inversão dia/mês do construtor Date default
   */
  private parsePcpDate(dateStr: string, anoFallback: number): Date {
    if (!dateStr || dateStr.trim() === '') return new Date(anoFallback, 0, 1);
    
    try {
      // Extrai apenas a parte da data caso venha no formato ISO completo (YYYY-MM-DDTHH:mm:ssZ)
      const cleanDateStr = (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim()) || '';
      
      // Formatos comuns: "DD/MM/YYYY" ou "YYYY-MM-DD"
      if (cleanDateStr.includes('/')) {
        const parts = cleanDateStr.split('/');
        if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2].substring(0, 4), 10);
          return new Date(year, month - 1, day);
        }
      } else if (cleanDateStr.includes('-')) {
        const parts = cleanDateStr.split('-');
        if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
          // Se começar com 4 dígitos é YYYY-MM-DD
          if (parts[0].length === 4) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2].substring(0, 2), 10));
          }
          // Caso contrário pode ser DD-MM-YYYY
          return new Date(parseInt(parts[2].substring(0, 4), 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      }
      
      const d = new Date(cleanDateStr);
      if (!isNaN(d.getTime())) return d;
    } catch (e) {
      console.error(`Erro ao parsear data PCP: ${dateStr}`, e);
    }
    
    return new Date(anoFallback, 0, 1);
  }

  private async upsertLicitacao(resumo: any, detalhes: any, participante: any, ugId: number): Promise<boolean | null> {
    const query = `
      INSERT INTO microempresas_licitacoes (
        idlicitacao, numero, ano, tipo_licitacao, objeto, 
        dataaterturard_date, dataabertura_date, situacao, url_portal,
        cnpj, razaosocial, tipoempresa, declaracaome, vencedor,
        valor_estimado, valor_proposta, valor_negociado, ug_id, cd_situacao, cd_boleano_d_beneficio_local
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      ON CONFLICT (idlicitacao, cnpj) DO UPDATE SET
        situacao = EXCLUDED.situacao,
        vencedor = EXCLUDED.vencedor,
        valor_negociado = EXCLUDED.valor_negociado,
        cd_situacao = EXCLUDED.cd_situacao,
        cd_boleano_d_beneficio_local = EXCLUDED.cd_boleano_d_beneficio_local,
        data_sincronizacao = CURRENT_TIMESTAMP
      RETURNING (xmax = 0) AS is_insert
    `;

    // Lógica para determinar se o participante foi vencedor (simplificada por enquanto)
    const cnpjParticipante = participante?.CNPJ || participante?.IdFornecedor || participante?.cpfCnpj || 'N/A';
    
    // Lógica para identificar se este participante é vencedor em algum lote
    let vencedor = false;
    let valorNegociado = 0;
    
    // Normalizar CNPJ para comparação (remover caracteres não numéricos)
    const cnpjLimpo = (cnpjParticipante || '').replace(/\D/g, '');

    // A API do PCP retorna os vencedores em um array global Vencedores ou dentro de cada lote
    const listaVencedores = detalhes.Vencedores || detalhes.vencedores || [];
    
    // Verificar vencedor global
    const vencedorGlobal = listaVencedores.find((v: any) => {
        const idFornecedor = String(v.IdFornecedor || v.CNPJ || '').replace(/\D/g, '');
        return idFornecedor === cnpjLimpo && v.Cancelado !== true;
    });

    if (vencedorGlobal) {
        // Se houver múltiplos lotes/itens vencidos, somar os valores
        valorNegociado = listaVencedores
            .filter((v: any) => String(v.IdFornecedor || v.CNPJ || '').replace(/\D/g, '') === cnpjLimpo && v.Cancelado !== true)
            .reduce((acc: number, v: any) => acc + parseFloat(v.ValorTotal || v.ValorTotalArredondamento || 0), 0);
        
        // Só é vencedor se o valor negociado for maior que 0
        if (valorNegociado > 0) {
            vencedor = true;
        }
    }
    
    let isBeneficioLocal = false;
    
    const extractBeneficio = (obj: any) => {
      if (!obj) return false;
      const keys = Object.keys(obj);
      
      const debugKeys = keys.filter(k => k.toLowerCase().includes('benef') || k.toLowerCase().includes('local'));
      if (debugKeys.length > 0) {
        console.log(`🧐 Achei chaves suspeitas em PCP: ${debugKeys.join(', ')} no objeto Cnpj/Fornecedor: ${obj.CNPJ || obj.IdFornecedor || 'Desconhecido'}`);
        debugKeys.forEach(dk => console.log(`Valor de ${dk}:`, obj[dk]));
      }

      const targetKey = keys.find(k => k.toLowerCase() === 'cd_boleano_d_beneficio_local');
      if (targetKey) {
        const val = obj[targetKey];
        return val === 1 || val === true || String(val).toLowerCase() === 'true' || String(val) === '1';
      }
      return false;
    };

    if (extractBeneficio(participante) || extractBeneficio(vencedorGlobal) || extractBeneficio(detalhes)) {
      isBeneficioLocal = true;
    }
    
    // Caso não encontre no global ou o valor seja 0, verifica os lotes individuais
    if (!vencedor && detalhes.lotes) {
        let valorLotes = 0;
        for (const lote of detalhes.lotes) {
            const vencedoresLote = lote.Vencedores || lote.vencedores || [];
            const vencedorLote = vencedoresLote.find((v: any) => {
                const idFornecedor = String(v.IdFornecedor || v.CNPJ || '').replace(/\D/g, '');
                return idFornecedor === cnpjLimpo && v.Cancelado !== true;
            });

            if (vencedorLote) {
                valorLotes += parseFloat(vencedorLote.ValorTotal || vencedorLote.ValorTotalArredondamento || 0);
            }
        }

        if (valorLotes > 0) {
            vencedor = true;
            valorNegociado = valorLotes;
        }
    }

    if (!isBeneficioLocal && detalhes.lotes) {
        for (const lote of detalhes.lotes) {
            if (extractBeneficio(lote)) {
                isBeneficioLocal = true;
                break;
            }
            const vencedoresLote = lote.Vencedores || lote.vencedores || [];
            const vencedorLote = vencedoresLote.find((v: any) => {
                const idFornecedor = String(v.IdFornecedor || v.CNPJ || '').replace(/\D/g, '');
                return idFornecedor === cnpjLimpo && v.Cancelado !== true;
            });
            if (extractBeneficio(vencedorLote)) {
                isBeneficioLocal = true;
                break;
            }
        }
    }

    // Só salvar se for vencedor (reforçando a limpeza do banco de dados para análise ME/EPP)
    if (!vencedor) {
      return null;
    }

    const dataAbertura = this.parsePcpDate(detalhes.dataAberturaPropostas || '', Number(resumo.ANO_LICITACAO || 0));
    
    // TRAVA DE SEGURANÇA MÁXIMA: Ignorar qualquer processo com data de abertura anterior a 2025
    if (dataAbertura.getFullYear() < 2025) {
      // console.log(`⏭️ Descartando processo ${resumo.NUMERO}: Data de abertura (${dataAbertura.toISOString()}) anterior a 2025`);
      return null;
    }

    const values = [
      resumo.idLicitacao || 0,
      resumo.NUMERO || '',
      resumo.ANO_LICITACAO || 0,
      resumo.tipoLicitacao || '',
      resumo.DS_OBJETO || '',
      null, // dataaterturard_date (campo depreciado)
      dataAbertura,
      detalhes.situacao || '',
      resumo.urlProcesso || '',
      cnpjParticipante,
      participante?.RazaoSocial || 'Não identificado',
      participante?.TipoEmpresa || 'Outros',
      participante?.DeclaracaoME === true,
      vencedor,
      0, // valor_estimado
      0, // valor_proposta
      valorNegociado,
      ugId,
      resumo.cdSituacao || 0, // Novo campo cd_situacao
      isBeneficioLocal // Captura do benefício local
    ];

    const result = await pool.query(query, values);
    // xmax = 0 significa que não havia conflito → foi um INSERT real
    return result.rows[0]?.is_insert === true;
  }
}

export const pcpSyncService = new PcpSyncService();

