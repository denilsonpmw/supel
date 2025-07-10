export interface User {
  id: number;
  email: string;
  nome: string;
  google_id?: string | null;
  perfil: 'admin' | 'usuario' | 'visualizador';
  paginas_permitidas?: string[];
  acoes_permitidas?: string[];
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UnidadeGestora {
  id: number;
  sigla: string;
  nome_completo_unidade: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Responsavel {
  id: number;
  primeiro_nome: string;
  nome_responsavel: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EquipeApoio {
  id: number;
  primeiro_nome: string;
  nome_apoio: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Modalidade {
  id: number;
  sigla_modalidade: string;
  nome_modalidade: string;
  descricao_modalidade?: string;
  cor_hex?: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Situacao {
  id: number;
  nome_situacao: string;
  descricao_situacao?: string;
  eh_finalizadora: boolean;
  cor_hex?: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Processo {
  id: number;
  nup: string;
  objeto: string;
  ug_id: number;
  data_entrada: Date;
  responsavel_id: number;
  modalidade_id: number;
  numero_ano: string;
  rp: boolean;
  data_sessao?: Date;
  data_pncp?: Date;
  data_tce_1?: Date;
  valor_estimado: number;
  valor_realizado?: number;
  desagio?: number;
  percentual_reducao?: number;
  situacao_id: number;
  data_situacao: Date;
  data_tce_2?: Date;
  conclusao: boolean;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
  
  // Joins
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
    percentual: number;
  };
  estimado_concluidos: {
    total: number;
    valor_estimado: number;
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

export interface ProcessoFilter {
  nup?: string;
  objeto?: string;
  ug_id?: number;
  responsavel_id?: number;
  modalidade_id?: number;
  situacao_id?: number;
  data_entrada_inicio?: Date;
  data_entrada_fim?: Date;
  valor_estimado_min?: number;
  valor_estimado_max?: number;
  conclusao?: boolean;
  rp?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export interface Permission {
  id: number;
  user_id: number;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  granted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ImportResult {
  success: boolean;
  total_rows: number;
  imported_rows: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
} 