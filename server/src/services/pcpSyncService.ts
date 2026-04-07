import pool from '../database/connection.js';
import { pcpApiService, PcpLicitacaoResumo } from './pcpApiService';
import { syncStatusManager } from './SyncStatusManager';

export class PcpSyncService {
  /**
   * Sincroniza os dados do PCP para todas as unidades mapeadas
   */
  async sincronizarTudo(anos: number[] = [2024, 2025, 2026]): Promise<any> {
    try {
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
        
        // Atualizar status da unidade com o total de processos para progresso granular
        syncStatusManager.updateUnit(unitIndex, ug.sigla || `Unidade ${ug.id}`, processosResumo.length);
        
        // Adicionar ao total global
        syncStatusManager.addTotalProcesses(processosResumo.length);

        for (const resumo of processosResumo) {
          try {
            // VERIFICAÇÃO DE SKIP:
            // Se já temos a licitação no banco com a mesma situação (status), ignoramos o fetch de detalhes
            // para ganhar velocidade, conforme solicitado pelo usuário.
            const shouldSkip = await this.verificarSkip(resumo.idLicitacao, resumo.cdSituacao);
            
            if (shouldSkip) {
              syncStatusManager.incrementProcessed(false, true);
              continue;
            }

            const detalhes = await pcpApiService.obterDetalhes(ug.pcp_public_key, resumo.idLicitacao);
            if (!detalhes) {
              syncStatusManager.incrementProcessed(false, true); // Conta como pulado se não houver detalhes
              continue;
            }
            
            const participantes = detalhes.Participantes || [];
            if (participantes.length === 0) {
              await this.upsertLicitacao(resumo, detalhes, null, ug.id);
            } else {
              for (const p of participantes) {
                await this.upsertLicitacao(resumo, detalhes, p, ug.id);
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

  private async upsertLicitacao(resumo: any, detalhes: any, participante: any, ugId: number) {
    const query = `
      INSERT INTO microempresas_licitacoes (
        idlicitacao, numero, ano, tipo_licitacao, objeto, 
        dataaterturard_date, dataabertura_date, situacao, url_portal,
        cnpj, razaosocial, tipoempresa, declaracaome, vencedor,
        valor_estimado, valor_proposta, valor_negociado, ug_id, cd_situacao
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      ON CONFLICT (idlicitacao, cnpj) DO UPDATE SET
        situacao = EXCLUDED.situacao,
        vencedor = EXCLUDED.vencedor,
        valor_negociado = EXCLUDED.valor_negociado,
        cd_situacao = EXCLUDED.cd_situacao,
        data_sincronizacao = CURRENT_TIMESTAMP
    `;

    // Lógica para determinar se o participante foi vencedor (simplificada por enquanto)
    const cnpjParticipante = participante?.CNPJ || 'N/A';
    
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

    // Só salvar se for vencedor (reforçando a limpeza do banco de dados para análise ME/EPP)
    if (!vencedor) {
        return;
    }

    const values = [
      resumo.idLicitacao,
      resumo.NUMERO,
      resumo.ANO_LICITACAO,
      resumo.tipoLicitacao,
      resumo.DS_OBJETO,
      null, // dataaterturard_date (campo depreciado)
      (() => {
        if (detalhes.dataAberturaPropostas) {
          const d = new Date(detalhes.dataAberturaPropostas);
          if (!isNaN(d.getTime())) return d;
        }
        // Fallback para o ano da licitação (01/01/XXXX) para garantir visibilidade no painel (evitar nulls)
        return new Date(Number(resumo.ANO_LICITACAO), 0, 1);
      })(),
      detalhes.situacao,
      resumo.urlProcesso,
      cnpjParticipante,
      participante?.RazaoSocial || 'Não identificado',
      participante?.TipoEmpresa || 'Outros',
      participante?.DeclaracaoME === true,
      vencedor,
      0, // valor_estimado
      0, // valor_proposta
      valorNegociado,
      ugId,
      resumo.cdSituacao // Novo campo cd_situacao
    ];

    await pool.query(query, values);
  }
}

export const pcpSyncService = new PcpSyncService();

