import axios from 'axios';

const BASE_URL = "https://apipcp.portaldecompraspublicas.com.br/comprador";

export interface PcpLicitacaoResumo {
  idLicitacao: number;
  NR_PROCESSO: string;
  NUMERO: string;
  ANO_LICITACAO: number;
  DS_OBJETO: string;
  cdSituacao: number;
  tipoLicitacao: string;
  urlProcesso: string;
}

export interface PcpLicitacaoDetalhe {
  idLicitacao: number;
  objeto: string;
  NUMERO: string;
  ANO: number;
  DS_SITUACAO: string;
  urlProcesso: string;
  itens: any[];
  // Adicionar outros campos conforme necessário para ME/EPP
}

export class PcpApiService {
  /**
   * Lista as licitações de uma unidade gestora (via publicKey) por ano
   */
  async listarProcessos(publicKey: string, ano: number): Promise<PcpLicitacaoResumo[]> {
    try {
      const url = `${BASE_URL}/${publicKey}/processos/${ano}`;
      const response = await axios.get(url, { timeout: 15000 });
      return response.data.dadosLicitacoes || [];
    } catch (error: any) {
      console.error(`Erro ao listar processos PCP (${publicKey}, ${ano}):`, error.message);
      return [];
    }
  }

  /**
   * Obtém os detalhes de uma licitação específica
   */
  async obterDetalhes(publicKey: string, idLicitacao: number): Promise<any> {
    try {
      const url = `${BASE_URL}/${publicKey}/processo/${idLicitacao}`;
      const response = await axios.get(url, { timeout: 15000 });
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao obter detalhes PCP (${publicKey}, ${idLicitacao}):`, error.message);
      return null;
    }
  }
}

export const pcpApiService = new PcpApiService();
