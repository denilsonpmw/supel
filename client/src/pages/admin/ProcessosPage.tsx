import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,

  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  InputAdornment,
  Menu,
  Checkbox,
  TableSortLabel,
  Divider,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Clear as ClearIcon,
  Money as MoneyIcon,
  DateRange as DateRangeIcon,
  ViewColumn as ViewColumnIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Upload as UploadIcon,
  GetApp as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  RestartAlt as RestartAltIcon,
  ClearAll as ClearAllIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  processosService, 
  modalidadesService, 
  unidadesGestorasService, 
  responsaveisService, 
  situacoesService,
  authService
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomTheme } from '../../contexts/ThemeContext';

interface Processo {
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
  unidade_gestora?: {
    sigla: string;
    nome_completo_unidade: string;
  };
  responsavel?: {
    primeiro_nome: string;
    nome_responsavel: string;
  };
  modalidade?: {
    sigla_modalidade: string;
    nome_modalidade: string;
  };
  situacao?: {
    nome_situacao: string;
    cor_hex: string;
    eh_finalizadora: boolean;
  };
}

interface ProcessoForm {
  nup: string;
  objeto: string;
  ug_id: number | '';
  data_entrada: string;
  responsavel_id: number | '';
  modalidade_id: number | '';
  numero_ano: string;
  rp: boolean;
  data_sessao: string;
  data_pncp: string;
  data_tce_1: string;
  valor_estimado: number | '';
  valor_realizado: number | '';
  desagio: number | '';
  percentual_reducao: number | '';
  situacao_id: number | '';
  data_situacao: string;
  data_tce_2: string;
  conclusao: boolean;
  observacoes: string;
}

interface ProcessoStats {
  id: number;
  nup: string;
  objeto: string;
  unidade_gestora: string;
  responsavel: string;
  modalidade: string;
  situacao: string;
  observacoes?: string;
  eh_finalizadora: boolean;
  valor_estimado: number;
  valor_realizado?: number;
  economia_valor?: number;
  economia_percentual: number;
  dias_desde_entrada: number;
  dias_situacao_atual: number;
  conclusao: boolean;
  data_entrada: string;
  data_situacao: string;
  historico_situacoes?: { situacao: string; data: string; dias?: number }[];
  data_sessao?: string;
}

// Interface para resultado da importação CSV
interface ImportResult {
  total: number;
  importados: number;
  erros: string[];
  warnings: string[];
  detalhes: Array<{
    linha: number;
    nup: string;
    status: 'sucesso' | 'erro' | 'warning';
    mensagem: string;
  }>;
}

// Definição das colunas da tabela
interface Column {
  id: keyof Processo | 'acoes' | 'selecao';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: Processo) => string | React.ReactNode;
  sortable?: boolean;
  description?: string;
}

const ProcessosPage: React.FC = () => {
  const { user } = useAuth(); // Para verificar se é admin
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  // Removido paginação - mostrar todos os dados
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({
    ug_id: '',
    responsavel_id: '',
    modalidade_id: '',
    situacao_id: '',
    conclusao: '',
    rp: ''
  });

  // Estados para importação CSV
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Estados para controle de colunas visíveis
  const [visibleColumns, setVisibleColumns] = useState<{[key: string]: boolean}>({
    selecao: true,
    nup: true,
    objeto: true,
    unidade_gestora: true,
    data_entrada: false,
    responsavel: false, // removida da exibição padrão
    modalidade: true,
    numero_ano: true,
    rp: false,
    data_sessao: true,
    data_pncp: false,
    data_tce_1: false,
    valor_estimado: true,
    valor_realizado: true,
    desagio: false,
    percentual_reducao: false,
    situacao: true,
    data_situacao: true,
    data_tce_2: false,
    conclusao: false,
    acoes: true
  });

  // Estados para controle de larguras das colunas
  const [columnWidths, setColumnWidths] = useState<{[key: string]: number}>({});
  const [autoAdjustEnabled, setAutoAdjustEnabled] = useState(true);

  // Menu para controle de colunas
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);

  // Estados para modal de cadastro/edição
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProcesso, setEditingProcesso] = useState<Processo | null>(null);
  const [processoForm, setProcessoForm] = useState<ProcessoForm>({
    nup: '',
    objeto: '',
    ug_id: '',
    data_entrada: new Date().toISOString().split('T')[0],
    responsavel_id: '',
    modalidade_id: '',
    numero_ano: '',
    rp: false,
    data_sessao: '',
    data_pncp: '',
    data_tce_1: '',
    valor_estimado: '',
    valor_realizado: '',
    desagio: '',
    percentual_reducao: '',
    situacao_id: '',
    data_situacao: new Date().toISOString().split('T')[0],
    data_tce_2: '',
    conclusao: false,
    observacoes: ''
  });

  // Estados para dados de apoio
  const [modalidades, setModalidades] = useState<any[]>([]);
  const [unidadesGestoras, setUnidadesGestoras] = useState<any[]>([]);
  const [responsaveis, setResponsaveis] = useState<any[]>([]);
  const [situacoes, setSituacoes] = useState<any[]>([]);

  // Estados para estatísticas
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const [processoStats, setProcessoStats] = useState<ProcessoStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Estados para feedback
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // [1] Adicionar estado para modal de histórico
  const [openHistorico, setOpenHistorico] = useState(false);

  // Estados para seleção múltipla e ações em lote (apenas para admins)
  const [selectedProcessos, setSelectedProcessos] = useState<number[]>([]);
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(false);

  // Estado para controle de exibição dos filtros
  const [showFilters, setShowFilters] = useState(true);

  const { mode } = useCustomTheme();

  // Definição das colunas
  const columns: Column[] = [
    // Coluna de seleção (apenas para admins)
    ...(user?.perfil === 'admin' ? [{
      id: 'selecao' as keyof Processo | 'acoes' | 'selecao',
      label: '',
      minWidth: 50,
      align: 'center' as const,
      format: (_value: any, row?: Processo) => (
        <Checkbox
          checked={selectedProcessos.includes(row?.id || 0)}
          onChange={() => row && handleSelectProcesso(row.id)}
          size="small"
        />
      )
    }] : []),
    {
      id: 'nup',
      label: 'NUP',
      minWidth: 120,
      sortable: true,
      format: (value: string, row?: Processo) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {formatNupExibicao(value)}
          </Typography>
          {row?.rp && (
            <Chip label="RP" size="small" color="info" sx={{ mt: 0.5 }} />
          )}
        </Box>
      )
    },
    {
      id: 'objeto',
      label: 'Objeto',
      minWidth: 220,
      sortable: true,
      format: (value: string) => (
        <Typography 
          variant="body2" 
          sx={{ 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.4,
            fontSize: '0.875rem'
          }}
        >
          {value}
        </Typography>
      )
    },
    {
      id: 'unidade_gestora',
      label: 'U.G.',
      minWidth: 80,
      sortable: true,
      format: (value: any) => (
        <Typography variant="body2" color="primary" fontWeight="bold">
          {value?.sigla}
        </Typography>
      )
    },
    {
      id: 'data_entrada',
      label: 'Entrada',
      minWidth: 100,
      align: 'center',
      sortable: true,
      format: (value: string) => formatDate(value)
    },
    {
      id: 'responsavel',
      label: 'Responsável',
      minWidth: 120,
      sortable: true,
      format: (value: any) => (
        <Typography variant="body2">
          {value?.primeiro_nome}
        </Typography>
      )
    },
    {
      id: 'modalidade',
      label: 'MOD',
      minWidth: 80,
      sortable: true,
      format: (value: any) => (
        <Typography variant="body2" fontWeight="bold">
          {value?.sigla_modalidade}
        </Typography>
      )
    },
    {
      id: 'numero_ano',
      label: 'Nº/Ano',
      minWidth: 100,
      sortable: true
    },
    {
      id: 'rp',
      label: 'RP',
      minWidth: 60,
      align: 'center',
      sortable: true,
      format: (value: boolean) => (
        <Chip 
          label={value ? 'SIM' : 'NÃO'} 
          color={value ? 'success' : 'default'} 
          size="small"
          variant="outlined"
        />
      )
    },
    {
      id: 'data_sessao',
      label: 'Data Sessão',
      minWidth: 110,
      align: 'center',
      sortable: true,
      format: (value: string) => value ? formatDate(value) : '-'
    },
    {
      id: 'data_pncp',
      label: 'Data PNCP',
      minWidth: 110,
      align: 'center',
      sortable: true,
      format: (value: string) => value ? formatDate(value) : '-'
    },
    {
      id: 'data_tce_1',
      label: 'Data TCE 1',
      minWidth: 110,
      align: 'center',
      sortable: true,
      format: (value: string) => value ? formatDate(value) : '-'
    },
    {
      id: 'valor_estimado',
      label: '(R$) Estimado',
      minWidth: 120,
      align: 'right',
      sortable: true,
      format: (value: number) => (
        <Typography variant="body2" fontWeight="bold" color="primary">
          {formatCurrency(value)}
        </Typography>
      )
    },
    {
      id: 'valor_realizado',
      label: '(R$) Realizado',
      minWidth: 120,
      align: 'right',
      sortable: true,
      format: (value: number) => value ? (
        <Typography variant="body2" fontWeight="bold" color="success.main">
          {formatCurrency(value)}
        </Typography>
      ) : '-'
    },
    {
      id: 'desagio',
      label: 'Deságio',
      minWidth: 120,
      align: 'right',
      sortable: true,
      format: (value: number) => value ? (
        <Typography variant="body2" fontWeight="bold" color="success.main">
          {formatCurrency(value)}
        </Typography>
      ) : '-'
    },
    {
      id: 'percentual_reducao',
      label: '% Redução',
      minWidth: 100,
      align: 'right',
      sortable: true,
      format: (value: number) => value ? (
        <Typography variant="body2" fontWeight="bold" color="success.main">
          {value.toFixed(2)}%
        </Typography>
      ) : '-'
    },
    {
      id: 'situacao',
      label: 'Situação',
      minWidth: 130,
      sortable: true,
      format: (value: any) => getSituacaoChip(value)
    },
    {
      id: 'data_situacao',
      label: 'Data Situação',
      minWidth: 120,
      align: 'center',
      sortable: true,
      format: (value: string) => formatDate(value)
    },
    {
      id: 'data_tce_2',
      label: 'Data TCE 2',
      minWidth: 110,
      align: 'center',
      sortable: true,
      format: (value: string) => value ? formatDate(value) : '-'
    },
    {
      id: 'conclusao',
      label: 'Conclusão',
      minWidth: 100,
      align: 'center',
      sortable: true,
      format: (value: boolean) => (
        <Chip 
          label={value ? 'SIM' : 'NÃO'} 
          color={value ? 'success' : 'warning'} 
          size="small"
          variant="outlined"
        />
      )
    },
    {
      id: 'acoes',
      label: 'Ações',
      minWidth: 120,
      align: 'center',
      format: (_value: any, row?: Processo) => {
        const acoesPermitidas = user?.acoes_permitidas || ['ver_estatisticas'];
        
        // Debug: Log das ações permitidas
        console.log('🔍 Ações permitidas do usuário:', {
          userId: user?.id,
          userEmail: user?.email,
          acoesPermitidas: acoesPermitidas,
          temVerEstatisticas: acoesPermitidas.includes('ver_estatisticas'),
          temEditar: acoesPermitidas.includes('editar'),
          temExcluir: acoesPermitidas.includes('excluir')
        });
        
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {/* Botão Ver Estatísticas - sempre visível se usuário tem acesso à página */}
            {acoesPermitidas.includes('ver_estatisticas') && (
              <Tooltip title="Ver Estatísticas">
                <IconButton onClick={() => row && handleViewStats(row)} size="small">
                  <AssessmentIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {/* Botão Editar - apenas se permitido */}
            {acoesPermitidas.includes('editar') && (
              <Tooltip title="Editar Processo">
                <IconButton onClick={() => row && handleOpenDialog(row)} size="small">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {/* Botão Excluir - apenas se permitido */}
            {acoesPermitidas.includes('excluir') && (
              <Tooltip title="Excluir Processo">
                <IconButton onClick={() => row && handleDelete(row)} size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {/* Debug: Mostrar ações disponíveis */}
            {import.meta.env.MODE === 'development' && (
              <Tooltip title={`Ações: ${acoesPermitidas.join(', ')}`}>
                <IconButton size="small" disabled>
                  <WarningIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    }
  ];

  const activeColumns = columns.filter(col => visibleColumns[col.id]);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
    carregarDadosApoio();
  }, [filtros]);

  // Debounce para busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      carregarDados();
    }, 500); // Aguarda 500ms após parar de digitar

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Forçar atualização dos dados do usuário quando a página carregar
  useEffect(() => {
    const atualizarDadosUsuario = async () => {
      try {
        const response = await authService.verifyToken();
        console.log('🔄 Dados do usuário atualizados:', response.data?.user);
      } catch (error) {
        console.error('Erro ao atualizar dados do usuário:', error);
      }
    };

    // Atualizar dados do usuário se não tiver acoes_permitidas
    if (user && (!user.acoes_permitidas || user.acoes_permitidas.length === 0)) {
      atualizarDadosUsuario();
    }
  }, [user]);

  // Log para depuração do perfil do usuário
  useEffect(() => {
    const perfil = user?.perfil
      ? user.perfil.toLowerCase().normalize('NFD').replace(/[\u0000-\u036f]/g, '')
      : '';
    console.log('Perfil do usuário (normalizado):', perfil);
  }, [user]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Não enviar filtros vazios (especialmente conclusao)
      const filtrosLimpos: any = {};
      Object.entries(filtros).forEach(([key, val]) => {
        if (val !== null && val !== undefined && !(typeof val === 'string' && val === '')) {
          filtrosLimpos[key] = val;
        }
      });

      const params = {
        page: 1,
        limit: 1000, // Mostrar todos os dados
        search: searchTerm,
        ...filtrosLimpos,
        sort: 'data_sessao',
        order: 'desc',
        // Adicionar timestamp para evitar cache
        _t: Date.now()
      };
      
      console.log('🔍 Buscando processos com parâmetros:', params);
      console.log('🔍 Search term:', searchTerm);
      
      const response = await processosService.list(params);
      console.log('📊 Resposta da API:', response);
      console.log('📊 Dados dos processos:', response.data);
      console.log('📊 Total de processos:', response.data?.length);
      
      setProcessos(response.data || []);
      setTotalItems(response.pagination?.total || response.data?.length || 0);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
      showSnackbar('Erro ao carregar processos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosApoio = async () => {
    try {
      const [modalidadesRes, ugsRes, responsaveisRes, situacoesRes] = await Promise.all([
        modalidadesService.list({ ativo: true, limit: 100 }),
        unidadesGestorasService.list({ ativo: true, limit: 100 }),
        responsaveisService.list({ ativo: true, limit: 100 }),
        situacoesService.list({ ativo: true, limit: 100 })
      ]);

      setModalidades(modalidadesRes);
      setUnidadesGestoras(ugsRes);
      setResponsaveis(responsaveisRes.data || responsaveisRes);
      setSituacoes(situacoesRes.data || situacoesRes);
    } catch (error) {
      console.error('Erro ao carregar dados de apoio:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const resetForm = () => {
    setProcessoForm({
      nup: '',
      objeto: '',
      ug_id: '',
      data_entrada: new Date().toISOString().split('T')[0],
      responsavel_id: '',
      modalidade_id: '',
      numero_ano: '',
      rp: false,
      data_sessao: '',
      data_pncp: '',
      data_tce_1: '',
      valor_estimado: '',
      valor_realizado: '',
      desagio: '',
      percentual_reducao: '',
      situacao_id: '',
      data_situacao: new Date().toISOString().split('T')[0],
      data_tce_2: '',
      conclusao: false,
      observacoes: ''
    });
  };

  const handleOpenDialog = (processo?: Processo) => {
    if (processo) {
      setEditingProcesso(processo);
      
      // Calcular deságio automaticamente
      const { desagio, percentual_reducao } = calcularDesagio(
        processo.valor_estimado, 
        processo.valor_realizado || ''
      );
      
      setProcessoForm({
        nup: formatNupExibicao(processo.nup),
        objeto: processo.objeto,
        ug_id: processo.ug_id,
        data_entrada: processo.data_entrada.split('T')[0],
        responsavel_id: processo.responsavel_id,
        modalidade_id: processo.modalidade_id,
        numero_ano: processo.numero_ano,
        rp: processo.rp,
        data_sessao: processo.data_sessao ? processo.data_sessao.split('T')[0] : '',
        data_pncp: processo.data_pncp ? processo.data_pncp.split('T')[0] : '',
        data_tce_1: processo.data_tce_1 ? processo.data_tce_1.split('T')[0] : '',
        valor_estimado: processo.valor_estimado,
        valor_realizado: processo.valor_realizado || '',
        desagio: desagio,
        percentual_reducao: percentual_reducao,
        situacao_id: processo.situacao_id,
        data_situacao: processo.data_situacao.split('T')[0],
        data_tce_2: processo.data_tce_2 ? processo.data_tce_2.split('T')[0] : '',
        conclusao: processo.conclusao,
        observacoes: processo.observacoes || ''
      });
    } else {
      setEditingProcesso(null);
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProcesso(null);
    resetForm();
  };

  // Função para padronizar NUP para o formato 000001/2025
  const padronizarNup = (input: string): string => {
    if (!input) return '';
    // Extrai apenas dígitos e barra
    let limpo = input.replace(/[^0-9/]/g, '');
    // Extrai número e ano
    const match = limpo.match(/^(\d{1,6})\/(\d{4})$/);
    if (match) {
      const numero = match[1].padStart(6, '0');
      const ano = match[2];
      return `00000.0.${numero}/${ano}`;
    }
    // Se já está no formato completo, retorna como está
    if (/^00000\.0\.\d{6}\/\d{4}$/.test(input)) {
      return input;
    }
    return limpo;
  };

  const handleSave = async () => {
    if (processoForm.nup.length !== 11) {
      showSnackbar('O NUP deve conter 6 dígitos, uma barra e 4 dígitos do ano (ex: 000001/2025)', 'error');
      return;
    }
    try {
      // Padronizar NUP antes de enviar
      const nupPadronizado = padronizarNup(processoForm.nup);
      const data = {
        ...processoForm,
        nup: nupPadronizado,
        valor_estimado: Number(processoForm.valor_estimado),
        valor_realizado: processoForm.valor_realizado ? Number(processoForm.valor_realizado) : null
      };
      
      if (editingProcesso) {
        await processosService.update(editingProcesso.id, data);
        showSnackbar('Processo atualizado com sucesso!', 'success');
      } else {
        await processosService.create(data);
        showSnackbar('Processo criado com sucesso!', 'success');
      }
      
      handleCloseDialog();
      
      // Aguardar um pouco antes de recarregar para garantir que o backend processou
      setTimeout(() => {
        carregarDados();
      }, 100);
      
    } catch (error: any) {
      // Verifica se é erro de NUP duplicado
      if (error?.response?.data?.error && error.response.data.error.includes('NUP já existe')) {
        showSnackbar('Já existe um processo cadastrado com este NUP.', 'error');
      } else {
        showSnackbar('Erro ao salvar processo', 'error');
      }
    }
  };

  const handleDelete = async (processo: Processo) => {
    if (window.confirm(`Tem certeza que deseja excluir o processo ${formatNupExibicao(processo.nup)}?`)) {
      try {
        await processosService.delete(processo.id);
        showSnackbar('Processo excluído com sucesso!', 'success');
        carregarDados();
      } catch (error) {
        showSnackbar('Erro ao excluir processo', 'error');
      }
    }
  };

  const handleViewStats = async (processo: Processo) => {
    setLoadingStats(true);
    setOpenStatsDialog(true);
    try {
      const response = await processosService.getStats(processo.id);
      setProcessoStats(response.data);
    } catch (error) {
      showSnackbar('Erro ao carregar estatísticas do processo', 'error');
      setOpenStatsDialog(false);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || typeof value !== 'number') {
      return '';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Função utilitária para parse seguro de datas YYYY-MM-DD
  const formatDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return '-';
    
    // Se já é uma data válida no formato YYYY-MM-DD, usar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    }
    
    // Tentar converter outras strings de data
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
    
    return '-';
  };

  // Função para calcular deságio e percentual de redução
  const calcularDesagio = (valorEstimado: number | '', valorRealizado: number | '') => {
    const valorEstimadoNum = typeof valorEstimado === 'number' ? valorEstimado : parseFloat(String(valorEstimado));
    const valorRealizadoNum = typeof valorRealizado === 'number' ? valorRealizado : parseFloat(String(valorRealizado));
    
    if (!valorEstimadoNum || !valorRealizadoNum || valorEstimadoNum <= 0) {
      return { desagio: '' as number | '', percentual_reducao: '' as number | '' };
    }

    const desagio = valorEstimadoNum - valorRealizadoNum;
    const percentual = (desagio / valorEstimadoNum) * 100;

    return {
      desagio: desagio > 0 ? desagio : '' as number | '',
      percentual_reducao: desagio > 0 ? percentual : '' as number | ''
    };
  };

  // Utilitário para formatar moeda brasileira em tempo real (R$ 1.234,56)
  const formatarMoedaBR = (valorDigitado: string) => {
    // Remove tudo que não for dígito
    const somenteDigitos = valorDigitado.replace(/\D/g, '');
    // Converte para número inteiro (centavos)
    const numero = parseInt(somenteDigitos || '0', 10);
    // Divide por 100 para obter valor com 2 casas
    const valor = numero / 100;
    // Formata
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Máscara para NUP: 6 dígitos + "/" + 4 dígitos de ano
  const aplicarMascaraNup = (valor: string): string => {
    // Mantém apenas dígitos
    const digitos = valor.replace(/\D/g, '');
    if (digitos.length <= 6) return digitos; // Ainda digitando a parte do número
    const numero = digitos.slice(0, 6);
    const ano = digitos.slice(6, 10);
    return `${numero}/${ano}`;
  };

  // Máscara para Número/Ano: 3 dígitos + "/" + 4 dígitos
  const aplicarMascaraNumeroAno = (valor: string): string => {
    const digitos = valor.replace(/\D/g, '');
    if (digitos.length <= 3) return digitos; // Número em digitação
    const numero = digitos.slice(0, 3);
    const ano = digitos.slice(3, 7);
    return `${numero}/${ano}`;
  };

  // Handler para mudança no valor estimado
  const handleValorEstimadoChange = (value: string) => {
    const valorFormatado = formatarMoedaBR(value);
    // Converte valor formatado para número real
    const numero = parseFloat(valorFormatado.replace(/\./g, '').replace(',', '.'));

    setProcessoForm(prev => {
      const novoValor = isNaN(numero) ? '' : Number(numero.toFixed(2));
      const atualizado = { ...prev, valor_estimado: novoValor } as ProcessoForm;

      // Recalcula deságio caso haja valor realizado
      if (atualizado.valor_realizado) {
        const { desagio, percentual_reducao } = calcularDesagio(novoValor, atualizado.valor_realizado);
        atualizado.desagio = desagio;
        atualizado.percentual_reducao = percentual_reducao;
      }

      return atualizado;
    });
  };

  // Handler para mudança no valor realizado
  const handleValorRealizadoChange = (value: string) => {
    const valorFormatado = formatarMoedaBR(value);
    const numero = parseFloat(valorFormatado.replace(/\./g, '').replace(',', '.'));

    setProcessoForm(prev => {
      const novoValor = isNaN(numero) ? '' : Number(numero.toFixed(2));
      const atualizado = { ...prev, valor_realizado: novoValor } as ProcessoForm;

      // Recalcula deságio caso haja valor estimado
      if (atualizado.valor_estimado) {
        const { desagio, percentual_reducao } = calcularDesagio(atualizado.valor_estimado, novoValor);
        atualizado.desagio = desagio;
        atualizado.percentual_reducao = percentual_reducao;
      }

      return atualizado;
    });
  };

  const getSituacaoChip = (situacao: any) => {
    if (!situacao) return '-';
    
    return (
      <Chip
        label={situacao.nome_situacao}
        size="small"
        sx={{
          backgroundColor: situacao.cor_hex + '20',
          color: situacao.cor_hex,
          border: `1px solid ${situacao.cor_hex}`,
          fontWeight: 500
        }}
      />
    );
  };

  const clearFilters = () => {
    setFiltros({
      ug_id: '',
      responsavel_id: '',
      modalidade_id: '',
      situacao_id: '',
      conclusao: '',
      rp: ''
    });
    setSearchTerm('');
  };

  const handleFilterChange = (key: string, value: any) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const handleColumnVisibilityToggle = (columnId: string) => {
    setVisibleColumns(prev => ({ ...prev, [columnId]: !prev[columnId] }));
  };

  // Função para calcular larguras das colunas automaticamente
  const calculateColumnWidths = () => {
    if (!autoAdjustEnabled) return;
    // Simple logic: give more space to 'objeto'
    const totalWidth = document.getElementById('processos-table-container')?.clientWidth || 1200;
    const fixedWidth = 3 * 120; // Ações, etc.
    const dynamicColumnCount = Object.values(visibleColumns).filter(v => v).length - 1;
    const baseWidth = (totalWidth - fixedWidth) / dynamicColumnCount;
    
    const newWidths: {[key: string]: number} = {};
    activeColumns.forEach((col: Column) => {
      if (col.id === 'objeto') {
        newWidths[col.id] = baseWidth * 2;
      } else if (col.id !== 'acoes') {
        newWidths[col.id] = baseWidth * 0.8;
      }
    });

    setColumnWidths(newWidths);
  };

  // Função para alternar auto-ajuste
  const toggleAutoAdjust = () => {
    setAutoAdjustEnabled(!autoAdjustEnabled);
    if (!autoAdjustEnabled) { // If turning it on
      calculateColumnWidths();
    }
  };

  // Função para resetar larguras das colunas
  const resetColumnWidths = () => {
    setColumnWidths({});
    if (autoAdjustEnabled) {
      calculateColumnWidths();
    }
  };

  // Calcular larguras iniciais
  useEffect(() => {
    if (autoAdjustEnabled) {
      calculateColumnWidths();
    }
  }, [visibleColumns, autoAdjustEnabled]);

  // Recalcular quando a janela é redimensionada
  useEffect(() => {
    const handleResize = () => {
      if (autoAdjustEnabled) {
        calculateColumnWidths();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoAdjustEnabled]);

  // Função para formatar NUP completo (para banco de dados)
  const formatNupCompleto = (input: string): string => {
    if (!input) return '';
    
    // Se já está no formato completo, retorna como está
    if (/^\d{5}\.0\.\d{6}\/\d{4}$/.test(input)) {
      return input;
    }
    
    // Se está no formato simples (6 dígitos + barra + 4 dígitos)
    const matchSimples = input.match(/^(\d{6})\/(\d{4})$/);
    if (matchSimples) {
      const numero = matchSimples[1];
      const ano = matchSimples[2];
      // Formato: 00001.0.052025/2025
      return `00001.0.${numero}/${ano}`;
    }
    
    // Se contém apenas números e barra, tenta processar
    const match = input.match(/^(\d+)\/(\d{4})$/);
    if (match) {
      const numero = match[1].padStart(6, '0');
      const ano = match[2];
      return `00001.0.${numero}/${ano}`;
    }
    
    return input;
  };

  // Função para formatar NUP para exibição (formato compacto)
  const formatNupExibicao = (nupCompleto: string): string => {
    if (!nupCompleto) return '';
    
    // Extrai apenas o número e ano do NUP completo (formato: 00000.0.000001/2025)
    const match = nupCompleto.match(/^\d{5}\.0\.(\d{6})\/(\d{4})$/);
    if (match) {
      const numero = match[1]; // Mantém os zeros à esquerda
      const ano = match[2];
      return `${numero}/${ano}`;
    }
    
    // Se não for formato completo, tenta extrair número/ano de outros formatos
    const matchSimples = nupCompleto.match(/^(\d{1,6})\/(\d{4})$/);
    if (matchSimples) {
      const numero = matchSimples[1].padStart(6, '0'); // Adiciona zeros à esquerda
      const ano = matchSimples[2];
      return `${numero}/${ano}`;
    }
    
    return nupCompleto;
  };

  // Função para validar formato do NUP
  const validarNup = (nup: string): boolean => {
    if (!nup) return false;
    
    // Formato completo: 5 dígitos + ponto + zero + ponto + 6 dígitos + barra + 4 dígitos
    // Exemplo: 00001.0.052025/2025
    const formatoCompleto = /^\d{5}\.0\.\d{6}\/\d{4}$/;
    
    // Formato simples: 6 dígitos + barra + 4 dígitos
    // Exemplo: 052025/2025
    const formatoSimples = /^\d{6}\/\d{4}$/;
    
    return formatoCompleto.test(nup) || formatoSimples.test(nup);
  };

  // Handler para mudança do campo NUP
  const handleNupChange = (value: string) => {
    // Remove caracteres especiais e espaços
    const limpo = value.replace(/[^ -0-9\/]/g, '');
    // Se contém barra, assume formato número/ano
    if (limpo.includes('/')) {
      const [numero, ano] = limpo.split('/');
      if (numero && ano && ano.length === 4) {
        const numeroFormatado = numero.padStart(6, '0');
        setProcessoForm(prev => ({ 
          ...prev, 
          nup: `${numeroFormatado}/${ano}` 
        }));
      } else {
        setProcessoForm(prev => ({ ...prev, nup: limpo }));
      }
      } else {
      setProcessoForm(prev => ({ ...prev, nup: limpo }));
        }
  };

  const handleSelectAll = () => {
    if (isSelectAllChecked) {
      // Deselecionar todos
      setSelectedProcessos([]);
      setIsSelectAllChecked(false);
    } else {
      // Selecionar todos
      setSelectedProcessos(processos.map(p => p.id));
      setIsSelectAllChecked(true);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedProcessos.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedProcessos.length} processo(s) selecionado(s)? Esta ação não pode ser desfeita.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingBatch(true);
    
    try {
      // Excluir processos um por um
      const deletePromises = selectedProcessos.map(id => 
        processosService.delete(id)
      );
      
      await Promise.all(deletePromises);
      
      showSnackbar(`${selectedProcessos.length} processo(s) excluído(s) com sucesso!`, 'success');
      
      // Limpar seleções
      setSelectedProcessos([]);
      setIsSelectAllChecked(false);
      
      // Recarregar dados
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir processos em lote:', error);
      showSnackbar('Erro ao excluir alguns processos. Verifique e tente novamente.', 'error');
    } finally {
      setDeletingBatch(false);
    }
  };

  const clearSelection = () => {
    setSelectedProcessos([]);
    setIsSelectAllChecked(false);
  };

  // Efeito para limpar seleções quando os processos mudam (filtros, busca, etc)
  useEffect(() => {
    clearSelection();
  }, [searchTerm, filtros]);

  const renderHeaderCells = () => {
    return columns.filter(col => visibleColumns[col.id] || col.id === 'selecao').map((column) => {
      // Cabeçalho especial para coluna de seleção
      if (column.id === 'selecao' && user?.perfil === 'admin') {
        return (
          <TableCell
            key={column.id}
            align="center"
            style={{ width: 50, minWidth: 50 }}
            sx={{ 
              fontWeight: 'bold'
            }}
          >
            <Checkbox
              checked={isSelectAllChecked}
              indeterminate={selectedProcessos.length > 0 && selectedProcessos.length < processos.length}
              onChange={handleSelectAll}
              size="small"
            />
          </TableCell>
        );
      }
      
      if (column.sortable) {
        return (
          <TableCell
            key={column.id}
            align={column.align}
            style={{ 
              width: columnWidths[column.id] || column.minWidth,
              minWidth: column.minWidth,
              maxWidth: columnWidths[column.id] || column.minWidth
            }}
            sx={{ 
              fontWeight: 'bold',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
            onClick={() => handleColumnVisibilityToggle(column.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {column.label}
              {column.sortable && (
                <TableSortLabel
                  active={visibleColumns[column.id]}
                  direction={visibleColumns[column.id] ? 'asc' : 'desc'}
                />
              )}
            </Box>
          </TableCell>
        );
      }
      return (
        <TableCell 
          key={column.id} 
          align={column.align} 
          style={{ minWidth: column.minWidth }}
          sx={{ fontWeight: 'bold' }}
        >
          {column.label}
        </TableCell>
      );
    });
  };

  const tableHeader = (
    <TableHead>
      <TableRow>
        {renderHeaderCells()}
      </TableRow>
    </TableHead>
  );

  // Função para selecionar/deselecionar um processo na tabela
  const handleSelectProcesso = (processoId: number) => {
    setSelectedProcessos(prev => {
      if (prev.includes(processoId)) {
        const newSelected = prev.filter(id => id !== processoId);
        setIsSelectAllChecked(false);
        return newSelected;
      } else {
        const newSelected = [...prev, processoId];
        if (newSelected.length === processos.length) {
          setIsSelectAllChecked(true);
        }
        return newSelected;
      }
    });
  };

  // Função para baixar o template CSV de importação
  const downloadTemplate = () => {
    const headers = [
      'nup',
      'objeto',
      'sigla_unidade_gestora',
      'data_entrada',
      'nome_responsavel',
      'sigla_modalidade',
      'numero_ano',
      'valor_estimado',
      'nome_situacao',
      'data_situacao',
      'rp',
      'data_sessao',
      'data_pncp',
      'data_tce_1',
      'data_tce_2',
      'valor_realizado',
      'conclusao',
      'observacoes'
    ].join(';');

    const exemplo = [
      '00000.0.000001/2025',
      'Aquisição de material de escritório',
      'SUPEL',
      '2025-01-15',
      'João Silva Santos',
      'PE',
      '',
      '75000.00',
      'Recebido',
      '2025-01-15',
      'false',
      '',
      '',
      '',
      '',
      '',
      'false',
      'Processo de exemplo'
    ].join(';');

    const csvContent = `${headers}\n${exemplo}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_importacao_processos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para upload de arquivo CSV
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Por favor, selecione um arquivo CSV válido.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImportError('O arquivo deve ter no máximo 5MB.');
      return;
    }
    setUploading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await processosService.importCsv(formData);
      setImportResult(response);
      setShowResultDialog(true);
      carregarDados();
    } catch (error: any) {
      setImportError(error.response?.data?.message || 'Erro durante a importação do arquivo.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  // Função para fechar o dialog de resultado da importação
  const closeResultDialog = () => {
    setShowResultDialog(false);
    setImportResult(null);
  };

  // Funções para modal de histórico
  const handleOpenHistorico = () => setOpenHistorico(true);
  const handleCloseHistorico = () => setOpenHistorico(false);

  return (
    <Box sx={{ 
      px: { xs: 1, sm: 2, md: 4 }, 
      pb: 4, 
      mt: 4,
      height: 'calc(100vh - 64px)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexShrink: 0
      }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          📄 Processos {totalItems > 0 && `(${totalItems})`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Indicador de Auto-Ajuste */}
          <Chip
            label={autoAdjustEnabled ? 'Auto-Ajuste ON' : 'Auto-Ajuste OFF'}
            color={autoAdjustEnabled ? 'success' : 'default'}
            size="small"
            variant="outlined"
            icon={autoAdjustEnabled ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
          />
          
          <Tooltip title="Controlar Colunas">
            <IconButton
              onClick={(event) => setColumnMenuAnchor(event.currentTarget)}
              color="primary"
            >
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>

          {/* Botões de importação CSV - apenas para admins */}
          {user?.perfil === 'admin' && (
            <>
              <Tooltip title="Baixar Template CSV">
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadTemplate}
                  sx={{ borderRadius: 2 }}
                >
                  Template
                </Button>
              </Tooltip>
              
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="csv-upload"
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label htmlFor="csv-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={uploading}
                  sx={{ borderRadius: 2 }}
                >
                  {uploading ? 'Importando...' : 'Importar CSV'}
                </Button>
              </label>
            </>
          )}
          
          {/* Botão de exclusão em lote - apenas para admins */}
          {user?.perfil === 'admin' && selectedProcessos.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBatchDelete}
              disabled={deletingBatch}
              sx={{ borderRadius: 2 }}
            >
              {deletingBatch ? 'Excluindo...' : `Excluir ${selectedProcessos.length} selecionado(s)`}
            </Button>
          )}
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2 }}
          >
            Adicionar Processo
          </Button>
        </Box>
      </Box>

      {/* Menu de controle de colunas */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
        PaperProps={{
          sx: { maxHeight: 500, width: 280 }
        }}
        sx={{ flexShrink: 0 }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Controlar Colunas Visíveis
          </Typography>
          
          {/* Opção de Auto-Ajuste */}
          <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoAdjustEnabled}
                  onChange={toggleAutoAdjust}
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Auto-Ajuste de Colunas
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ajusta automaticamente as larguras das colunas
                  </Typography>
                </Box>
              }
            />
          </Box>
          
          <Divider sx={{ mb: 1 }} />
          
          {/* Lista de Colunas */}
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Colunas Disponíveis:
          </Typography>
          
          {columns.filter(col => col.id !== 'acoes' && col.id !== 'selecao').map((column) => (
            <FormControlLabel
              key={column.id}
              control={
                <Checkbox
                  checked={visibleColumns[column.id]}
                  onChange={() => handleColumnVisibilityToggle(column.id)}
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">
                    {column.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {column.description || 'Coluna de dados'}
                  </Typography>
                </Box>
              }
              sx={{ 
                display: 'block', 
                mb: 1,
                '& .MuiFormControlLabel-label': { width: '100%' }
              }}
            />
          ))}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
            <Button
              size="small"
              onClick={resetColumnWidths}
              variant="outlined"
              startIcon={<RestartAltIcon />}
            >
              Resetar Larguras
            </Button>
            
            <Button
              size="small"
              onClick={() => setColumnMenuAnchor(null)}
              variant="contained"
            >
              Fechar
            </Button>
          </Box>
        </Box>
      </Menu>

      {/* Mensagens de erro de importação */}
      {importError && (
        <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }} onClose={() => setImportError(null)}>
          {importError}
        </Alert>
      )}

      {/* Indicador de upload */}
      {uploading && (
        <Card sx={{ mb: 2, flexShrink: 0 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <UploadIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Importando Processos...</Typography>
            </Box>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Processando arquivo CSV... Isso pode levar alguns momentos.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      {showFilters && (
        <Paper sx={{ mb: 2, p: 2, flexShrink: 0 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por NUP, objeto ou número/ano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Unidade Gestora</InputLabel>
                <Select
                  value={filtros.ug_id}
                  label="Unidade Gestora"
                  onChange={(e) => handleFilterChange('ug_id', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {unidadesGestoras.map((ug) => (
                    <MenuItem key={ug.id} value={ug.id}>
                      {ug.sigla}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Responsável</InputLabel>
                <Select
                  value={filtros.responsavel_id}
                  label="Responsável"
                  onChange={(e) => handleFilterChange('responsavel_id', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {responsaveis.map((resp) => (
                    <MenuItem key={resp.id} value={resp.id}>
                      {resp.primeiro_nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Modalidade</InputLabel>
                <Select
                  value={filtros.modalidade_id}
                  label="Modalidade"
                  onChange={(e) => handleFilterChange('modalidade_id', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {modalidades.map((mod) => (
                    <MenuItem key={mod.id} value={mod.id}>
                      {mod.sigla_modalidade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Situação</InputLabel>
                <Select
                  value={filtros.situacao_id}
                  label="Situação"
                  onChange={(e) => handleFilterChange('situacao_id', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {situacoes.map((sit) => (
                    <MenuItem key={sit.id} value={sit.id}>
                      {sit.nome_situacao}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={1}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Limpar Filtros">
                  <IconButton
                    onClick={clearFilters}
                    size="small"
                    color="secondary"
                  >
                    <ClearAllIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Ocultar Filtros">
                  <IconButton
                    onClick={() => setShowFilters(false)}
                    size="small"
                  >
                    <VisibilityOffIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Botão para mostrar filtros quando ocultos */}
      {!showFilters && (
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={() => setShowFilters(true)}
            sx={{ borderRadius: 2 }}
          >
            Mostrar Filtros
          </Button>
        </Box>
      )}

      {/* Tabela com scroll interno */}
      <Paper sx={{ width: '100%', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {renderHeaderCells()}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.filter(col => visibleColumns[col.id] || col.id === 'selecao').length} align="center">
                    <Box sx={{ py: 4 }}>
                      <CircularProgress size={24} sx={{ mr: 2 }} />
                      Carregando processos...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : processos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.filter(col => visibleColumns[col.id] || col.id === 'selecao').length} align="center">
                    <Box sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhum processo encontrado
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                processos.map((processo) => (
                  <TableRow key={processo.id} hover sx={{ height: 'auto' }}>
                    {columns.filter(col => visibleColumns[col.id] || col.id === 'selecao').map((column) => {
                      let value;
                      switch (column.id) {
                        case 'unidade_gestora':
                          value = processo.unidade_gestora;
                          break;
                        case 'responsavel':
                          value = processo.responsavel;
                          break;
                        case 'modalidade':
                          value = processo.modalidade;
                          break;
                        case 'situacao':
                          value = processo.situacao;
                          break;
                        case 'acoes':
                          value = null;
                          break;
                        case 'selecao':
                          value = null; // Será tratado pelo column.format
                          break;
                        default:
                          value = processo[column.id as keyof Processo];
                      }
                      
                      return (
                        <TableCell 
                          key={column.id} 
                          align={column.align}
                          style={{ 
                            width: columnWidths[column.id] || column.minWidth,
                            minWidth: column.minWidth,
                            maxWidth: columnWidths[column.id] || column.minWidth
                          }}
                          sx={{
                            overflow: column.id === 'objeto' ? 'visible' : 'hidden',
                            textOverflow: column.id === 'objeto' ? 'clip' : 'ellipsis',
                            whiteSpace: column.id === 'objeto' ? 'normal' : 'nowrap',
                            verticalAlign: column.id === 'objeto' ? 'top' : 'middle',
                            py: column.id === 'objeto' ? 2 : 1
                          }}
                        >
                          {column.format ? column.format(value, processo) : (value as React.ReactNode)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Paginação removida - mostrando todos os registros */}

      </Paper>

      {/* Dialog de Cadastro/Edição */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProcesso ? 'Editar Processo' : 'Novo Processo'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              {/* Dados Básicos */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Dados Básicos
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="NUP *"
                  value={processoForm.nup}
                  onChange={(e) => {
                    let valor = e.target.value.replace(/[^0-9/]/g, '');
                    // Se o usuário digitar a barra, completa com zeros à esquerda
                    if (valor.includes('/')) {
                      const partes = valor.split('/');
                      let numero = partes[0].padStart(6, '0').slice(-6);
                      let ano = partes[1] ? partes[1].slice(0, 4) : '';
                      valor = numero + '/' + ano;
                    } else {
                      // Máscara automática: exige 6 dígitos + 4 do ano
                      if (valor.length > 10) valor = valor.slice(0, 10);
                      if (valor.length >= 7) {
                        valor = valor.slice(0, 6) + '/' + valor.slice(6, 10);
                      }
                    }
                    setProcessoForm(prev => ({ ...prev, nup: valor }));
                  }}
                  placeholder="000001/2025"
                  helperText="Digite 6 dígitos do número e 4 do ano (ex: 000001/2025)"
                  inputProps={{ maxLength: 11 }}
                  error={processoForm.nup.length > 0 && processoForm.nup.length !== 11}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número/Ano"
                  value={processoForm.numero_ano}
                  onChange={(e) => {
                    const mascarado = aplicarMascaraNumeroAno(e.target.value);
                    setProcessoForm(prev => ({ ...prev, numero_ano: mascarado }));
                  }}
                  placeholder="001/2024"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Objeto *"
                  value={processoForm.objeto}
                  onChange={(e) => setProcessoForm(prev => ({ ...prev, objeto: e.target.value }))}
                  multiline
                  rows={3}
                />
              </Grid>

              {/* Dados Administrativos */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Dados Administrativos
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Unidade Gestora *</InputLabel>
                  <Select
                    value={processoForm.ug_id}
                    label="Unidade Gestora *"
                    onChange={(e) => setProcessoForm(prev => ({ 
                      ...prev, 
                      ug_id: e.target.value as number 
                    }))}
                  >
                    {unidadesGestoras.map((ug) => (
                      <MenuItem key={ug.id} value={ug.id}>
                        {ug.sigla} - {ug.nome_completo_unidade}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Responsável</InputLabel>
                  <Select
                    value={processoForm.responsavel_id}
                    label="Responsável"
                    onChange={(e) => setProcessoForm(prev => ({ 
                      ...prev, 
                      responsavel_id: e.target.value as number 
                    }))}
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {responsaveis.map((resp) => (
                      <MenuItem key={resp.id} value={resp.id}>
                        {resp.nome_responsavel}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Modalidade</InputLabel>
                  <Select
                    value={processoForm.modalidade_id}
                    label="Modalidade"
                    onChange={(e) => setProcessoForm(prev => ({ 
                      ...prev, 
                      modalidade_id: e.target.value as number 
                    }))}
                  >
                    <MenuItem value="">Nenhuma</MenuItem>
                    {modalidades.map((mod) => (
                      <MenuItem key={mod.id} value={mod.id}>
                        {mod.sigla_modalidade} - {mod.nome_modalidade}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Situação *</InputLabel>
                  <Select
                    value={processoForm.situacao_id}
                    label="Situação *"
                    onChange={(e) => setProcessoForm(prev => ({ 
                      ...prev, 
                      situacao_id: e.target.value as number 
                    }))}
                  >
                    {situacoes.map((sit) => (
                      <MenuItem key={sit.id} value={sit.id}>
                        {sit.nome_situacao}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Datas */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Datas
                </Typography>
              </Grid>

              {/* Primeira linha - 3 colunas */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Data de Entrada *"
                  type="date"
                  value={processoForm.data_entrada}
                  onChange={(e) => setProcessoForm(prev => ({ 
                    ...prev, 
                    data_entrada: e.target.value 
                  }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      filter: mode === 'dark' ? 'invert(1) brightness(1.2)' : 'none',
                      transform: 'scale(1.2)',
                      cursor: 'pointer'
                    },
                    '& input[type="date"]::-webkit-datetime-edit': {
                      color: mode === 'dark' ? '#fff' : 'inherit'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Data da Situação *"
                  type="date"
                  value={processoForm.data_situacao}
                  onChange={(e) => setProcessoForm(prev => ({ 
                    ...prev, 
                    data_situacao: e.target.value 
                  }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      filter: mode === 'dark' ? 'invert(1) brightness(1.2)' : 'none',
                      transform: 'scale(1.2)',
                      cursor: 'pointer'
                    },
                    '& input[type="date"]::-webkit-datetime-edit': {
                      color: mode === 'dark' ? '#fff' : 'inherit'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Data da Sessão"
                  type="date"
                  value={processoForm.data_sessao}
                  onChange={(e) => setProcessoForm(prev => ({ 
                    ...prev, 
                    data_sessao: e.target.value 
                  }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      filter: mode === 'dark' ? 'invert(1) brightness(1.2)' : 'none',
                      transform: 'scale(1.2)',
                      cursor: 'pointer'
                    },
                    '& input[type="date"]::-webkit-datetime-edit': {
                      color: mode === 'dark' ? '#fff' : 'inherit'
                    }
                  }}
                />
              </Grid>

              {/* Segunda linha - 3 colunas */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Data PNCP"
                  type="date"
                  value={processoForm.data_pncp}
                  onChange={(e) => setProcessoForm(prev => ({ 
                    ...prev, 
                    data_pncp: e.target.value 
                  }))}
                  InputLabelProps={{ shrink: true }}
                  helperText="Data de publicação no PNCP"
                  sx={{
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      filter: mode === 'dark' ? 'invert(1) brightness(1.2)' : 'none',
                      transform: 'scale(1.2)',
                      cursor: 'pointer'
                    },
                    '& input[type="date"]::-webkit-datetime-edit': {
                      color: mode === 'dark' ? '#fff' : 'inherit'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Data TCE 1"
                  type="date"
                  value={processoForm.data_tce_1}
                  onChange={(e) => setProcessoForm(prev => ({ 
                    ...prev, 
                    data_tce_1: e.target.value 
                  }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      filter: mode === 'dark' ? 'invert(1) brightness(1.2)' : 'none',
                      transform: 'scale(1.2)',
                      cursor: 'pointer'
                    },
                    '& input[type="date"]::-webkit-datetime-edit': {
                      color: mode === 'dark' ? '#fff' : 'inherit'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Data TCE 2"
                  type="date"
                  value={processoForm.data_tce_2}
                  onChange={(e) => setProcessoForm(prev => ({ 
                    ...prev, 
                    data_tce_2: e.target.value 
                  }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      filter: mode === 'dark' ? 'invert(1) brightness(1.2)' : 'none',
                      transform: 'scale(1.2)',
                      cursor: 'pointer'
                    },
                    '& input[type="date"]::-webkit-datetime-edit': {
                      color: mode === 'dark' ? '#fff' : 'inherit'
                    }
                  }}
                />
              </Grid>

              {/* Valores */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Valores
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Valor Estimado *"
                  type="text"
                  value={
                    (typeof processoForm.valor_estimado === 'number')
                      ? Number(processoForm.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : ''
                  }
                  onChange={(e) => handleValorEstimadoChange(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Valor Realizado"
                  type="text"
                  value={
                    (typeof processoForm.valor_realizado === 'number')
                      ? Number(processoForm.valor_realizado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : ''
                  }
                  onChange={(e) => handleValorRealizadoChange(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Deságio"
                  type="text"
                  value={
                    (typeof processoForm.desagio === 'number')
                      ? Number(processoForm.desagio).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : ''
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    readOnly: true,
                  }}
                  helperText="Calculado automaticamente"
                  sx={{
                    '& .MuiInputBase-input': {
                      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f5f5f5',
                      color: mode === 'dark' ? '#eee' : '#666',
                      textAlign: 'right'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Percentual de Redução"
                  type="text"
                  value={
                    (typeof processoForm.percentual_reducao === 'number')
                      ? Number(processoForm.percentual_reducao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : ''
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    readOnly: true,
                  }}
                  helperText="Calculado automaticamente"
                  sx={{
                    '& .MuiInputBase-input': {
                      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f5f5f5',
                      color: mode === 'dark' ? '#eee' : '#666',
                      textAlign: 'right'
                    }
                  }}
                />
              </Grid>

              {/* Opções */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Opções
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={processoForm.rp}
                      onChange={(e) => setProcessoForm(prev => ({ 
                        ...prev, 
                        rp: e.target.checked 
                      }))}
                    />
                  }
                  label="Registro de Preço (RP)"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={processoForm.conclusao}
                      onChange={(e) => setProcessoForm(prev => ({ 
                        ...prev, 
                        conclusao: e.target.checked 
                      }))}
                    />
                  }
                  label="Processo Concluído"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  value={processoForm.observacoes}
                  onChange={(e) => setProcessoForm(prev => ({ 
                    ...prev, 
                    observacoes: e.target.value 
                  }))}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained" color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={
              !validarNup(processoForm.nup) || 
              !processoForm.objeto.trim() || 
              !processoForm.ug_id ||
              !processoForm.data_entrada
            }
          >
            {editingProcesso ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Estatísticas */}
      <Dialog 
        open={openStatsDialog} 
        onClose={() => setOpenStatsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          📊 Estatísticas do Processo
        </DialogTitle>
        <DialogContent>
          {loadingStats ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography>Carregando estatísticas...</Typography>
            </Box>
          ) : processoStats ? (
            <Grid container spacing={3}>
              {/* Header com informações básicas */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ bgcolor: 'primary.50' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AssessmentIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
                      <Typography variant="h5" fontWeight="bold">
                        {formatNupExibicao(processoStats.nup)}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      {processoStats.objeto}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={processoStats.unidade_gestora} 
                        color="primary" 
                        variant="outlined" 
                        size="small" 
                      />
                      <Chip 
                        label={processoStats.modalidade} 
                        color="secondary" 
                        variant="outlined" 
                        size="small" 
                      />
                      <Chip 
                        label={processoStats.responsavel} 
                        color="info" 
                        variant="outlined" 
                        size="small" 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Valores e Economicidade */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <MoneyIcon color="success" sx={{ mr: 1, fontSize: 24 }} />
                      <Typography variant="h6" fontWeight="bold">Valores e Economicidade</Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Valor Estimado:
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatCurrency(processoStats.valor_estimado)}
                      </Typography>
                    </Box>

                    {processoStats.valor_realizado ? (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Valor Realizado:
                          </Typography>
                          <Typography variant="h6" color="success.main" fontWeight="bold">
                            {formatCurrency(processoStats.valor_realizado)}
                          </Typography>
                        </Box>

                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'success.50', 
                          borderRadius: 1, 
                          border: '1px solid',
                          borderColor: 'success.200'
                        }}>
                          <Typography variant="body2" color="success.dark" fontWeight="bold">
                            💰 Economicidade
                          </Typography>
                          <Typography variant="h5" color="success.main" fontWeight="bold">
                            {formatCurrency(processoStats.economia_valor || 0)}
                          </Typography>
                          <Typography variant="body2" color="success.dark">
                            ({processoStats.economia_percentual.toFixed(2)}% de redução)
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'warning.50', 
                        borderRadius: 1, 
                        border: '1px solid',
                        borderColor: 'warning.200'
                      }}>
                        <Typography variant="body2" color="warning.dark">
                          ⏳ Valor realizado ainda não informado
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Tempo e Prazos */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DateRangeIcon color="info" sx={{ mr: 1, fontSize: 24 }} />
                        <Typography variant="h6" fontWeight="bold">Tempo e Prazos</Typography>
                      </Box>
                      {processoStats?.historico_situacoes && processoStats.historico_situacoes.length > 1 && (
                        <Typography
                          variant="body2"
                          color="primary"
                          sx={{ cursor: 'pointer', textDecoration: 'underline', ml: 2 }}
                          onClick={handleOpenHistorico}
                        >
                          Histórico
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Dias desde entrada:
                      </Typography>
                      <Typography variant="h6" color="info.main" fontWeight="bold">
                        {processoStats.dias_desde_entrada} dias
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Dias na situação atual:
                      </Typography>
                      <Typography variant="h6" color="warning.main" fontWeight="bold">
                        {processoStats.dias_situacao_atual} dias
                      </Typography>
                    </Box>

                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'info.50', 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'info.200'
                    }}>
                      <Typography variant="body2" color="info.dark" fontWeight="bold">
                        📅 Datas Importantes
                      </Typography>
                      <Typography variant="body2" color="info.dark">
                        Entrada: {formatDate(processoStats.data_entrada)}
                      </Typography>
                      <Typography variant="body2" color="info.dark">
                        Data Sessão: {processoStats.data_sessao ? formatDate(processoStats.data_sessao) : '-'}
                      </Typography>
                      <Typography variant="body2" color="info.dark">
                        Última situação: {formatDate(processoStats.data_situacao)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Status e Situação */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AssessmentIcon color="secondary" sx={{ mr: 1, fontSize: 24 }} />
                      <Typography variant="h6" fontWeight="bold">Status e Situação</Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: processoStats.eh_finalizadora ? 'error.50' : 'success.50', 
                          borderRadius: 1, 
                          border: '1px solid',
                          borderColor: processoStats.eh_finalizadora ? 'error.200' : 'success.200'
                        }}>
                          <Typography variant="body2" fontWeight="bold" color={processoStats.eh_finalizadora ? 'error.dark' : 'success.dark'}>
                            {processoStats.eh_finalizadora ? '🏁 Situação Finalizadora' : '🔄 Em Andamento'}
                          </Typography>
                          <Typography variant="h6" color={processoStats.eh_finalizadora ? 'error.main' : 'success.main'} fontWeight="bold">
                            {processoStats.situacao}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: processoStats.conclusao ? 'success.50' : 'warning.50', 
                          borderRadius: 1, 
                          border: '1px solid',
                          borderColor: processoStats.conclusao ? 'success.200' : 'warning.200'
                        }}>
                          <Typography variant="body2" fontWeight="bold" color={processoStats.conclusao ? 'success.dark' : 'warning.dark'}>
                            {processoStats.conclusao ? '✅ Processo Concluído' : '⏳ Processo em Andamento'}
                          </Typography>
                          <Typography variant="h6" color={processoStats.conclusao ? 'success.main' : 'warning.main'} fontWeight="bold">
                            {processoStats.conclusao ? 'Finalizado' : 'Pendente'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Resumo Executivo */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ bgcolor: mode === 'dark' ? 'grey.900' : 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      📋 Resumo Executivo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {processoStats.eh_finalizadora || processoStats.conclusao
                        ? (<>
                            Este processo foi <strong>Concluído</strong> há <strong>{processoStats.dias_situacao_atual}</strong> dias. |
                            Valor estimado: <strong>{formatCurrency(processoStats.valor_estimado)}</strong> |
                            Valor realizado: <strong>{processoStats.valor_realizado !== null ? formatCurrency(processoStats.valor_realizado) : 'R$ 0,00'}</strong>
                          </>)
                        : (<>
                            Este processo está há <strong>{processoStats.dias_situacao_atual}</strong> dias em <strong>{processoStats.situacao}</strong> |
                            Valor estimado: <strong>{formatCurrency(processoStats.valor_estimado)}</strong> |
                            Valor realizado: <strong>{processoStats.valor_realizado !== null ? formatCurrency(processoStats.valor_realizado) : 'R$ 0,00'}</strong>
                          </>)}
                    </Typography>
                    
                    {processoStats.valor_realizado && (
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        ✅ Economicidade alcançada: <strong>{processoStats.economia_percentual.toFixed(2)}%</strong> 
                        ({formatCurrency(processoStats.economia_valor || 0)} em economia)
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Situação atual: <strong>
                        {processoStats.situacao}
                        {processoStats.observacoes && ` (${processoStats.observacoes})`}
                      </strong> 
                      {processoStats.eh_finalizadora && ' (Finalizadora)'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="error">
              Erro ao carregar estatísticas
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatsDialog(false)} variant="contained" color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de histórico */}
      <Dialog open={openHistorico} onClose={handleCloseHistorico} maxWidth="sm" fullWidth>
        <DialogTitle>Histórico de Situações</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Situação</TableCell>
                <TableCell>Data de Entrada</TableCell>
                <TableCell>Dias na Situação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processoStats?.historico_situacoes?.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.situacao}</TableCell>
                  <TableCell>{formatDate(item.data)}</TableCell>
                  <TableCell>{item.dias || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Dialog de Resultado da Importação CSV */}
      <Dialog
        open={showResultDialog}
        onClose={closeResultDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            {importResult && importResult.erros.length === 0 ? (
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            ) : (
              <WarningIcon color="warning" sx={{ mr: 1 }} />
            )}
            Resultado da Importação CSV
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {importResult && (
            <Box>
              {/* Resumo */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="primary">
                        {importResult.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total de Linhas
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="success.main">
                        {importResult.importados}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Importados
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="error.main">
                        {importResult.erros.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Erros
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Lista de Erros */}
              {importResult.erros.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Erros encontrados:
                  </Typography>
                  <List dense>
                    {importResult.erros.map((erro, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={erro} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {/* Lista de Warnings */}
              {importResult.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Avisos:
                  </Typography>
                  <List dense>
                    {importResult.warnings.map((warning, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={warning} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {/* Detalhes */}
              {importResult.detalhes.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Detalhes por linha:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Linha</TableCell>
                          <TableCell>NUP</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Mensagem</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importResult.detalhes.map((detalhe, index) => (
                          <TableRow key={index}>
                            <TableCell>{detalhe.linha}</TableCell>
                            <TableCell>{detalhe.nup}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={detalhe.status}
                                color={
                                  detalhe.status === 'sucesso' ? 'success' :
                                  detalhe.status === 'erro' ? 'error' : 'warning'
                                }
                              />
                            </TableCell>
                            <TableCell>{detalhe.mensagem}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeResultDialog} variant="contained">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProcessosPage; 