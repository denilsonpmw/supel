import axios from 'axios';
import { ApiResponse, User, DashboardMetrics } from '../types';

// Configuração base do axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true, // Importante: Enviar cookies automaticamente
});

// Interceptor para adicionar token de autorização
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('supel_token');
    // console.log('🔒 Token encontrado:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log('✅ Token adicionado ao header');
    } else {
      // console.log('❌ Token não encontrado');
    }
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas e erros
api.interceptors.response.use(
  (response) => {
    // console.log('✅ Resposta recebida:', {
    //   url: response.config.url,
    //   status: response.status,
    //   hasData: !!response.data
    // });
    return response;
  },
  (error) => {
    console.error('❌ Erro na resposta:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });

    // Só remove o token se for erro 401 (não para outros tipos de erro)
    if (error.response?.status === 401) {
      // console.log('🔄 Erro 401 - Removendo token e redirecionando para login');
      localStorage.removeItem('supel_token');
      localStorage.removeItem('supel_user');
      // REMOVIDO: window.location.href = '/login'; - Isso estava causando loop infinito
      // Deixar o AuthContext gerenciar o redirecionamento
    }
    // Se for erro de download de arquivo (blob), apenas rejeite sem afetar o token
    if (
      error.config &&
      error.config.responseType === 'blob' &&
      error.response &&
      error.response.status === 500
    ) {
      // Apenas rejeita o erro, não faz logout
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  // Login com email/senha
  emailLogin: async (email: string, senha: string, primeiroAcesso?: boolean): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', { email, senha, primeiroAcesso: primeiroAcesso || false });
    return response.data;
  },

  // Solicitar acesso ao sistema
  requestAccess: async (data: { email: string; nome: string; justificativa?: string }) => {
    const response = await api.post('/auth/solicitar-acesso', data);
    return response.data;
  },

  // Solicitar redefinição de senha
  requestPasswordReset: async (email: string) => {
    const response = await api.post('/auth/request-password-reset', { email });
    return response.data;
  },

  // Validar token de redefinição
  validateResetToken: async (token: string) => {
    const response = await api.post('/auth/validate-reset-token', { token });
    return response.data;
  },

  // Redefinir senha
  resetPassword: async (data: { token: string; newPassword: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  // Alterar senha (usuário logado)
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  // Verificar token atual
  verifyToken: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('supel_token');
    localStorage.removeItem('supel_user');
    return response.data;
  },

  // Solicitar redefinição de senha
  solicitarRedefinicaoSenha: async (email: string) => {
    const response = await api.post('/auth/esqueci-senha', { email });
    return response.data;
  },

  // Redefinir senha com token
  redefinirSenha: async (token: string, novaSenha: string) => {
    const response = await api.post('/auth/esqueci-senha', { token, novaSenha });
    return response.data;
  },
};

// Serviços do dashboard
export const dashboardService = {
  // Obter métricas principais
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },

  // Obter dados do mapa de calor
  getHeatmapData: async () => {
    const response = await api.get('/dashboard/heatmap');
    return response.data;
  },

  // Obter distribuição por modalidade
  getModalidadeDistribution: async () => {
    const response = await api.get('/dashboard/modalidades');
    return response.data;
  },

  // Obter evolução temporal
  getProcessEvolution: async (periodo: string = '12') => {
    const response = await api.get(`/dashboard/evolution?periodo=${periodo}`);
    return response.data;
  },

  // Obter processos críticos
  getProcessosCriticos: async () => {
    const response = await api.get('/dashboard/criticos');
    return response.data;
  },
};

// Serviços de processos
export const processosService = {
  // Listar processos
  list: async (params?: any) => {
    const response = await api.get('/processes', { params });
    return response.data;
  },

  // Obter processo por ID
  getById: async (id: number) => {
    const response = await api.get(`/processes/${id}`);
    return response.data;
  },

  // Criar processo
  create: async (data: any) => {
    const response = await api.post('/processes', data);
    return response.data;
  },

  // Atualizar processo
  update: async (id: number, data: any) => {
    const response = await api.put(`/processes/${id}`, data);
    return response.data;
  },

  // Deletar processo
  delete: async (id: number) => {
    const response = await api.delete(`/processes/${id}`);
    return response.data;
  },

  // Obter estatísticas do processo
  getStats: async (id: number) => {
    const response = await api.get(`/processes/${id}/stats`);
    return response.data;
  },

  // Importar processos via CSV
  importCsv: async (formData: FormData) => {
    const response = await api.post('/processes/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Serviços de adesões a ata (ARP)
export const processosAdesaoService = {
  list: async (params?: any) => {
    const response = await api.get('/processos-adesao', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/processos-adesao/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/processos-adesao', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/processos-adesao/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/processos-adesao/${id}`);
    return response.data;
  },
  importCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // NÃO definir Content-Type manualmente: Axios adiciona o boundary correto automaticamente
    const response = await api.post('/processos-adesao/import-csv', formData);
    return response.data;
  },
};

// Serviços de relatórios de Adesões ARP
export const relatoriosAdesaoService = {
  gerarRelatorio: async (params?: {
    situacao_id?: number;
    ug_id?: number;
    data_inicio?: string;
    data_fim?: string;
  }) => {
    const response = await api.get('/reports/adesoes', { params });
    return response.data;
  },
};

// Serviços de modalidades
export const modalidadesService = {
  // Listar modalidades
  list: async (params?: any) => {
    const response = await api.get('/modalidades', { params });
    return response.data;
  },

  // Obter modalidade por ID
  getById: async (id: number) => {
    const response = await api.get(`/modalidades/${id}`);
    return response.data;
  },

  // Criar modalidade
  create: async (data: any) => {
    const response = await api.post('/modalidades', data);
    return response.data;
  },

  // Atualizar modalidade
  update: async (id: number, data: any) => {
    const response = await api.put(`/modalidades/${id}`, data);
    return response.data;
  },

  // Deletar modalidade
  delete: async (id: number) => {
    const response = await api.delete(`/modalidades/${id}`);
    return response.data;
  },

  // Obter estatísticas da modalidade
  getStats: async (id: number) => {
    const response = await api.get(`/modalidades/${id}/stats`);
    return response.data;
  },
};

// Serviços de unidades gestoras
export const unidadesGestorasService = {
  // Listar unidades gestoras
  list: async (params?: any) => {
    const response = await api.get('/unidades-gestoras', { params });
    return response.data;
  },

  // Obter unidade gestora por ID
  getById: async (id: number) => {
    const response = await api.get(`/unidades-gestoras/${id}`);
    return response.data;
  },

  // Criar unidade gestora
  create: async (data: any) => {
    const response = await api.post('/unidades-gestoras', data);
    return response.data;
  },

  // Atualizar unidade gestora
  update: async (id: number, data: any) => {
    const response = await api.put(`/unidades-gestoras/${id}`, data);
    return response.data;
  },

  // Deletar unidade gestora
  delete: async (id: number) => {
    const response = await api.delete(`/unidades-gestoras/${id}`);
    return response.data;
  },
};

// Serviços de responsáveis
export const responsaveisService = {
  // Listar responsáveis
  list: async (params?: any) => {
    const response = await api.get('/responsaveis', { params });
    return response.data;
  },

  // Obter responsável por ID
  getById: async (id: number) => {
    const response = await api.get(`/responsaveis/${id}`);
    return response.data;
  },

  // Criar responsável
  create: async (data: any) => {
    const response = await api.post('/responsaveis', data);
    return response.data;
  },

  // Atualizar responsável
  update: async (id: number, data: any) => {
    const response = await api.put(`/responsaveis/${id}`, data);
    return response.data;
  },

  // Deletar responsável
  delete: async (id: number) => {
    const response = await api.delete(`/responsaveis/${id}`);
    return response.data;
  },

  // Obter estatísticas do responsável
  getStats: async (id: number) => {
    const response = await api.get(`/responsaveis/${id}/stats`);
    return response.data;
  },
};

// Serviços de situações
export const situacoesService = {
  // Listar situações
  list: async (params?: any) => {
    const response = await api.get('/situacoes', { params });
    return response.data;
  },

  // Obter situação por ID
  getById: async (id: number) => {
    const response = await api.get(`/situacoes/${id}`);
    return response.data;
  },

  // Criar situação
  create: async (data: any) => {
    const response = await api.post('/situacoes', data);
    return response.data;
  },

  // Atualizar situação
  update: async (id: number, data: any) => {
    const response = await api.put(`/situacoes/${id}`, data);
    return response.data;
  },

  // Deletar situação
  delete: async (id: number) => {
    const response = await api.delete(`/situacoes/${id}`);
    return response.data;
  },

  // Obter estatísticas da situação
  getStats: async (id: number) => {
    const response = await api.get(`/situacoes/${id}/stats`);
    return response.data;
  },
};

// Serviços de equipe de apoio
export const equipeApoioService = {
  // Listar equipe de apoio
  list: async (params?: any) => {
    const response = await api.get('/equipe-apoio', { params });
    return response.data;
  },

  // Obter membro da equipe por ID
  getById: async (id: number) => {
    const response = await api.get(`/equipe-apoio/${id}`);
    return response.data;
  },

  // Criar membro da equipe
  create: async (data: any) => {
    const response = await api.post('/equipe-apoio', data);
    return response.data;
  },

  // Atualizar membro da equipe
  update: async (id: number, data: any) => {
    const response = await api.put(`/equipe-apoio/${id}`, data);
    return response.data;
  },

  // Deletar membro da equipe
  delete: async (id: number) => {
    const response = await api.delete(`/equipe-apoio/${id}`);
    return response.data;
  },

  // Obter estatísticas do membro
  getStats: async (id: number) => {
    const response = await api.get(`/equipe-apoio/${id}/stats`);
    return response.data;
  },
};

// Serviços de relatórios
export const relatoriosService = {
  // CRUD Relatórios Personalizados
  listPersonalizados: async () => {
    const response = await api.get('/relatorios-personalizados');
    return response.data;
  },
  createPersonalizado: async (data: any) => {
    const response = await api.post('/relatorios-personalizados', data);
    return response.data;
  },
  updatePersonalizado: async (id: number, data: any) => {
    const response = await api.put(`/relatorios-personalizados/${id}`, data);
    return response.data;
  },
  deletePersonalizado: async (id: number) => {
    const response = await api.delete(`/relatorios-personalizados/${id}`);
    return response.data;
  },
  // Listar relatórios disponíveis
  list: async () => {
    const response = await api.get('/reports');
    return response.data;
  },

  // Obter opções para filtros
  getOpcoes: async () => {
    const response = await api.get('/reports/opcoes');
    return response.data;
  },

  // Gerar relatório de processos
  gerarProcessos: async (params?: any) => {
    const response = await api.get('/reports/processos', { params });
    return response.data;
  },

  // Gerar relatório de economicidade
  gerarEconomicidade: async (params?: any) => {
    const response = await api.get('/reports/economicidade', { params });
    return response.data;
  },

  // Gerar relatório de processos críticos
  gerarCriticos: async (params?: any) => {
    const response = await api.get('/reports/criticos', { params });
    return response.data;
  },
};

// Serviços de usuários (novo)
export const userService = {
  listarUsuarios: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  buscarUsuario: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  criarUsuario: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  atualizarUsuario: async (id: number, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  excluirUsuario: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  sincronizarComResponsaveis: () => api.post('/users/sync-responsaveis'),
  gerarTokenResetAdmin: (userId: number) => api.post(`/users/${userId}/gerar-token-reset`)
};

// Serviços do painel público
export const painelPublicoService = {
  // Obter dados completos do painel público
  getDadosCompletos: async () => {
    const response = await api.get('/painel-publico/dados-completos');
    return response.data;
  },

  // Obter processos da semana atual
  getSemanaAtual: async () => {
    const response = await api.get('/painel-publico/semana-atual');
    return response.data;
  },

  // Obter processos da semana passada
  getSemanaPassada: async () => {
    const response = await api.get('/painel-publico/semana-passada');
    return response.data;
  },

  // Obter processos da próxima semana
  getProximaSemana: async () => {
    const response = await api.get('/painel-publico/proxima-semana');
    return response.data;
  },
};

// Serviços de indicadores gerenciais
export const indicadoresService = {
  getIndicadores: async (filtros: {
    dataInicio: string;
    dataFim: string;
    colunaDataInicio: string;
    colunaDataFim: string;
    modalidadeId?: number;
  }): Promise<any> => {
    try {
      console.log('🔍 Buscando indicadores gerenciais...', filtros);
      const params = new URLSearchParams();
      params.append('dataInicio', filtros.dataInicio);
      params.append('dataFim', filtros.dataFim);
      params.append('colunaDataInicio', filtros.colunaDataInicio);
      params.append('colunaDataFim', filtros.colunaDataFim);
      if (filtros.modalidadeId) {
        params.append('modalidadeId', filtros.modalidadeId.toString());
      }
      
      const response = await api.get(`/indicadores?${params.toString()}`);
      console.log('✅ Indicadores gerenciais obtidos:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao obter indicadores gerenciais:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(error.response?.data?.error || 'Erro ao carregar indicadores gerenciais');
    }
  },

  getDetalhamentoProcessos: async (filtros: {
    dataInicio: string;
    dataFim: string;
    colunaDataInicio: string;
    colunaDataFim: string;
    modalidade: string;
    tipo: 'total' | 'homologado' | 'sem_sucesso';
  }): Promise<any[]> => {
    try {
      const params = new URLSearchParams();
      params.append('dataInicio', filtros.dataInicio);
      params.append('dataFim', filtros.dataFim);
      params.append('colunaDataInicio', filtros.colunaDataInicio);
      params.append('colunaDataFim', filtros.colunaDataFim);
      params.append('modalidade', filtros.modalidade);
      params.append('tipo', filtros.tipo);
      
      const response = await api.get(`/indicadores/detalhes?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao obter detalhamento de processos:', error);
      throw new Error(error.response?.data?.error || 'Erro ao carregar detalhamento');
    }
  },
};

// Serviços do PCP (Portal de Compras Públicas)
export const pcpService = {
  // Sincronizar dados do PCP manualmente
  sync: async (anos: number[] = [2025, 2026]) => {
    const response = await api.post('/processos-data/sync', { anos });
    return response.data;
  },

  // Obter status da sincronização em tempo real
  getSyncStatus: async () => {
    const response = await api.get('/processos-data/sync-status');
    return response.data;
  },

  // Obter mapeamento de chaves PCP por Unidade Gestora
  getMappings: async () => {
    // Reutiliza o serviço de UGs mas focado nas chaves PCP
    const response = await api.get('/unidades-gestoras');
    return response.data;
  },

  // Atualizar a chave PCP de uma Unidade Gestora
  updateMapping: async (ugId: number, pcpPublicKey: string) => {
    const response = await api.put(`/unidades-gestoras/${ugId}`, { pcp_public_key: pcpPublicKey });
    return response.data;
  },

  // Obter estatísticas filtradas de ME/EPP
  getStats: async (params: { dataInicio?: string; dataFim?: string; tipo?: string | number, beneficioLocal?: string | number }) => {
    const response = await api.get('/processos-data/stats', { params });
    return response.data;
  },
};

// Utilitário para tratamento de erros
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Ocorreu um erro inesperado. Tente novamente.';
};

export default api; 