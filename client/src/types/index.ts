export interface User {
  id: number;
  email: string;
  nome: string;
  perfil: 'admin' | 'usuario' | 'visualizador';
  paginas_permitidas?: string[];
  acoes_permitidas?: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnidadeGestora {
  id: number;
  sigla: string;
  nome_completo_unidade: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Responsavel {
  id: number;
  primeiro_nome: string;
  nome_responsavel: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EquipeApoio {
  id: number;
  primeiro_nome: string;
  nome_apoio: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Modalidade {
  id: number;
  sigla_modalidade: string;
  nome_modalidade: string;
  descricao_modalidade?: string;
  cor_hex?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Situacao {
  id: number;
  nome_situacao: string;
  descricao_situacao?: string;
  eh_finalizadora: boolean;
  cor_hex?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Processo {
  id: number;
  nup: string;
  objeto: string;
  ug_id: number;
  data_entrada: string;
  responsavel_id: number;
  modalidade_id: number;
  numero_ano: string;
  rp: boolean;
  data_sessao?: string;
  data_pncp?: string;
  data_tce_1?: string;
  valor_estimado: number;
  valor_realizado?: number;
  desagio?: number;
  percentual_reducao?: number;
  situacao_id: number;
  data_situacao: string;
  data_tce_2?: string;
  conclusao: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  unidade_gestora?: UnidadeGestora;
  responsavel?: Responsavel;
  modalidade?: Modalidade;
  situacao?: Situacao;
}

export interface DashboardMetrics {
  processos_ativos: {
    total: number;
    valor_associado: number;
  };
  processos_andamento: {
    total: number;
    valor_associado: number;
  };
  processos_concluidos: {
    total: number;
    valor_associado: number;
  };
  economicidade: {
    total: number;
    valor_economizado: number;
  };
}

export interface HeatmapData {
  id: number;
  nome_situacao: string;
  cor_hex: string;
  total_processos: number;
  tempo_medio_dias: number;
  processos_criticos: number;
  percentual_criticos: number;
  processos_atencao: number;
  percentual_atencao: number;
  score_criticidade: number;
  score_tamanho_visual: number;
}

export interface ProcessoDetalhado {
  id: number;
  nup: string;
  objeto: string;
  data_situacao: string;
  sigla: string;
  diasParados: number;
  situacao_id: number;
  unidade_gestora: {
    sigla: string;
  };
}

export interface SituacaoProcessada extends HeatmapData {
  processos: ProcessoDetalhado[];
}

export interface ModalidadeDistribution {
  id: number;
  sigla: string;
  nome: string;
  cor_hex: string;
  total_processos: number;
  valor_total: number;
}

export interface ProcessEvolution {
  mes: string;
  total_processos: number;
  valor_total: number;
}

export interface ProcessoCritico {
  id: number;
  nup: string;
  objeto: string;
  unidade_gestora: string;
  responsavel: string;
  situacao: string;
  cor_situacao: string;
  data_situacao: string;
  dias_parado: number;
  valor_estimado: number;
}

export interface ProcessoAndamento {
  id: number;
  nup: string;
  objeto: string;
  unidade_gestora_sigla: string;
  modalidade_sigla: string;
  numero_ano: string;
  data_sessao: string;
  valor_estimado: number;
  situacao: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  user?: User;
  token?: string;
  error?: string;
  details?: string;
} 