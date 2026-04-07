import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Interceptor para adicionar token de autorização
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('supel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interface para os participantes que nos interessam
export interface ParticipanteData {
  RazaoSocial: string;
  CNPJ: string;
  DeclaracaoME: boolean;
  TipoEmpresa: string;
  Licitante: boolean;
}

// Interface para os dados de processos do arquivo JSON (simplificada)
export interface ProcessoData {
  idLicitacao: number;
  tipo_licitacao: string;
  dataAberturaPropostas: string;
  NUMERO: string;
  lotes: Array<{
    participantes: ParticipanteData[];
  }>;
}

export interface ProcessosDataResponse {
  public_key: string;
  data: ProcessoData[];
}

// Interface para dados formatados para a tabela (vinda do banco de dados)
export interface DadosFiltrados {
  id: number;
  numero: string;
  tipo_licitacao: string;
  objeto: string;
  dataAberturaPropostas: string;
  dataAberturaIso: string;
  situacao: string;
  vencedor: boolean;
  razaosocial: string;
  cnpj: string;
  declaracaome: boolean;
  tipoempresa: string;
  valor_negociado: string;
  ug_id: number;
  cd_situacao: string;
  data_importacao: string;
}

export const processosDataService = {
  // Carregar dados do arquivo JSON
  carregarDados: async (params?: {
    page?: number;
    limit?: number;
    tipo?: string;
    numero?: string;
    situacao?: string;
    cd_situacao?: string | number;
    ug_id?: string | number;
    dataInicio?: string;
    dataFim?: string;
    razaoSocial?: string;
    orderBy?: string;
    orderDir?: string;
  }): Promise<{
    data: DadosFiltrados[];
    stats: any;
    pagination: any;
  }> => {
    try {
      const response = await api.get('/processos-data/collected-data', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar dados de processos:', error);
      throw error;
    }
  },

  // Carregar estatísticas
  carregarEstatisticas: async (): Promise<{
    totalProcessos: number;
    totalParticipantes: number;
    totalMicroEmpresas: number;
    tipos: string[];
    dataAtualizacao: string;
  }> => {
    try {
      const response = await api.get('/processos-data/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      throw error;
    }
  },

  // Filtrar por tipo de licitação
  filtrarPorTipo: (dados: DadosFiltrados[], tipo: string): DadosFiltrados[] => {
    if (!tipo) return dados;
    return dados.filter(item => item.tipo_licitacao === tipo);
  },

  // Filtrar por período (local - fallback)
  filtrarPorPeriodo: (dados: DadosFiltrados[], dataInicio: string, dataFim: string): DadosFiltrados[] => {
    return dados.filter(item => {
      if (!item.dataAberturaIso) return false;
      const dataProcesso = new Date(item.dataAberturaIso);
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      return dataProcesso >= inicio && dataProcesso <= fim;
    });
  },

  // Obter tipos únicos de licitação
  obterTiposUnicos: (dados: DadosFiltrados[]): string[] => {
    const tipos = new Set(dados.map(item => item.tipo_licitacao));
    return Array.from(tipos).sort();
  },

  // Filtrar apenas micro empresas
  filtrarMicroEmpresas: (dados: DadosFiltrados[]): DadosFiltrados[] => {
    return dados.filter(item => item.declaracaome === true);
  },

  // Obter opções únicas para filtros do banco
  obterOpcoesFiltro: async (): Promise<{
    tipos: string[];
    situacoes: string[];
    codigosSituacao: number[];
    ugs: number[];
  }> => {
    try {
      const response = await api.get('/processos-data/filter-options');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar opções de filtro:', error);
      throw error;
    }
  },

  // Resetar dados do PCP (limpar tabela)
  resetPcpData: async (): Promise<{ message: string }> => {
    try {
      const response = await api.post('/processos-data/reset');
      return response.data;
    } catch (error) {
      console.error('Erro ao resetar dados PCP:', error);
      throw error;
    }
  }
};
