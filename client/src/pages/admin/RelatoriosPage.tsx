import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Snackbar,
  Checkbox
} from '@mui/material';
import {
  Assessment,
  Close,
  TableChart,
  BarChart as MuiBarChart,
  PieChart as MuiPieChart,
  Timeline,
  Settings,
  Save,
  Share,
  Refresh,
  ViewModule,
  ViewList,
  Delete,
  Visibility,
  Schedule,
  Analytics,
  CloudDownload,
  Email,
  FileDownload,
  ShowChart,
  ScatterPlot,
  Search,
  Speed,
  Print,
  Edit,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Add,
  GetApp,
  PictureAsPdf
} from '@mui/icons-material';
import { formatServerDateBR } from '../../utils/dateUtils';
// Função para abreviar NUP igual ao cadastro de processos - últimos 11 caracteres
function abreviarNup(nup: string) {
  if (!nup) return '';
  return nup.length > 11 ? nup.slice(-11) : nup;
}
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import api, { relatoriosService, relatoriosAdesaoService, unidadesGestorasService, situacoesService } from '../../services/api';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import PageHeader from '../../components/PageHeader';
import PageContainer from '../../components/PageContainer';
interface RelatorioTemplate {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  tipo: 'tabular' | 'grafico' | 'dashboard' | 'misto';
  campos: string[];
  filtros: string[];
  visualizacoes: string[];
  cor: string;
  popular: boolean;
  novo: boolean;
  em_desenvolvimento?: boolean;
  dadosUnicos?: any;
}

interface CampoDisponivel {
  id: string;
  nome: string;
  tipo: 'texto' | 'numero' | 'data' | 'booleano' | 'lista';
  categoria: string;
  descricao: string;
}

interface FiltroAvancado {
  campo: string;
  operador: string;
  valor: any;
  tipo: string;
}

interface RelatorioPersonalizado {
  id?: number;
  nome: string;
  descricao: string;
  campos: string[];
  filtros: FiltroAvancado[];
  ordem_colunas?: { campo: string; posicao: number }[];
  agendamento?: {
    ativo: boolean;
    frequencia: string;
    destinatarios: string[];
  };
  categoria?: string;
  cor?: string;
  created_at?: string;
  updated_at?: string;
}

// Função para formatação de valores em reais brasileiros (abreviação para cards)
const formatarReal = (valor: number): string => {
  if (valor === 0) return 'R$ 0,00';
  const valorAbsoluto = Math.abs(valor);
  if (valorAbsoluto >= 1000000000000) { // Trilhões
    return `R$ ${(valor / 1000000000000).toFixed(1).replace('.', ',')}T`;
  } else if (valorAbsoluto >= 1000000000) { // Bilhões
    return `R$ ${(valor / 1000000000).toFixed(1).replace('.', ',')}B`;
  } else if (valorAbsoluto >= 1000000) { // Milhões
    return `R$ ${(valor / 1000000).toFixed(1).replace('.', ',')}M`;
  } else if (valorAbsoluto >= 1000) { // Milhares
    return `R$ ${(valor / 1000).toFixed(1).replace('.', ',')}K`;
  }
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para formatação de valores em reais brasileiros (sempre completo para tabela)
const formatarRealCompleto = (valor: any): string => {
  if (valor === null || valor === undefined || valor === '') return 'R$ 0,00';
  
  // Converter para número, tratando diferentes formatos
  let num: number;
  
  if (typeof valor === 'string') {
    // Se for string, primeiro verificar se é um número válido
    // PostgreSQL retorna valores como "3536.75" 
    num = parseFloat(valor);
  } else {
    num = Number(valor);
  }
  
  if (isNaN(num)) return 'R$ 0,00';
  
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função removida - agora usando formatServerDateBR do utils

// Função para formatação de números (não monetários)
const formatarNumero = (valor: number, key: string): string => {
  if (valor === 0) return '0';
  
  const valorAbsoluto = Math.abs(valor);
  
  // Valores de média e percentuais - sempre 2 casas decimais
  if (key.includes('media') || key.includes('percentual') || key.includes('_percentual')) {
    return valor.toFixed(2).replace('.', ',');
  }
  
  // Valores inteiros
  if (Number.isInteger(valor)) {
    return valor.toLocaleString('pt-BR');
  }
  
  // Outros números com 2 casas decimais
  return valor.toFixed(2).replace('.', ',');
};

// Theme para o modal
const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Função utilitária para parse seguro de datas YYYY-MM-DD
function parseDateBr(dateStr: string) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return null;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [tabAtiva, setTabAtiva] = useState(0);
  const [templates, setTemplates] = useState<RelatorioTemplate[]>([]);
  const [camposDisponiveis, setCamposDisponiveis] = useState<CampoDisponivel[]>([]);
  const [relatorioPersonalizado, setRelatorioPersonalizado] = useState<RelatorioPersonalizado>({
    nome: '',
    descricao: '',
    campos: [],
    filtros: []
  });
  const [filtrosAvancados, setFiltrosAvancados] = useState<FiltroAvancado[]>([]);
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState<string>('tabela');
  const [dadosRelatorio, setDadosRelatorio] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dialogConstrutor, setDialogConstrutor] = useState(false);
  const [dialogPreview, setDialogPreview] = useState(false);
  const [menuExportar, setMenuExportar] = useState<null | HTMLElement>(null);
  const [relatoriosSalvos, setRelatoriosSalvos] = useState<RelatorioPersonalizado[]>([]);
  const [modoVisualizacao, setModoVisualizacao] = useState<'grid' | 'lista' | 'barra' | 'linha' | 'pizza'>('grid');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [camposOrdenados, setCamposOrdenados] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ordemColunas, setOrdemColunas] = useState<{campo: string, posicao: number}[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [dialogPeriodoGeral, setDialogPeriodoGeral] = useState({ open: false, dataInicio: '', dataFim: '' });

  // Estados da aba Adesões ARP
  const [adesoes, setAdesoes] = useState<any[]>([]);
  const [loadingAdesoes, setLoadingAdesoes] = useState(false);
  const [filtrosAdesao, setFiltrosAdesao] = useState<{
    situacao_id: number | '';
    ug_id: number | '';
    data_inicio: string;
    data_fim: string;
  }>({
    situacao_id: '',
    ug_id: '',
    data_inicio: '',
    data_fim: ''
  });
  const [estatisticasAdesao, setEstatisticasAdesao] = useState<{ total: number; valor_total: number }>({
    total: 0,
    valor_total: 0
  });
  const [unidadesGestorasList, setUnidadesGestorasList] = useState<any[]>([]);
  const [situacoesList, setSituacoesList] = useState<any[]>([]);
  
  // Estados para opções de filtros
  const [opcoesFiltros, setOpcoesFiltros] = useState<{
    modalidades: Array<{id: number, sigla_modalidade: string, nome_modalidade: string}>;
    situacoes: Array<{id: number, nome_situacao: string}>;
    unidades_gestoras: Array<{id: number, sigla: string, nome_completo_unidade: string}>;
    responsaveis: Array<{id: number, primeiro_nome: string, nome_responsavel: string}>;
  }>({
    modalidades: [],
    situacoes: [],
    unidades_gestoras: [],
    responsaveis: []
  });
  const [loadingFiltros, setLoadingFiltros] = useState(false);

  // Campos relevantes disponíveis dos processos
  const camposProcessos: CampoDisponivel[] = [
    // Identificação
    { id: 'nup', nome: 'NUP', tipo: 'texto', categoria: 'Identificação', descricao: 'Número Único de Protocolo' },
    { id: 'numero_ano', nome: 'Número/Ano', tipo: 'texto', categoria: 'Identificação', descricao: 'Número sequencial e ano' },
    
    // Processo
    { id: 'objeto', nome: 'Objeto', tipo: 'texto', categoria: 'Processo', descricao: 'Descrição do objeto do processo' },
    { id: 'modalidade_sigla', nome: 'Modalidade', tipo: 'lista', categoria: 'Processo', descricao: 'Modalidade de licitação' },
    { id: 'nome_situacao', nome: 'Situação', tipo: 'lista', categoria: 'Status', descricao: 'Situação atual do processo' },
    { id: 'unidade_gestora_sigla', nome: 'Unidade Gestora', tipo: 'lista', categoria: 'Organizacional', descricao: 'Unidade gestora responsável' },
    { id: 'responsavel_primeiro_nome', nome: 'Responsável', tipo: 'lista', categoria: 'Organizacional', descricao: 'Responsável pelo processo' },
    { id: 'rp', nome: 'RP', tipo: 'booleano', categoria: 'Status', descricao: 'Registro de Preço' },
    { id: 'conclusao', nome: 'Conclusão', tipo: 'booleano', categoria: 'Status', descricao: 'Processo concluído' },
    
    // Financeiro
    { id: 'valor_estimado', nome: 'Valor Estimado', tipo: 'numero', categoria: 'Financeiro', descricao: 'Valor estimado do processo' },
    { id: 'valor_realizado', nome: 'Valor Realizado', tipo: 'numero', categoria: 'Financeiro', descricao: 'Valor contratado/realizado' },
    { id: 'desagio', nome: 'Deságio', tipo: 'numero', categoria: 'Financeiro', descricao: 'Valor de deságio (economia)' },
    { id: 'percentual_reducao', nome: 'Percentual Redução', tipo: 'numero', categoria: 'Financeiro', descricao: 'Percentual de redução do valor' },
    
    // Temporal
    { id: 'data_entrada', nome: 'Data de Entrada', tipo: 'data', categoria: 'Temporal', descricao: 'Data de entrada do processo' },
    { id: 'data_situacao', nome: 'Data da Situação', tipo: 'data', categoria: 'Temporal', descricao: 'Data da situação atual' },
    { id: 'data_sessao', nome: 'Data da Sessão', tipo: 'data', categoria: 'Temporal', descricao: 'Data da sessão de licitação' },
    { id: 'data_pncp', nome: 'Data PNCP', tipo: 'data', categoria: 'Temporal', descricao: 'Data de publicação no PNCP' },
    { id: 'data_tce_1', nome: 'Data TCE 1', tipo: 'data', categoria: 'Temporal', descricao: 'Data do primeiro envio ao TCE' },
    { id: 'data_tce_2', nome: 'Data TCE 2', tipo: 'data', categoria: 'Temporal', descricao: 'Data do segundo envio ao TCE' },
    
    // Observações
    { id: 'observacoes', nome: 'Observações', tipo: 'texto', categoria: 'Complementar', descricao: 'Observações do processo' },

    // Campos exclusivos de Adesões ARP
    { id: 'valor', nome: 'Valor (R$)', tipo: 'numero', categoria: 'Financeiro', descricao: 'Valor da adesão' },
    { id: 'fornecedor', nome: 'Fornecedor', tipo: 'texto', categoria: 'Adesão', descricao: 'Fornecedor da adesão' }
  ];

  // Templates pré-definidos com dados únicos
  const templatesIniciais: RelatorioTemplate[] = [
    {
      id: 'processos-geral',
      nome: 'Relatório Geral de Processos',
      descricao: 'Visão completa de todos os processos com todos os campos disponíveis',
      categoria: 'Operacional',
      tipo: 'misto',
      campos: [
        'nup', 'objeto', 'unidade_gestora_sigla', 'data_entrada', 'responsavel_primeiro_nome', 
        'modalidade_sigla', 'numero_ano', 'rp', 'data_sessao', 'data_pncp', 'data_tce_1', 'data_tce_2', 
        'valor_estimado', 'valor_realizado', 'desagio', 'percentual_reducao', 'nome_situacao', 
        'data_situacao', 'conclusao'
      ],
      filtros: ['data', 'modalidade', 'situacao', 'valor', 'unidade_gestora', 'responsavel'],
      visualizacoes: ['tabela', 'barra', 'linha'],
      cor: '#1976d2',
      popular: false,
      novo: true,
      em_desenvolvimento: false,
      dadosUnicos: { tipo_relatorio: 'geral' }
    },
    {
      id: 'economicidade',
      nome: 'Análise de Economicidade',
      descricao: 'Comparação entre valores estimados e contratados',
      categoria: 'Financeiro',
      tipo: 'grafico',
      campos: ['valor_estimado', 'valor_realizado', 'desagio', 'percentual_reducao', 'modalidade_sigla'],
      filtros: ['data', 'modalidade', 'valor'],
      visualizacoes: ['barra', 'pizza', 'gauge'],
      cor: '#388e3c',
      popular: false,
      novo: false,
      em_desenvolvimento: true,
      dadosUnicos: { tipo_relatorio: 'economicidade' }
    },
    {
      id: 'timeline-processos',
      nome: 'Timeline de Processos',
      descricao: 'Acompanhamento temporal dos processos',
      categoria: 'Temporal',
      tipo: 'grafico',
      campos: ['data_entrada', 'data_sessao', 'data_pncp', 'data_tce_1'],
      filtros: ['data', 'modalidade', 'situacao'],
      visualizacoes: ['linha', 'area', 'heatmap'],
      cor: '#f57c00',
      popular: false,
      novo: false,
      em_desenvolvimento: true,
      dadosUnicos: { tipo_relatorio: 'timeline' }
    },
    {
      id: 'dashboard-gestores',
      nome: 'Dashboard Executivo',
      descricao: 'KPIs e métricas principais para gestores',
      categoria: 'Estratégico',
      tipo: 'dashboard',
      campos: ['valor_estimado', 'valor_realizado', 'nome_situacao', 'modalidade_sigla'],
      filtros: ['data', 'unidade_gestora'],
      visualizacoes: ['gauge', 'barra', 'pizza'],
      cor: '#7b1fa2',
      popular: false,
      novo: false,
      em_desenvolvimento: true,
      dadosUnicos: { tipo_relatorio: 'dashboard' }
    },
    {
      id: 'analise-modalidades',
      nome: 'Análise por Modalidades',
      descricao: 'Distribuição e performance por modalidade de licitação',
      categoria: 'Analítico',
      tipo: 'grafico',
      campos: ['modalidade_sigla', 'valor_estimado', 'valor_realizado'],
      filtros: ['modalidade', 'data', 'valor'],
      visualizacoes: ['pizza', 'barra', 'scatter'],
      cor: '#d32f2f',
      popular: false,
      novo: false,
      em_desenvolvimento: true,
      dadosUnicos: { tipo_relatorio: 'modalidades' }
    },
    {
      id: 'analise-situacoes',
      nome: 'Análise por Situações',
      descricao: 'Distribuição e tempo médio por situação dos processos',
      categoria: 'Analítico',
      tipo: 'grafico',
      campos: ['nome_situacao', 'tempo_medio_dias', 'total_processos', 'processos_criticos', 'processos_atencao'],
      filtros: ['data', 'modalidade', 'unidade_gestora'],
      visualizacoes: ['barra', 'pizza', 'linha'],
      cor: '#673ab7',
      popular: false,
      novo: false,
      em_desenvolvimento: true,
      dadosUnicos: { tipo_relatorio: 'situacoes' }
    },
    {
      id: 'processos-rp-conclusao',
      nome: 'Processos com RP e Conclusão',
      descricao: 'Todos os processos que possuem Registro de Preço (RP=true) E estão concluídos (conclusao=true)',
      categoria: 'Licitação',
      tipo: 'misto',
      campos: [
        'nup', 'objeto', 'unidade_gestora_sigla', 'modalidade_sigla', 
        'numero_ano', 'valor_realizado', 'data_situacao',
        'responsavel_primeiro_nome'
      ],
      filtros: ['modalidade', 'data', 'unidade_gestora', 'responsavel'],
      visualizacoes: ['tabela', 'barra', 'pizza'],
      cor: '#ffa000',
      popular: true,
      novo: true,
      em_desenvolvimento: false,
      dadosUnicos: { 
        tipo_relatorio: 'rp_conclusao',
        filtros_fixos: {
          rp: true,
          conclusao: true
        }
      }
    }
  ];

  useEffect(() => {
    carregarDados();
    carregarOpcoesFiltros();
    // Carregar dados de apoio para a aba Adesões
    Promise.all([
      unidadesGestorasService.list({ ativo: true, limit: 100 }),
      situacoesService.list({ ativo: true, limit: 100 })
    ]).then(([ugs, sits]) => {
      setUnidadesGestorasList(Array.isArray(ugs) ? ugs : []);
      setSituacoesList(Array.isArray(sits) ? sits : (sits?.data || []));
    }).catch(console.error);
  }, []);


  // Carregar relatórios personalizados do backend sempre que o usuário mudar
  useEffect(() => {
    if (!user) {
      setRelatoriosSalvos([]);
      return;
    }
    const fetchRelatoriosPersonalizados = async () => {
      try {
        setLoading(true);
        const data = await relatoriosService.listPersonalizados();
        setRelatoriosSalvos(data);
      } catch (error) {
        setSnackbar({ open: true, message: 'Erro ao carregar relatórios personalizados', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchRelatoriosPersonalizados();
  }, [user]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setCamposDisponiveis(camposProcessos);
      
      // Usar apenas templates iniciais para a aba Templates
      setTemplates(templatesIniciais);
      
      // console.log('Templates carregados:', templatesIniciais.length, 'Relatórios salvos:', relatoriosSalvos.length);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setTemplates(templatesIniciais);
    } finally {
      setLoading(false);
    }
  };

  const carregarOpcoesFiltros = async () => {
    try {
      setLoadingFiltros(true);
      const opcoes = await relatoriosService.getOpcoes();
      setOpcoesFiltros(opcoes);
              // console.log('✅ Opções de filtros carregadas:', opcoes);
    } catch (error) {
      console.error('❌ Erro ao carregar opções de filtros:', error);
      // Usar dados simulados em caso de erro
      setOpcoesFiltros({
        modalidades: [
          { id: 1, sigla_modalidade: 'PE', nome_modalidade: 'Pregão Eletrônico' },
          { id: 2, sigla_modalidade: 'PP', nome_modalidade: 'Pregão Presencial' },
          { id: 3, sigla_modalidade: 'CP', nome_modalidade: 'Concorrência Pública' }
        ],
        situacoes: [
          { id: 1, nome_situacao: 'Em Andamento' },
          { id: 2, nome_situacao: 'Concluído' },
          { id: 3, nome_situacao: 'Suspenso' }
        ],
        unidades_gestoras: [
          { id: 1, sigla: 'UG1', nome_completo_unidade: 'Unidade Gestora 1' },
          { id: 2, sigla: 'UG2', nome_completo_unidade: 'Unidade Gestora 2' }
        ],
        responsaveis: [
          { id: 1, primeiro_nome: 'João', nome_responsavel: 'João Silva' },
          { id: 2, primeiro_nome: 'Maria', nome_responsavel: 'Maria Santos' }
        ]
      });
    } finally {
      setLoadingFiltros(false);
    }
  };

  const gerarRelatorio = async (templateId: string, periodoManual?: { dataInicio: string, dataFim: string }) => {
    if (templateId === 'processos-geral' && !periodoManual) {
      const hoje = new Date();
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(hoje.getDate() - 30);
      setDialogPeriodoGeral({ 
        open: true, 
        dataInicio: trintaDiasAtras.toISOString().split('T')[0], 
        dataFim: hoje.toISOString().split('T')[0] 
      });
      return;
    }

    try {
      setLoading(true);
      
      let dados;
      
      switch (templateId) {
        case 'processos-geral':
          dados = await buscarDadosGerais(periodoManual);
          break;
        case 'economicidade':
          dados = await buscarDadosEconomicidade();
          break;
        case 'timeline-processos':
          dados = await buscarDadosTimeline();
          break;
        case 'dashboard-gestores':
          dados = await buscarDadosDashboard();
          break;
        case 'analise-modalidades':
          dados = await buscarDadosModalidades();
          break;
        case 'analise-situacoes':
          dados = await buscarDadosSituacoes();
          break;
        case 'processos-rp-conclusao':
          dados = await buscarDadosRPConclusao();
          break;
        default:
          // Verificar se é um relatório personalizado salvo
          const relatorioPersonalizado = relatoriosSalvos.find(r => r.id?.toString() === templateId);
          if (relatorioPersonalizado) {
            // Gerar relatório personalizado
            dados = await buscarDadosPersonalizados(relatorioPersonalizado);
          } else {
            // Verificar se é um template pré-definido
            const template = templates.find(t => t.id === templateId);
            if (template) {
              // Converter template para formato personalizado
              const relatorioPersonalizado: RelatorioPersonalizado = {
                nome: template.nome,
                descricao: template.descricao,
                campos: template.campos,
                filtros: [] // Converter filtros se necessário
              };
              dados = await buscarDadosPersonalizados(relatorioPersonalizado);
            } else {
              throw new Error('Template não encontrado');
            }
          }
      }
      
      setDadosRelatorio(dados);
      setVisualizacaoAtiva('tabela');
      setDialogPreview(true); // Abrir o dialog de preview
      
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao gerar relatório',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Funções para buscar dados reais da API
  const buscarDadosGerais = async (periodoManual?: { dataInicio: string, dataFim: string }) => {
    try {
      const response = await api.get('/reports/processos', {
        params: {
          data_inicio: periodoManual?.dataInicio || filtrosAvancados.find(f => f.campo === 'data_inicio')?.valor,
          data_fim: periodoManual?.dataFim || filtrosAvancados.find(f => f.campo === 'data_fim')?.valor,
          modalidade_id: filtrosAvancados.find(f => f.campo === 'modalidade_id')?.valor,
          situacao_id: filtrosAvancados.find(f => f.campo === 'situacao_id')?.valor,
          unidade_gestora_id: filtrosAvancados.find(f => f.campo === 'unidade_gestora_id')?.valor,
          responsavel_id: filtrosAvancados.find(f => f.campo === 'responsavel_id')?.valor
        }
      });
      
      const processos = response.data.processos || [];
      
      // Ordenar por data da sessão (mais antiga para a mais nova)
      processos.sort((a: any, b: any) => {
        // Tratar casos onde a data da sessão pode ser nula ou vazia
        // Itens sem data ficam por último
        if (!a.data_sessao && !b.data_sessao) return 0;
        if (!a.data_sessao) return 1;
        if (!b.data_sessao) return -1;
        
        const dataA = new Date(a.data_sessao).getTime();
        const dataB = new Date(b.data_sessao).getTime();
        return dataA - dataB;
      });
      
      return {
        template: templates.find(t => t.id === 'processos-geral'),
        dados: processos,
        estatisticas: response.data.estatisticas || {},
        user_info: response.data.user_info || {}
      };
    } catch (error) {
      console.error('❌ Erro ao buscar dados gerais:', error);
      throw error;
    }
  };

  const buscarDadosEconomicidade = async () => {
    try {
      return await relatoriosService.gerarEconomicidade();
    } catch (error) {
      console.error('Erro ao buscar dados de economicidade:', error);
      throw error;
    }
  };

  const buscarDadosTimeline = async () => {
    try {
      return await relatoriosService.gerarProcessos();
    } catch (error) {
      console.error('Erro ao buscar dados de timeline:', error);
      throw error;
    }
  };

  const buscarDadosDashboard = async () => {
    try {
      const [metricas, heatmap] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/heatmap')
      ]);
      return {
        estatisticas: metricas.data,
        processos: heatmap.data
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  };

  const buscarDadosModalidades = async () => {
    try {
      const response = await api.get('/dashboard/modalidades');
      return {
        estatisticas: { total_modalidades: response.data.length },
        processos: response.data
      };
    } catch (error) {
      console.error('Erro ao buscar dados de modalidades:', error);
      throw error;
    }
  };

  const buscarDadosSituacoes = async () => {
    try {
      const response = await api.get('/dashboard/heatmap');
      return {
        estatisticas: {
          total_situacoes: response.data.length,
          processos_criticos: response.data.reduce((sum: number, item: any) => sum + item.processos_criticos, 0),
          tempo_medio_geral: response.data.reduce((sum: number, item: any) => sum + item.tempo_medio_dias, 0) / response.data.length
        },
        processos: response.data
      };
    } catch (error) {
      console.error('Erro ao buscar dados de situações:', error);
      throw error;
    }
  };

  const buscarDadosRPConclusao = async () => {
    try {
      console.log('🔍 Buscando dados de processos com RP e Conclusão...');
      
      const response = await api.get('/reports/processos', {
        params: {
          rp: true,
          conclusao: true,
          limit: 10000,
          sort: 'data_situacao',
          order: 'asc',
          data_inicio: filtrosAvancados.find(f => f.campo === 'data_inicio')?.valor,
          data_fim: filtrosAvancados.find(f => f.campo === 'data_fim')?.valor,
          modalidade_id: filtrosAvancados.find(f => f.campo === 'modalidade_id')?.valor,
          unidade_gestora_id: filtrosAvancados.find(f => f.campo === 'unidade_gestora_id')?.valor,
          responsavel_id: filtrosAvancados.find(f => f.campo === 'responsavel_id')?.valor
        }
      });
      
      console.log('✅ Dados recebidos:', response.data);
      
      // Filtrar apenas processos com rp=true E conclusao=true
      const todoProcessos = response.data.processos || [];
      const processosFiltrados = todoProcessos.filter((p: any) => p.rp === true && p.conclusao === true);
      
      // Ordenar manualmente por data_situacao (mais antiga para mais recente)
      processosFiltrados.sort((a: any, b: any) => {
        const dataA = a.data_situacao ? new Date(a.data_situacao).getTime() : 0;
        const dataB = b.data_situacao ? new Date(b.data_situacao).getTime() : 0;
        return dataA - dataB; // Ordem crescente (mais antiga primeiro)
      });
      
      console.log(`📊 Total de processos retornados: ${todoProcessos.length}`);
      console.log(`✅ Processos com RP=true E Conclusão=true: ${processosFiltrados.length}`);
      
      const valorTotal = processosFiltrados.reduce((sum: number, p: any) => {
        const valor = parseFloat(p.valor_realizado);
        return sum + (isNaN(valor) ? 0 : valor);
      }, 0);
      
      return {
        template: templates.find(t => t.id === 'processos-rp-conclusao'),
        dados: processosFiltrados,
        estatisticas: {
          total_processos: processosFiltrados.length,
          valor_total_realizado: valorTotal
        },
        user_info: response.data.user_info || {}
      };
    } catch (error) {
      console.error('❌ Erro ao buscar dados de RP e Conclusão:', error);
      throw error;
    }
  };

  const buscarDadosPersonalizados = async (relatorio: RelatorioPersonalizado) => {
    try {
      // console.log('🔍 Buscando dados personalizados para:', relatorio.nome);
      // console.log('📋 Campos selecionados:', relatorio.campos);
      // console.log('🔧 Filtros aplicados:', relatorio.filtros);
      
      const params: any = {};
      
      // Aplicar filtros se existirem
      if (relatorio.filtros && relatorio.filtros.length > 0) {
        relatorio.filtros.forEach(filtro => {
          if (filtro.valor && filtro.valor !== 'all' && filtro.valor !== '') {
            params[filtro.campo] = filtro.valor;
          }
        });
      }
      
      // console.log('📤 Parâmetros para API:', params);
      const resultado = await relatoriosService.gerarProcessos(params);
      // console.log('📥 Resultado da API:', resultado);
      
      // Criar um template virtual para o relatório personalizado
      const templateVirtual: RelatorioTemplate = {
        id: relatorio.id?.toString() || 'personalizado',
        nome: relatorio.nome,
        descricao: relatorio.descricao,
        categoria: relatorio.categoria || 'Personalizado',
        tipo: 'misto',
        campos: relatorio.campos,
        filtros: [],
        visualizacoes: ['tabela', 'barra', 'linha'],
        cor: relatorio.cor || '#9c27b0',
        popular: false,
        novo: false,
        dadosUnicos: {
          tipo_relatorio: 'personalizado',
          ordem_colunas: relatorio.ordem_colunas || []
        }
      };
      
      return {
        template: templateVirtual,
        dados: resultado.processos || [],
        estatisticas: resultado.estatisticas || {},
        user_info: resultado.user_info || {}
      };
    } catch (error) {
      console.error('❌ Erro ao buscar dados personalizados:', error);
      throw error;
    }
  };

  const gerarRelatorioAdesao = async () => {
    setLoadingAdesoes(true);
    try {
      const params: any = {};
      if (filtrosAdesao.situacao_id) params.situacao_id = filtrosAdesao.situacao_id;
      if (filtrosAdesao.ug_id) params.ug_id = filtrosAdesao.ug_id;
      if (filtrosAdesao.data_inicio) params.data_inicio = filtrosAdesao.data_inicio;
      if (filtrosAdesao.data_fim) params.data_fim = filtrosAdesao.data_fim;
      const resultado = await relatoriosAdesaoService.gerarRelatorio(params);
      setAdesoes(resultado.adesoes || []);
      setEstatisticasAdesao(resultado.estatisticas || { total: 0, valor_total: 0 });

      // Alimentar os mesmos estados do modal existente para manter consistência
      const templateAdesao = {
        id: 'adesoes-arp',
        nome: 'Relatório Geral de Adesões ARP',
        descricao: 'Processos de Adesão a Ata de Registro de Preços',
        categoria: 'Adesões',
        tipo: 'misto' as const,
        campos: ['nup', 'objeto', 'unidade_gestora_sigla', 'data_entrada', 'valor', 'fornecedor', 'nome_situacao', 'data_situacao'],
        filtros: [],
        visualizacoes: ['tabela'],
        cor: '#1565c0',
        popular: false,
        novo: false,
        dadosUnicos: { tipo_relatorio: 'adesoes' }
      };

      setDadosRelatorio({
        template: templateAdesao,
        dados: resultado.adesoes || [],
        estatisticas: resultado.estatisticas || {},
        user_info: {}
      });
      setVisualizacaoAtiva('tabela');
      setDialogPreview(true);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao gerar relatório de adesões', severity: 'error' });
    } finally {
      setLoadingAdesoes(false);
    }
  };

  const exportarAdesaoCSV = () => {
    if (adesoes.length === 0) return;
    const formatDate = (d: string) => {
      if (!d) return '';
      const [y, m, day] = d.split('T')[0].split('-');
      return `${day}/${m}/${y}`;
    };
    const formatVal = (v: any) => {
      const num = parseFloat(v);
      return isNaN(num) ? '' : num.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    };
    const header = ['NUP', 'Objeto', 'U.G.', 'Data de Entrada', 'Valor (R$)', 'Fornecedor', 'Situação', 'Data da Situação', 'Observações'];
    const rows = adesoes.map(a => [
      a.nup, a.objeto, a.unidade_gestora_sigla,
      formatDate(a.data_entrada), formatVal(a.valor),
      a.fornecedor, a.nome_situacao,
      formatDate(a.data_situacao), a.observacoes || ''
    ]);
    const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_adesoes_arp_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const imprimirAdesao = () => {
    if (adesoes.length === 0) return;
    const formatDate = (d: string) => {
      if (!d) return '';
      const [y, m, day] = d.split('T')[0].split('-');
      return `${day}/${m}/${y}`;
    };
    const formatVal = (v: any) => {
      const num = parseFloat(v);
      return isNaN(num) ? '' : 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    };
    const rows = adesoes.map(a => `
      <tr>
        <td>${a.nup || ''}</td>
        <td>${a.objeto || ''}</td>
        <td>${a.unidade_gestora_sigla || ''}</td>
        <td>${formatDate(a.data_entrada)}</td>
        <td>${formatVal(a.valor)}</td>
        <td>${a.fornecedor || ''}</td>
        <td>${a.nome_situacao || ''}</td>
        <td>${formatDate(a.data_situacao)}</td>
      </tr>`).join('');
    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Relatório de Adesões ARP</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
        h2 { color: #1976d2; } 
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #1976d2; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
        td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; font-size: 10px; }
        tr:nth-child(even) td { background: #f5f5f5; }
        .stats { margin: 12px 0; display: flex; gap: 24px; }
        .stat { background: #e3f2fd; padding: 8px 16px; border-radius: 4px; }
      </style></head><body>
      <h2>Relatório de Adesões a Ata de Registro de Preços (ARP)</h2>
      <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      <div class="stats">
        <div class="stat"><strong>Total de Registros:</strong> ${estatisticasAdesao.total}</div>
        <div class="stat"><strong>Valor Total:</strong> ${formatVal(estatisticasAdesao.valor_total)}</div>
      </div>
      <table>
        <thead><tr><th>NUP</th><th>Objeto</th><th>U.G.</th><th>Data Entrada</th><th>Valor</th><th>Fornecedor</th><th>Situação</th><th>Data Situação</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 500);
    }
  };

  const renderizarAbaAdesoes = () => {
    const formatDate = (d: string) => {
      if (!d) return '-';
      const [y, m, day] = d.split('T')[0].split('-');
      return `${day}/${m}/${y}`;
    };
    const formatValor = (v: any) => {
      const num = parseFloat(v);
      if (isNaN(num)) return '-';
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
      <Box>
        {/* Cabeçalho */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>Relatório de Adesões ARP</Typography>
          <Typography variant="body2" color="text.secondary">
            Gere e exporte relatórios dos processos de Adesão a Ata de Registro de Preços
          </Typography>
        </Box>

        {/* Card de filtros */}
        <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Filtros</Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Situação</InputLabel>
                <Select
                  value={filtrosAdesao.situacao_id}
                  label="Situação"
                  onChange={(e) => setFiltrosAdesao(prev => ({ ...prev, situacao_id: e.target.value as number | '' }))}
                >
                  <MenuItem value=""><em>Todas</em></MenuItem>
                  {situacoesList.map((s: any) => (
                    <MenuItem key={s.id} value={s.id}>{s.nome_situacao}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Unidade Gestora</InputLabel>
                <Select
                  value={filtrosAdesao.ug_id}
                  label="Unidade Gestora"
                  onChange={(e) => setFiltrosAdesao(prev => ({ ...prev, ug_id: e.target.value as number | '' }))}
                >
                  <MenuItem value=""><em>Todas</em></MenuItem>
                  {unidadesGestorasList
                    .slice()
                    .sort((a: any, b: any) => (a.sigla || '').localeCompare(b.sigla || ''))
                    .map((ug: any) => (
                      <MenuItem key={ug.id} value={ug.id}>{ug.sigla}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth size="small" label="Data de Entrada (início)" type="date"
                value={filtrosAdesao.data_inicio}
                onChange={(e) => setFiltrosAdesao(prev => ({ ...prev, data_inicio: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth size="small" label="Data de Entrada (fim)" type="date"
                value={filtrosAdesao.data_fim}
                onChange={(e) => setFiltrosAdesao(prev => ({ ...prev, data_fim: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2} sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth variant="contained" onClick={gerarRelatorioAdesao}
                disabled={loadingAdesoes}
                startIcon={loadingAdesoes ? <CircularProgress size={16} /> : <Assessment />}
              >
                {loadingAdesoes ? 'Gerando...' : 'Gerar'}
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Prompt inicial */}
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Assessment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Nenhum relatório gerado ainda</Typography>
          <Typography variant="body2" color="text.secondary">
            Selecione os filtros desejados acima e clique em <strong>"Gerar"</strong> para visualizar os dados
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderizarTemplates = () => {
    const templatesFiltrados = templates.filter(template => 
      !template.em_desenvolvimento && (
        template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    return (
      <Box>
        {/* Barra de busca e filtros */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Buscar relatórios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setTabAtiva(2)}
          >
            Novo Relatório
          </Button>
        </Box>

        {/* Grid de templates */}
        <Grid container spacing={3}>
          {templatesFiltrados.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card  
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                  borderTop: 3,
                  borderTopColor: template.cor,
                }}
                onClick={() => gerarRelatorio(template.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assessment sx={{ color: template.cor }} />
                      <Typography variant="h6" component="h3">
                        {template.nome}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {template.popular && (
                        <Chip label="Popular" size="small" color="primary" />
                      )}
                      {template.em_desenvolvimento && (
                        <Chip label="Em Desenvolvimento" size="small" color="secondary" />
                      )}
                      {template.novo && (
                        <Chip label="Novo" size="small" color="primary" />
                      )}
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.descricao}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    <Chip label={template.categoria} size="small" variant="outlined" />
                    <Chip label={template.tipo} size="small" variant="outlined" />
                    {template.visualizacoes.slice(0, 2).map((viz) => (
                      <Chip key={viz} label={viz} size="small" variant="outlined" />
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {template.campos.length} campos
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ bgcolor: template.cor }}
                      onClick={(e) => {
                        e.stopPropagation();
                        gerarRelatorio(template.id);
                      }}
                    >
                      Gerar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };



  return (
    <PageContainer>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <PageHeader
            title="Relatórios"
            subtitle="Gere relatórios prontos ou personalizados com análises detalhadas dos processos"
          />

          <Tabs
            value={tabAtiva}
            onChange={(_, newValue) => setTabAtiva(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label="Templates" />
            <Tab label="Meus Relatórios" />
            <Tab label="Construtor" />
            {/* Aba visível somente para quem tem permissão 'adesoes' ou é admin */}
            {(user?.perfil === 'admin' || user?.paginas_permitidas?.includes('adesoes')) && (
              <Tab label="Adesões ARP" />
            )}
          </Tabs>

          {/* Conteúdo das tabs */}
          {tabAtiva === 0 && renderizarTemplates()}
          {/* A aba Adesões ARP só existe no índice 3 quando o usuário tem permissão */}
          {tabAtiva === 3 && (user?.perfil === 'admin' || user?.paginas_permitidas?.includes('adesoes')) && renderizarAbaAdesoes()}
          {tabAtiva === 1 && (
            <Box>
              
              {relatoriosSalvos.length > 0 ? (
                <Grid container spacing={3}>
                  {relatoriosSalvos.map((relatorio) => (
                    <Grid item xs={12} sm={6} md={4} key={relatorio.id}>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                          },
                          borderTop: 3,
                          borderTopColor: relatorio.cor || '#9c27b0',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Gerar relatório diretamente pelo ID
                          gerarRelatorio(relatorio.id?.toString() || '');
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Assessment sx={{ color: relatorio.cor || '#9c27b0' }} />
                              <Typography variant="h6" component="h3">
                                {relatorio.nome}
                              </Typography>
                            </Box>
                            <Box>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Carregar relatório para edição no construtor
                                  setEditandoId(relatorio.id!);
                                  setRelatorioPersonalizado({
                                    ...relatorio,
                                    filtros: relatorio.filtros || [],
                                  });
                                  setOrdemColunas(relatorio.ordem_colunas || []);
                                  setTabAtiva(2);
                                }}
                                sx={{ mr: 1 }}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  // Remover relatório do backend
                                  try {
                                    setLoading(true);
                                    await relatoriosService.deletePersonalizado(relatorio.id!);
                                    setRelatoriosSalvos(relatoriosSalvos.filter(r => r.id !== relatorio.id));
                                    setSnackbar({
                                      open: true,
                                      message: 'Relatório removido com sucesso!',
                                      severity: 'success'
                                    });
                                  } catch (error) {
                                    setSnackbar({
                                      open: true,
                                      message: 'Erro ao remover relatório',
                                      severity: 'error'
                                    });
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {relatorio.descricao}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                            <Chip label={relatorio.categoria || 'Personalizado'} size="small" variant="outlined" />
                            <Chip label={`${relatorio.campos.length} campos`} size="small" variant="outlined" />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Criado em {formatServerDateBR(relatorio.created_at)}
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              sx={{ bgcolor: relatorio.cor || '#9c27b0' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Gerar relatório diretamente pelo ID
                                gerarRelatorio(relatorio.id?.toString() || '');
                              }}
                            >
                              Gerar
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhum relatório salvo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crie um novo relatório usando o construtor
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setTabAtiva(2)}
                    sx={{ mt: 2 }}
                  >
                    Ir para Construtor
                  </Button>
                </Box>
              )}
            </Box>
          )}
          {tabAtiva === 2 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Construtor de Relatórios
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Crie relatórios personalizados selecionando campos e configurações específicas
              </Typography>
              
              <Card variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {editandoId ? 'Editar Relatório' : 'Criar Novo Relatório'}
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nome do Relatório"
                      value={relatorioPersonalizado.nome}
                      onChange={(e) => setRelatorioPersonalizado({
                        ...relatorioPersonalizado,
                        nome: e.target.value
                      })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Categoria"
                      value={relatorioPersonalizado.categoria || ''}
                      onChange={(e) => setRelatorioPersonalizado({
                        ...relatorioPersonalizado,
                        categoria: e.target.value
                      })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Descrição"
                      multiline
                      rows={3}
                      value={relatorioPersonalizado.descricao}
                      onChange={(e) => setRelatorioPersonalizado({
                        ...relatorioPersonalizado,
                        descricao: e.target.value
                      })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Campos Disponíveis</InputLabel>
                      <Select
                        multiple
                        value={relatorioPersonalizado.campos}
                        onChange={(e) => {
                          const novosCampos = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                          setRelatorioPersonalizado({
                            ...relatorioPersonalizado,
                            campos: novosCampos
                          });
                          
                          // Atualizar ordem das colunas
                          const novaOrdem = novosCampos.map((campo, index) => ({
                            campo,
                            posicao: index
                          }));
                          setOrdemColunas(novaOrdem);
                        }}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {/* Campos padrões + extras frontend */}
                        {[
                          ...camposDisponiveis,
                          { id: 'conclusao', nome: 'Conclusão', descricao: 'Conclusão do processo', categoria: 'Extra' }
                        ].map((campo) => (
                          <MenuItem key={campo.id} value={campo.id}>
                            <Checkbox checked={relatorioPersonalizado.campos.indexOf(campo.id) > -1} />
                            <ListItemText 
                              primary={campo.nome} 
                              secondary={campo.descricao}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setRelatorioPersonalizado({
                            ...relatorioPersonalizado,
                            campos: []
                          });
                          setOrdemColunas([]);
                        }}
                        disabled={relatorioPersonalizado.campos.length === 0}
                      >
                        Limpar Campos
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => {
                          // Fechar seletor (não há modal específico, mas podemos limpar)
                          setRelatorioPersonalizado({
                            ...relatorioPersonalizado,
                            campos: []
                          });
                          setOrdemColunas([]);
                        }}
                      >
                        Fechar
                      </Button>
                    </Box>
                  </Grid>
                  
                  {/* Ordenação de Colunas */}
                  {relatorioPersonalizado.campos.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Ordenação das Colunas
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Arraste para reordenar as colunas no relatório
                      </Typography>
                      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, minHeight: 200 }}>
                        {ordemColunas.length > 0 ? (
                          <Box>
                            {ordemColunas.map((item, index) => {
                              const campo = camposDisponiveis.find(c => c.id === item.campo) ||
                                (item.campo === 'conclusao' ? { nome: 'Conclusão', categoria: 'Extra' } :
                                 item.campo === 'observacoes' ? { nome: 'Observações', categoria: 'Extra' } : undefined);
                              return (
                                <Box
                                  key={item.campo}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 1,
                                    mb: 1,
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    bgcolor: 'background.paper',
                                    cursor: 'grab',
                                    '&:hover': {
                                      bgcolor: 'action.hover'
                                    }
                                  }}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', index.toString());
                                  }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                    const newOrdem = [...ordemColunas];
                                    const [draggedItem] = newOrdem.splice(draggedIndex, 1);
                                    newOrdem.splice(index, 0, draggedItem);
                                    // Atualizar posições
                                    const ordemAtualizada = newOrdem.map((item, pos) => ({
                                      ...item,
                                      posicao: pos
                                    }));
                                    setOrdemColunas(ordemAtualizada);
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                    <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                                      {index + 1}
                                    </Typography>
                                    <Box
                                      sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main'
                                      }}
                                    />
                                    <Typography variant="body2" fontWeight="medium">
                                      {campo?.nome || item.campo}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ({campo?.categoria})
                                    </Typography>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      const novaOrdem = ordemColunas.filter((_, i) => i !== index);
                                      const ordemAtualizada = novaOrdem.map((item, pos) => ({
                                        ...item,
                                        posicao: pos
                                      }));
                                      setOrdemColunas(ordemAtualizada);
                                      // Remover campo da lista de campos selecionados
                                      const novosCampos = relatorioPersonalizado.campos.filter(c => c !== item.campo);
                                      setRelatorioPersonalizado({
                                        ...relatorioPersonalizado,
                                        campos: novosCampos
                                      });
                                    }}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Box>
                              );
                            })}
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              Selecione campos acima para configurar a ordenação
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  )}
                </Grid>
                
                {/* Filtros Avançados */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Filtros Avançados
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Selecione filtros para refinar os dados do relatório (opcional)
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* Filtro por Modalidade */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Modalidade</InputLabel>
                        <Select
                          multiple
                          value={relatorioPersonalizado.filtros?.find(f => f.campo === 'modalidade_id')?.valor || []}
                          onChange={(e) => {
                            const novosFiltros = [...(relatorioPersonalizado.filtros || [])];
                            const filtroExistente = novosFiltros.find(f => f.campo === 'modalidade_id');
                            const valores = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                            
                            if (filtroExistente) {
                              filtroExistente.valor = valores;
                            } else {
                              novosFiltros.push({
                                campo: 'modalidade_id',
                                operador: 'IN',
                                valor: valores,
                                tipo: 'lista'
                              });
                            }
                            
                            setRelatorioPersonalizado({
                              ...relatorioPersonalizado,
                              filtros: novosFiltros
                            });
                          }}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value: any) => {
                                const modalidade = opcoesFiltros.modalidades.find(m => m.id === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={modalidade ? `${modalidade.sigla_modalidade}` : value} 
                                    size="small" 
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {opcoesFiltros.modalidades.map((modalidade) => (
                            <MenuItem key={modalidade.id} value={modalidade.id}>
                              <Checkbox checked={relatorioPersonalizado.filtros?.find(f => f.campo === 'modalidade_id')?.valor?.includes(modalidade.id) || false} />
                              <ListItemText 
                                primary={`${modalidade.sigla_modalidade} - ${modalidade.nome_modalidade}`}
                              />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Filtro por Situação */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Situação</InputLabel>
                        <Select
                          multiple
                          value={relatorioPersonalizado.filtros?.find(f => f.campo === 'situacao_id')?.valor || []}
                          onChange={(e) => {
                            const novosFiltros = [...(relatorioPersonalizado.filtros || [])];
                            const filtroExistente = novosFiltros.find(f => f.campo === 'situacao_id');
                            const valores = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                            
                            if (filtroExistente) {
                              filtroExistente.valor = valores;
                            } else {
                              novosFiltros.push({
                                campo: 'situacao_id',
                                operador: 'IN',
                                valor: valores,
                                tipo: 'lista'
                              });
                            }
                            
                            setRelatorioPersonalizado({
                              ...relatorioPersonalizado,
                              filtros: novosFiltros
                            });
                          }}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value: any) => {
                                const situacao = opcoesFiltros.situacoes.find(s => s.id === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={situacao ? situacao.nome_situacao : value} 
                                    size="small" 
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {opcoesFiltros.situacoes.map((situacao) => (
                            <MenuItem key={situacao.id} value={situacao.id}>
                              <Checkbox checked={relatorioPersonalizado.filtros?.find(f => f.campo === 'situacao_id')?.valor?.includes(situacao.id) || false} />
                              <ListItemText 
                                primary={situacao.nome_situacao}
                              />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Filtro por Unidade Gestora */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Unidade Gestora</InputLabel>
                        <Select
                          multiple
                          value={relatorioPersonalizado.filtros?.find(f => f.campo === 'unidade_gestora_id')?.valor || []}
                          onChange={(e) => {
                            const novosFiltros = [...(relatorioPersonalizado.filtros || [])];
                            const filtroExistente = novosFiltros.find(f => f.campo === 'unidade_gestora_id');
                            const valores = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                            
                            if (filtroExistente) {
                              filtroExistente.valor = valores;
                            } else {
                              novosFiltros.push({
                                campo: 'unidade_gestora_id',
                                operador: 'IN',
                                valor: valores,
                                tipo: 'lista'
                              });
                            }
                            
                            setRelatorioPersonalizado({
                              ...relatorioPersonalizado,
                              filtros: novosFiltros
                            });
                          }}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value: any) => {
                                const ug = opcoesFiltros.unidades_gestoras.find(u => u.id === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={ug ? ug.sigla : value} 
                                    size="small" 
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {opcoesFiltros.unidades_gestoras.map((ug) => (
                            <MenuItem key={ug.id} value={ug.id}>
                              <Checkbox checked={relatorioPersonalizado.filtros?.find(f => f.campo === 'unidade_gestora_id')?.valor?.includes(ug.id) || false} />
                              <ListItemText 
                                primary={`${ug.sigla} - ${ug.nome_completo_unidade}`}
                              />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Filtro por Responsável */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Responsável</InputLabel>
                        <Select
                          multiple
                          value={relatorioPersonalizado.filtros?.find(f => f.campo === 'responsavel_id')?.valor || []}
                          onChange={(e) => {
                            const novosFiltros = [...(relatorioPersonalizado.filtros || [])];
                            const filtroExistente = novosFiltros.find(f => f.campo === 'responsavel_id');
                            const valores = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                            
                            if (filtroExistente) {
                              filtroExistente.valor = valores;
                            } else {
                              novosFiltros.push({
                                campo: 'responsavel_id',
                                operador: 'IN',
                                valor: valores,
                                tipo: 'lista'
                              });
                            }
                            
                            setRelatorioPersonalizado({
                              ...relatorioPersonalizado,
                              filtros: novosFiltros
                            });
                          }}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value: any) => {
                                const responsavel = opcoesFiltros.responsaveis.find(r => r.id === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={responsavel ? responsavel.primeiro_nome : value} 
                                    size="small" 
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {opcoesFiltros.responsaveis.map((responsavel) => (
                            <MenuItem key={responsavel.id} value={responsavel.id}>
                              <Checkbox checked={relatorioPersonalizado.filtros?.find(f => f.campo === 'responsavel_id')?.valor?.includes(responsavel.id) || false} />
                              <ListItemText 
                                primary={responsavel.primeiro_nome}
                              />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Filtro por Data de Entrada */}
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Data de Entrada (Início)"
                        type="date"
                        value={relatorioPersonalizado.filtros?.find(f => f.campo === 'data_entrada_inicio')?.valor || ''}
                        onChange={(e) => {
                          const novosFiltros = [...(relatorioPersonalizado.filtros || [])];
                          const filtroExistente = novosFiltros.find(f => f.campo === 'data_entrada_inicio');
                          
                          if (filtroExistente) {
                            filtroExistente.valor = e.target.value;
                          } else {
                            novosFiltros.push({
                              campo: 'data_entrada_inicio',
                              operador: '>=',
                              valor: e.target.value,
                              tipo: 'data'
                            });
                          }
                          
                          setRelatorioPersonalizado({
                            ...relatorioPersonalizado,
                            filtros: novosFiltros
                          });
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    {/* Filtro por Data de Entrada */}
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Data de Entrada (Fim)"
                        type="date"
                        value={relatorioPersonalizado.filtros?.find(f => f.campo === 'data_entrada_fim')?.valor || ''}
                        onChange={(e) => {
                          const novosFiltros = [...(relatorioPersonalizado.filtros || [])];
                          const filtroExistente = novosFiltros.find(f => f.campo === 'data_entrada_fim');
                          
                          if (filtroExistente) {
                            filtroExistente.valor = e.target.value;
                          } else {
                            novosFiltros.push({
                              campo: 'data_entrada_fim',
                              operador: '<=',
                              valor: e.target.value,
                              tipo: 'data'
                            });
                          }
                          
                          setRelatorioPersonalizado({
                            ...relatorioPersonalizado,
                            filtros: novosFiltros
                          });
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    {/* Filtro por Data da Sessão */}
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Data da Sessão (Início)"
                        type="date"
                        value={relatorioPersonalizado.filtros?.find(f => f.campo === 'data_sessao_inicio')?.valor || ''}
                        onChange={(e) => {
                          const novosFiltros = [...(relatorioPersonalizado.filtros || [])];
                          const filtroExistente = novosFiltros.find(f => f.campo === 'data_sessao_inicio');
                          
                          if (filtroExistente) {
                            filtroExistente.valor = e.target.value;
                          } else {
                            novosFiltros.push({
                              campo: 'data_sessao_inicio',
                              operador: '>=',
                              valor: e.target.value,
                              tipo: 'data'
                            });
                          }
                          
                          setRelatorioPersonalizado({
                            ...relatorioPersonalizado,
                            filtros: novosFiltros
                          });
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    {/* Filtro por Data da Sessão */}
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Data da Sessão (Fim)"
                        type="date"
                        value={relatorioPersonalizado.filtros?.find(f => f.campo === 'data_sessao_fim')?.valor || ''}
                        onChange={(e) => {
                          const novosFiltros = [...(relatorioPersonalizado.filtros || [])];
                          const filtroExistente = novosFiltros.find(f => f.campo === 'data_sessao_fim');
                          
                          if (filtroExistente) {
                            filtroExistente.valor = e.target.value;
                          } else {
                            novosFiltros.push({
                              campo: 'data_sessao_fim',
                              operador: '<=',
                              valor: e.target.value,
                              tipo: 'data'
                            });
                          }
                          
                          setRelatorioPersonalizado({
                            ...relatorioPersonalizado,
                            filtros: novosFiltros
                          });
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                
                {/* Seletor de Cor do Relatório */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Cor do Relatório
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Escolha uma cor para personalizar seu relatório
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Cor do Relatório</InputLabel>
                    <Select
                      value={relatorioPersonalizado.cor || '#9c27b0'}
                      onChange={(e) => setRelatorioPersonalizado({
                        ...relatorioPersonalizado,
                        cor: e.target.value
                      })}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: selected,
                              border: '2px solid',
                              borderColor: 'divider'
                            }}
                          />
                          <Typography>{selected}</Typography>
                        </Box>
                      )}
                    >
                      <MenuItem value="#1976d2">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#1976d2' }} />
                          <Typography>Azul</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="#388e3c">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#388e3c' }} />
                          <Typography>Verde</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="#f57c00">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#f57c00' }} />
                          <Typography>Laranja</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="#7b1fa2">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#7b1fa2' }} />
                          <Typography>Roxo</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="#d32f2f">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#d32f2f' }} />
                          <Typography>Vermelho</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="#673ab7">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#673ab7' }} />
                          <Typography>Índigo</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="#009688">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#009688' }} />
                          <Typography>Teal</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="#795548">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#795548' }} />
                          <Typography>Marrom</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="#607d8b">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#607d8b' }} />
                          <Typography>Azul Cinza</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="#9c27b0">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#9c27b0' }} />
                          <Typography>Rosa</Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  
                  {/* Visualização da cor selecionada */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" color="text.secondary">
                      Visualização da cor selecionada:
                    </Typography>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        bgcolor: relatorioPersonalizado.cor || '#9c27b0',
                        border: '2px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Assessment sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Typography variant="body2" fontWeight="medium">
                      {relatorioPersonalizado.cor || '#9c27b0'}
                    </Typography>
                  </Box>
                </Grid>
              </Card>
              
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      let relatorioSalvo: RelatorioPersonalizado;
                      if (editandoId) {
                        // Atualizar relatório existente
                        relatorioSalvo = await relatoriosService.updatePersonalizado(editandoId, {
                          ...relatorioPersonalizado,
                          ordem_colunas: ordemColunas // padronizar para ordem_colunas
                        });
                        setRelatoriosSalvos(relatoriosSalvos.map(r => r.id === editandoId ? relatorioSalvo : r));
                        setSnackbar({
                          open: true,
                          message: 'Relatório atualizado com sucesso!',
                          severity: 'success'
                        });
                      } else {
                        // Criar novo relatório
                        relatorioSalvo = await relatoriosService.createPersonalizado({
                          ...relatorioPersonalizado,
                          ordem_colunas: ordemColunas // padronizar para ordem_colunas
                        });
                        setRelatoriosSalvos([...relatoriosSalvos, relatorioSalvo]);
                        setSnackbar({
                          open: true,
                          message: 'Relatório criado e gerado com sucesso!',
                          severity: 'success'
                        });
                      }
                      // Gerar o relatório automaticamente
                      const dados = await buscarDadosPersonalizados(relatorioSalvo);
                      setDadosRelatorio(dados);
                      setVisualizacaoAtiva('tabela');
                      setDialogPreview(true);
                      // Limpar formulário
                      setRelatorioPersonalizado({
                        nome: '',
                        descricao: '',
                        campos: [],
                        filtros: []
                      });
                      setOrdemColunas([]);
                      setEditandoId(null);
                      // Redirecionar para a aba "Meus Relatórios"
                      setTabAtiva(1);
                    } catch (error) {
                      setSnackbar({
                        open: true,
                        message: editandoId ? 'Erro ao atualizar relatório' : 'Erro ao criar relatório',
                        severity: 'error'
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={!relatorioPersonalizado.nome || relatorioPersonalizado.campos.length === 0 || loading}
                >
                  {loading ? (editandoId ? 'Salvando...' : 'Criando...') : (editandoId ? 'Salvar Alterações' : 'Criar Relatório')}
                </Button>
                {editandoId && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setRelatorioPersonalizado({ nome: '', descricao: '', campos: [], filtros: [] });
                      setOrdemColunas([]);
                      setEditandoId(null);
                    }}
                    sx={{ ml: 2 }}
                  >
                    Cancelar Edição
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => {
                    setRelatorioPersonalizado({
                      nome: '',
                      descricao: '',
                      campos: [],
                      filtros: []
                    });
                    setOrdemColunas([]);
                  }}
                >
                  Limpar
                </Button>
              </Box>
            
          </Box>
        )}

        {/* Snackbar de feedback */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Modal de Preview do Relatório */}
        <ThemeProvider theme={lightTheme}>
          <Dialog
            open={dialogPreview}
            onClose={() => setDialogPreview(false)}
            maxWidth="xl"
            fullWidth
            PaperProps={{
              sx: { height: '90vh' }
            }}
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">
                  {dadosRelatorio?.template?.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dadosRelatorio?.template?.descricao}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Print />}
                  onClick={() => {
                    // Criar uma nova janela apenas com o conteúdo do relatório
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const printContent = `
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Relatório - ${dadosRelatorio?.template?.nome || 'Relatório'}</title>
                            <style>
                              body { 
                                font-family: Arial, sans-serif; 
                                margin: 20px; 
                                font-size: 12px;
                              }
                              .header { 
                                text-align: center; 
                                margin-bottom: 20px; 
                                border-bottom: 2px solid #333; 
                                padding-bottom: 10px;
                              }
                              .title { 
                                font-size: 18px; 
                                font-weight: bold; 
                                margin-bottom: 5px;
                              }
                              .subtitle { 
                                font-size: 14px; 
                                color: #666;
                              }
                              .stats { 
                                margin-bottom: 20px; 
                                padding: 15px; 
                                background-color: #f5f5f5; 
                                border-radius: 5px;
                              }
                              .stats-grid { 
                                display: grid; 
                                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
                                gap: 10px;
                              }
                              .stat-item { 
                                text-align: center; 
                                padding: 10px; 
                                background: ${dadosRelatorio?.template?.cor ? `${dadosRelatorio.template.cor}10` : '#f5f5f510'}; 
                                border: 1px solid #ddd; 
                                border-radius: 3px;
                              }
                              .stat-label { 
                                font-size: 10px; 
                                color: #666; 
                                text-transform: uppercase; 
                                margin-bottom: 5px;
                              }
                              .stat-value { 
                                font-size: 14px; 
                                font-weight: bold;
                                color: ${dadosRelatorio?.template?.cor || '#1976d2'};
                              }
                              table { 
                                width: 100%; 
                                border-collapse: collapse; 
                                margin-top: 20px;
                              }
                              th, td { 
                                border: 1px solid #ddd; 
                                padding: 8px; 
                                text-align: left;
                              }
                              th { 
                                background-color: ${dadosRelatorio?.template?.cor || '#1976d2'}; 
                                color: white;
                                font-weight: bold;
                              }
                              .numeric { 
                                text-align: right;
                              }
                              .date { 
                                text-align: center;
                              }
                              .center { 
                                text-align: center;
                              }
                              @media print {
                                body { margin: 0; }
                                .no-print { display: none; }
                              }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <div class="title">${dadosRelatorio?.template?.nome || 'Relatório'}</div>
                              <div class="subtitle">${dadosRelatorio?.template?.descricao || ''}</div>
                              <div style="margin-top: 10px; font-size: 11px; color: #666;">
                                Gerado em: ${new Date().toLocaleString('pt-BR')}
                              </div>
                            </div>
                            
                            ${dadosRelatorio?.estatisticas && Object.keys(dadosRelatorio.estatisticas).length > 0 ? `
                              <div class="stats">
                                <h3 style="margin: 0 0 15px 0;">Estatísticas</h3>
                                <div class="stats-grid">
                                  ${Object.entries(dadosRelatorio.estatisticas).map(([key, value]) => {
                                    let formattedValue = String(value);
                                    if (typeof value === 'number') {
                                      if (key.includes('valor_estimado') || key.includes('valor_realizado') || key.includes('desagio') || key.includes('economia_total')) {
                                        // Formato: ponto para milhares, vírgula para decimais
                                        formattedValue = value.toLocaleString('pt-BR', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        });
                                      } else {
                                        formattedValue = value.toLocaleString('pt-BR');
                                      }
                                    }
                                    return `
                                      <div class="stat-item">
                                        <div class="stat-label">${key.replace(/_/g, ' ').toUpperCase()}</div>
                                        <div class="stat-value">${formattedValue}</div>
                                      </div>
                                    `;
                                  }).join('')}
                                </div>
                              </div>
                            ` : ''}
                            
                            ${dadosRelatorio?.dados && dadosRelatorio.dados.length > 0 ? `
                              <table>
                                <thead>
                                  <tr>
                                    ${(() => {
                                      let camposOrdenados: string[] = [];
                                      if (dadosRelatorio.template?.dadosUnicos?.ordemColunas && dadosRelatorio.template?.dadosUnicos?.ordemColunas.length > 0) {
                                        camposOrdenados = dadosRelatorio.template.dadosUnicos.ordemColunas
                                          .sort((a: any, b: any) => a.posicao - b.posicao)
                                          .map((item: any) => item.campo);
                                      } else if (dadosRelatorio.template?.campos && dadosRelatorio.template.campos.length > 0) {
                                        camposOrdenados = dadosRelatorio.template.campos;
                                      } else {
                                        camposOrdenados = Object.keys(dadosRelatorio.dados[0] || {});
                                      }
                                      return camposOrdenados
                                        .map((key: string) => {
                                          // Nome amigável para extras
                                          let campo = camposDisponiveis.find(c => c.id === key);
                                          let headerText = campo?.nome;
                                          if (!headerText) {
                                            if (key === 'conclusao') headerText = 'Conclusão';
                                            else if (key === 'observacoes') headerText = 'Observações';
                                            else headerText = key.replace(/_/g, ' ').toUpperCase();
                                          }
                                          return `<th>${headerText}</th>`;
                                        }).join('');
                                    })()}
                                  </tr>
                                </thead>
                                <tbody>
                                  ${dadosRelatorio.dados.map((row: any) => {
                                    let camposOrdenados: string[] = [];
                                    if (dadosRelatorio.template?.dadosUnicos?.ordemColunas && dadosRelatorio.template?.dadosUnicos?.ordemColunas.length > 0) {
                                      camposOrdenados = dadosRelatorio.template.dadosUnicos.ordemColunas
                                        .sort((a: any, b: any) => a.posicao - b.posicao)
                                        .map((item: any) => item.campo);
                                    } else if (dadosRelatorio.template?.campos && dadosRelatorio.template.campos.length > 0) {
                                      camposOrdenados = dadosRelatorio.template.campos;
                                    } else {
                                      camposOrdenados = Object.keys(dadosRelatorio.dados[0] || {});
                                    }
                                    return `
                                      <tr>
                                        ${camposOrdenados
                                          .map((key: string) => {
                                            const value = row[key];
                                            const campo = camposDisponiveis.find(c => c.id === key);
                                            const isNumeric = campo?.tipo === 'numero' || key.includes('valor') || key.includes('desagio') || key.includes('percentual');
                                            const isDate = key.includes('data');
                                            const isObject = key === 'objeto';
                                            
                                            // Definir classe CSS baseada no tipo
                                            let className = '';
                                            if (isNumeric) {
                                              className = 'numeric';
                                            } else if (isDate) {
                                              className = 'date';
                                            } else if (!isObject) {
                                              className = 'center';
                                            }
                                            
                                            let formattedValue = String(value || '-');
                                            
                                            // Formatação específica para campos extras
                                            if (key === 'nup') {
                                              formattedValue = row.nup && row.nup.length > 11 ? row.nup.slice(-11) : row.nup;
                                            } else if (key === 'conclusao') {
                                              if (typeof row.conclusao === 'boolean') {
                                                formattedValue = row.conclusao ? 'Sim' : '-';
                                              } else if (row.conclusao === 'true') {
                                                formattedValue = 'Sim';
                                              } else if (row.conclusao === 'false') {
                                                formattedValue = '-';
                                              } else {
                                                formattedValue = row.conclusao || '-';
                                              }
                                            } else if (key === 'observacoes') {
                                              formattedValue = row.observacoes || '-';
                                            } else if (key === 'data_tce_2') {
                                              formattedValue = value ? formatServerDateBR(value) : '-';
                                            } else if (key.includes('data') && value) {
                                              // Formatação de data diretamente
                                              formattedValue = formatServerDateBR(value);
                                            } else if (key.includes('percentual_reducao')) {
                                              // Formatação específica para percentual
                                              const valorNum = typeof value === 'string' ? parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(',', '.')) : Number(value);
                                              if (!isNaN(valorNum) && valorNum !== 0) {
                                                formattedValue = `${valorNum.toFixed(2).replace('.', ',')}%`;
                                              } else {
                                                formattedValue = '-';
                                              }
                                            } else if (
                                              (campo && campo.tipo === 'numero') ||
                                              (typeof value === 'number' && (key.includes('valor') || key.includes('desagio')))
                                            ) {
                                              // Formatação: ponto para milhares, vírgula para decimais
                                              const valorNum = typeof value === 'string' ? parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(',', '.')) : Number(value);
                                              if (!isNaN(valorNum)) {
                                                formattedValue = valorNum.toLocaleString('pt-BR', {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2
                                                });
                                              }
                                            } else if (typeof value === 'number') {
                                              // Outros números
                                              formattedValue = value.toLocaleString('pt-BR');
                                            } else if (typeof value === 'boolean') {
                                              formattedValue = value ? 'Sim' : '-';
                                            }
                                            
                                            return `<td class="${className}">${formattedValue}</td>`;
                                          }).join('')}
                                      </tr>
                                    `;
                                  }).join('')}
                                </tbody>
                              </table>
                            ` : '<p style="text-align: center; color: #666;">Nenhum dado encontrado</p>'}
                            
                            <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 11px; color: #666; font-style: italic;">
                              Impresso por: <strong>${user?.nome || 'Usuário'}</strong>
                            </div>
                          </body>
                        </html>
                      `;
                      
                      printWindow.document.write(printContent);
                      printWindow.document.close();
                      
                      // Aguardar o carregamento e imprimir
                      printWindow.onload = () => {
                        printWindow.print();
                        printWindow.close();
                      };
                    }
                  }}
                >
                  Imprimir
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setDialogPreview(false)}
                >
                  Fechar
                </Button>
                <Button
                  variant="contained"
                  onClick={(event) => setMenuExportar(event.currentTarget)}
                  startIcon={<GetApp />}
                  sx={{ 
                    mr: 1,
                    bgcolor: dadosRelatorio?.template?.cor || '#1976d2',
                    '&:hover': {
                      bgcolor: dadosRelatorio?.template?.cor || '#1976d2',
                      opacity: 0.9
                    }
                  }}
                >
                  Exportar
                </Button>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              {dadosRelatorio ? (
                <Box sx={{ p: 0 }}>
                  <Box 
                    sx={{ 
                      p: 3,
                      bgcolor: dadosRelatorio?.template?.cor ? `${dadosRelatorio.template.cor}05` : undefined,
                      borderBottom: `2px solid ${dadosRelatorio?.template?.cor || '#e0e0e0'}`
                    }}
                  >
                    <Typography variant="h6" component="h3" gutterBottom sx={{ color: dadosRelatorio?.template?.cor || '#1976d2' }}>
                      Visualização do Relatório
                    </Typography>
                    

                    
                    {/* Estatísticas */}
                    {dadosRelatorio?.estatisticas && Object.keys(dadosRelatorio.estatisticas).length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" component="h4" gutterBottom>
                          Estatísticas
                        </Typography>
                        <Grid container spacing={2}>
                          {Object.entries(dadosRelatorio.estatisticas).map(([key, value]) => (
                            <Grid item xs={6} sm={4} md={3} key={key}>
                              <Card sx={{ textAlign: 'center', bgcolor: `${dadosRelatorio?.template?.cor || '#1976d2'}10` }}>
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Typography variant="caption" color="text.secondary" component="div">
                                    {key.replace(/_/g, ' ').toUpperCase()}
                                  </Typography>
                                  <Typography variant="h6" component="div" sx={{ color: dadosRelatorio?.template?.cor || '#1976d2' }}>
                                    {(() => {
                                      if (typeof value === 'number') {
                                        if (key.includes('valor_estimado') || key.includes('valor_realizado') || key.includes('desagio') || key.includes('economia_total')) {
                                          return formatarRealCompleto(value);
                                        } else {
                                          return value.toLocaleString('pt-BR');
                                        }
                                      }
                                      return String(value);
                                    })()}
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </Box>

                  {/* Dados */}
                  <Box sx={{ p: 0 }}>
                    {dadosRelatorio?.dados && dadosRelatorio.dados.length > 0 ? (
                      <TableContainer sx={{ maxHeight: 400 }}>
                        <Table stickyHeader>
                          <TableHead>
                            <TableRow>
                              {(() => {
                                // Lógica para determinar a ordem dos campos
                                let camposOrdenados: string[] = [];
                                if (dadosRelatorio.template?.dadosUnicos?.ordemColunas && dadosRelatorio.template?.dadosUnicos?.ordemColunas.length > 0) {
                                  camposOrdenados = dadosRelatorio.template.dadosUnicos.ordemColunas
                                    .sort((a: any, b: any) => a.posicao - b.posicao)
                                    .map((item: any) => item.campo);
                                } else if (dadosRelatorio.template?.campos && dadosRelatorio.template.campos.length > 0) {
                                  camposOrdenados = dadosRelatorio.template.campos;
                                } else {
                                  camposOrdenados = Object.keys(dadosRelatorio.dados[0] || {});
                                }
                                
                                // Usar informações do backend se disponível, senão usar localStorage
                                const userInfo = dadosRelatorio?.user_info;
                                const isResponsavel = userInfo?.is_responsavel || false;
                                
                                // Se for responsável, remover coluna responsável; se for admin ou usuario comum, manter
                                const colunasParaRemover: string[] = [];
                                if (isResponsavel) {
                                  colunasParaRemover.push('responsavel_primeiro_nome');
                                }
                                
                                const camposFiltrados = camposOrdenados.filter((key: string) => !colunasParaRemover.includes(key));
                                
                                return camposFiltrados.map((key: string, index: number) => {
                                  const campo = camposDisponiveis.find(c => c.id === key);
                                  let headerText = campo?.nome;
                                  
                                  // Nome amigável para campos extras
                                  if (!headerText) {
                                    if (key === 'conclusao') headerText = 'Conclusão';
                                    else if (key === 'observacoes') headerText = 'Observações';
                                    else headerText = key.replace(/_/g, ' ').toUpperCase();
                                  }
                                  
                                  return (
                                    <TableCell 
                                      key={index}
                                      sx={{
                                        bgcolor: dadosRelatorio?.template?.cor || '#1976d2',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        textAlign: campo && campo.tipo === 'numero' ? 'right' : 'left'
                                      }}
                                    >
                                      {headerText}
                                    </TableCell>
                                  );
                                });
                              })()}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dadosRelatorio.dados.map((row: any, index: number) => {
                              // Mesma lógica para o corpo
                              let camposOrdenados: string[] = [];
                              if (dadosRelatorio.template?.dadosUnicos?.ordemColunas && dadosRelatorio.template?.dadosUnicos?.ordemColunas.length > 0) {
                                camposOrdenados = dadosRelatorio.template.dadosUnicos.ordemColunas
                                  .sort((a: any, b: any) => a.posicao - b.posicao)
                                  .map((item: any) => item.campo);
                              } else if (dadosRelatorio.template?.campos && dadosRelatorio.template.campos.length > 0) {
                                camposOrdenados = dadosRelatorio.template.campos;
                              } else {
                                camposOrdenados = Object.keys(row);
                              }
                              
                              // Usar informações do backend se disponível, senão usar localStorage
                              const userInfo = dadosRelatorio?.user_info;
                              const isResponsavel = userInfo?.is_responsavel || false;
                              
                              // Se for responsável, remover coluna responsável; se for admin ou usuario comum, manter
                              const colunasParaRemover: string[] = [];
                              if (isResponsavel) {
                                colunasParaRemover.push('responsavel_primeiro_nome');
                              }
                              
                              const camposFiltrados = camposOrdenados.filter((key: string) => !colunasParaRemover.includes(key));
                              return (
                                <TableRow key={index} hover>
                                  {camposFiltrados.map((key: string, cellIndex: number) => {
                                    const value = row[key];
                                    const campo = camposDisponiveis.find(c => c.id === key);
                                    const isNumeric = campo?.tipo === 'numero' || key.includes('valor') || key.includes('desagio') || key.includes('percentual');
                                    return (
                                      <TableCell 
                                        key={cellIndex}
                                        sx={{
                                          textAlign: campo && campo.tipo === 'numero' ? 'right' : 'left'
                                        }}
                                      >
                                        {(() => {
                                          // Campos extras
                                          if (key === 'nup') {
                                            return abreviarNup(row.nup);
                                          }
                                          if (key === 'conclusao') {
                                            if (typeof row.conclusao === 'boolean') {
                                              return row.conclusao ? 'Sim' : '-';
                                            }
                                            if (row.conclusao === 'true') return 'Sim';
                                            if (row.conclusao === 'false') return '-';
                                            return row.conclusao || '-';
                                          }
                                          if (key === 'observacoes') {
                                            return row.observacoes || '-';
                                          }
                                          if (key === 'data_tce_2') {
                                            return value ? formatServerDateBR(value) : '-';
                                          }
                                          // Verificar se é percentual de redução
                                          if (key.includes('percentual_reducao')) {
                                            const valorNum = typeof value === 'string' ? parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(',', '.')) : Number(value);
                                            if (!isNaN(valorNum) && valorNum !== 0) {
                                              return `${valorNum.toFixed(2).replace('.', ',')}%`;
                                            } else {
                                              return '-';
                                            }
                                          }
                                          // Verificar se é uma data
                                          if (key.includes('data') && value) {
                                            return formatServerDateBR(value);
                                          }
                                          // Verificar se é campo numérico
                                          if (campo && campo.tipo === 'numero') {
                                            return formatarRealCompleto(value);
                                          }
                                          // Verificar se é um valor monetário
                                          if ((typeof value === 'number' || typeof value === 'string') && (key.includes('valor') || key.includes('desagio'))) {
                                            return formatarRealCompleto(value);
                                          }
                                          // Verificar se é um número
                                          if (typeof value === 'number') {
                                            // Para outros números, usar formatação padrão
                                            return formatarNumero(value, key);
                                          }
                                          // Verificar se é booleano
                                          if (typeof value === 'boolean') {
                                            return value ? 'Sim' : '-';
                                          }
                                          // Valor padrão
                                          return String(value || '-');
                                        })()}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Nenhum dado encontrado
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tente ajustar os filtros ou verificar se há dados disponíveis
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              )}
            
            {/* Rodapé: Impresso por */}
            <Box
              sx={{
                mt: 4,
                pt: 2,
                borderTop: '1px solid #e0e0e0',
                textAlign: 'left',
                '@media print': { position: 'fixed', bottom: 0, width: '100%' }
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Impresso por: <strong>{user?.nome || 'Usuário'}</strong>
              </Typography>
            </Box>
            </DialogContent>
          </Dialog>
        </ThemeProvider>

        {/* Dialog para Período do Relatório Geral */}
        <Dialog open={dialogPeriodoGeral.open} onClose={() => setDialogPeriodoGeral(prev => ({ ...prev, open: false }))}>
          <DialogTitle>Selecionar Período</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Escolha o período da Data de Entrada para gerar o relatório geral de processos.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data Inicial"
                  type="date"
                  value={dialogPeriodoGeral.dataInicio}
                  onChange={(e) => setDialogPeriodoGeral(prev => ({ ...prev, dataInicio: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data Final"
                  type="date"
                  value={dialogPeriodoGeral.dataFim}
                  onChange={(e) => setDialogPeriodoGeral(prev => ({ ...prev, dataFim: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogPeriodoGeral(prev => ({ ...prev, open: false }))}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={() => {
                setDialogPeriodoGeral(prev => ({ ...prev, open: false }));
                gerarRelatorio('processos-geral', { 
                  dataInicio: dialogPeriodoGeral.dataInicio, 
                  dataFim: dialogPeriodoGeral.dataFim 
                });
              }}
            >
              Gerar Relatório
            </Button>
          </DialogActions>
        </Dialog>

        {/* Menu de Exportação */}
        <Menu
          anchorEl={menuExportar}
          open={Boolean(menuExportar)}
          onClose={() => setMenuExportar(null)}
        >
          <MenuItem 
            onClick={() => {
              setMenuExportar(null);
              // Implementar exportação Excel
              // console.log('Exportar Excel');
            }}
            sx={{
              '&:hover': {
                bgcolor: dadosRelatorio?.template?.cor ? `${dadosRelatorio.template.cor}20` : undefined
              }
            }}
          >
            <ListItemIcon>
              <FileDownload sx={{ color: dadosRelatorio?.template?.cor || '#1976d2' }} />
            </ListItemIcon>
            <ListItemText>Exportar Excel</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => {
              setMenuExportar(null);
              // Implementar exportação PDF
              // console.log('Exportar PDF');
            }}
            sx={{
              '&:hover': {
                bgcolor: dadosRelatorio?.template?.cor ? `${dadosRelatorio.template.cor}20` : undefined
              }
            }}
          >
            <ListItemIcon>
              <PictureAsPdf sx={{ color: dadosRelatorio?.template?.cor || '#1976d2' }} />
            </ListItemIcon>
            <ListItemText>Exportar PDF</ListItemText>
          </MenuItem>
        </Menu>
      </>
    )}
  </PageContainer>
);
}
