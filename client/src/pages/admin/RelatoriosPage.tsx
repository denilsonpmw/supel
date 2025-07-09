import { useState, useEffect } from 'react';
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
  Add,
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
  KeyboardArrowDown
} from '@mui/icons-material';
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
import api, { relatoriosService } from '../../services/api';

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
  id?: string;
  nome: string;
  descricao: string;
  campos: string[];
  filtros: FiltroAvancado[];
  ordemColunas?: {campo: string, posicao: number}[];
  agendamento?: {
    ativo: boolean;
    frequencia: string;
    destinatarios: string[];
  };
  categoria?: string;
  cor?: string;
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

// Função para formatação de datas
const formatarData = (data: string | Date): string => {
  if (!data) return '-';
  
  try {
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    return dataObj.toLocaleDateString('pt-BR');
  } catch (error) {
    return String(data);
  }
};

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
    if (valorAbsoluto >= 1000000000000) { // Trilhões
      return `${(valor / 1000000000000).toFixed(1).replace('.', ',')}T`;
    } else if (valorAbsoluto >= 1000000000) { // Bilhões
      return `${(valor / 1000000000).toFixed(1).replace('.', ',')}B`;
    } else if (valorAbsoluto >= 1000000) { // Milhões
      return `${(valor / 1000000).toFixed(1).replace('.', ',')}M`;
    } else if (valorAbsoluto >= 1000) { // Milhares
      return `${(valor / 1000).toFixed(1).replace('.', ',')}K`;
    }
    // Para números inteiros menores que 1000, usar ponto para milhares
    return valor.toLocaleString('pt-BR');
  }
  
  // Valores decimais - 2 casas decimais com vírgula
  return valor.toFixed(2).replace('.', ',');
};

// Função utilitária para parse seguro de datas YYYY-MM-DD
function parseDateBr(dateStr: string) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return null;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export default function RelatoriosPage() {
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
  const [relatoriosSalvos, setRelatoriosSalvos] = useState<RelatorioPersonalizado[]>(() => {
    const saved = localStorage.getItem('relatorios_salvos');
    return saved ? JSON.parse(saved) : [];
  });
  const [modoVisualizacao, setModoVisualizacao] = useState<'grid' | 'lista' | 'barra' | 'linha' | 'pizza'>('grid');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [camposOrdenados, setCamposOrdenados] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ordemColunas, setOrdemColunas] = useState<{campo: string, posicao: number}[]>([]);
  
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
    { id: 'observacoes', nome: 'Observações', tipo: 'texto', categoria: 'Complementar', descricao: 'Observações do processo' }
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
        'modalidade_sigla', 'numero_ano', 'data_sessao', 'data_pncp', 'data_tce_1', 
        'valor_estimado', 'valor_realizado', 'desagio', 'percentual_reducao', 'nome_situacao', 
        'data_situacao', 'observacoes', 'data_tce_2', 'conclusao'
      ],
      filtros: ['data', 'modalidade', 'situacao', 'valor', 'unidade_gestora', 'responsavel'],
      visualizacoes: ['tabela', 'barra', 'linha'],
      cor: '#1976d2',
      popular: true,
      novo: false,
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
      popular: true,
      novo: false,
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
      novo: true,
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
      popular: true,
      novo: false,
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
      novo: true,
      dadosUnicos: { tipo_relatorio: 'situacoes' }
    }
  ];

  useEffect(() => {
    carregarDados();
    carregarOpcoesFiltros();
  }, []);

  // Salvar relatórios no localStorage quando forem modificados
  useEffect(() => {
    localStorage.setItem('relatorios_salvos', JSON.stringify(relatoriosSalvos));
  }, [relatoriosSalvos]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setCamposDisponiveis(camposProcessos);
      
      // Usar apenas templates iniciais para a aba Templates
      setTemplates(templatesIniciais);
      
      console.log('Templates carregados:', templatesIniciais.length, 'Relatórios salvos:', relatoriosSalvos.length);
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
      console.log('✅ Opções de filtros carregadas:', opcoes);
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

  const gerarRelatorio = async (templateId: string) => {
    try {
      setLoading(true);
      console.log('🔄 Gerando relatório com ID:', templateId);
      
      // Verificar se é um relatório personalizado da aba "Meus Relatórios"
      const relatorioPersonalizado = relatoriosSalvos.find(r => r.id === templateId);
      console.log('📋 Relatório personalizado encontrado:', relatorioPersonalizado);
      
      if (relatorioPersonalizado) {
        console.log('✅ Gerando relatório personalizado:', relatorioPersonalizado.nome);
        // Gerar relatório personalizado
        const dadosRelatorio = await buscarDadosPersonalizados(relatorioPersonalizado);
        console.log('📊 Dados do relatório personalizado:', dadosRelatorio);
        
        setDadosRelatorio({
          template: {
            id: relatorioPersonalizado.id,
            nome: relatorioPersonalizado.nome,
            descricao: relatorioPersonalizado.descricao,
            dadosUnicos: { 
              tipo_relatorio: 'personalizado', 
              relatorio_id: relatorioPersonalizado.id,
              ordemColunas: relatorioPersonalizado.ordemColunas || []
            }
          },
          dados: dadosRelatorio.processos || dadosRelatorio.dados || [],
          estatisticas: dadosRelatorio.estatisticas || {}
        });
        
        setDialogPreview(true);
        return;
      }
      
      console.log('🔍 Buscando template normal...');
      // Buscar template normal
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        console.log('❌ Template não encontrado');
        return;
      }

      let dadosRelatorio;

      // Buscar dados reais baseado no tipo de template
      switch (template.dadosUnicos?.tipo_relatorio) {
        case 'geral':
          dadosRelatorio = await buscarDadosGerais();
          break;
        case 'economicidade':
          dadosRelatorio = await buscarDadosEconomicidade();
          break;
        case 'timeline':
          dadosRelatorio = await buscarDadosTimeline();
          break;
        case 'dashboard':
          dadosRelatorio = await buscarDadosDashboard();
          break;
        case 'modalidades':
          dadosRelatorio = await buscarDadosModalidades();
          break;
        case 'situacoes':
          dadosRelatorio = await buscarDadosSituacoes();
          break;
        default:
          dadosRelatorio = await buscarDadosGerais();
      }

      setDadosRelatorio({
        template,
        dados: dadosRelatorio.processos || dadosRelatorio.dados || [],
        estatisticas: dadosRelatorio.estatisticas || {}
      });

      // Definir modo de visualização inicial baseado no template
      if (template.visualizacoes?.length > 0) {
        const primeiraVisualizacao = template.visualizacoes[0];
        if (['barra', 'linha', 'pizza', 'tabela'].includes(primeiraVisualizacao)) {
          setModoVisualizacao(primeiraVisualizacao as 'barra' | 'linha' | 'pizza' | 'lista');
        }
      }

      setDialogPreview(true);
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao gerar relatório. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Funções para buscar dados reais da API
  const buscarDadosGerais = async () => {
    try {
      return await relatoriosService.gerarProcessos();
    } catch (error) {
      console.error('Erro ao buscar dados gerais:', error);
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

  const buscarDadosPersonalizados = async (relatorio: RelatorioPersonalizado) => {
    try {
      console.log('🔍 Buscando dados personalizados para:', relatorio.nome);
      console.log('📋 Campos selecionados:', relatorio.campos);
      console.log('🔧 Filtros aplicados:', relatorio.filtros);
      
      const params: any = {};
      
      // Aplicar filtros se existirem
      if (relatorio.filtros && relatorio.filtros.length > 0) {
        relatorio.filtros.forEach(filtro => {
          if (filtro.valor && filtro.valor !== 'all' && filtro.valor !== '') {
            params[filtro.campo] = filtro.valor;
          }
        });
      }
      
      console.log('📤 Parâmetros para API:', params);
      const resultado = await relatoriosService.gerarProcessos(params);
      console.log('📥 Resultado da API:', resultado);
      
      return resultado;
    } catch (error) {
      console.error('❌ Erro ao buscar dados personalizados:', error);
      throw error;
    }
  };

  const renderizarTemplates = () => {
    const templatesFiltrados = templates.filter(template => 
      template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.categoria.toLowerCase().includes(searchTerm.toLowerCase())
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
                      {template.novo && (
                        <Chip label="Novo" size="small" color="secondary" />
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
    <Box sx={{ px: { xs: 1, sm: 2, md: 4 }, pb: 4, mt: 4 }}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Relatórios
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gere relatórios prontos ou personalizados com análises detalhadas dos processos
            </Typography>
          </Box>

          <Tabs
            value={tabAtiva}
            onChange={(_, newValue) => setTabAtiva(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label="Templates" />
            <Tab label="Meus Relatórios" />
            <Tab label="Construtor" />
          </Tabs>

          {/* Conteúdo das tabs */}
          {tabAtiva === 0 && renderizarTemplates()}
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
                          borderTopColor: '#9c27b0',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Gerar relatório diretamente pelo ID
                          gerarRelatorio(relatorio.id || '');
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Assessment sx={{ color: '#9c27b0' }} />
                              <Typography variant="h6" component="h3">
                                {relatorio.nome}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Remover relatório
                                const relatoriosAtualizados = relatoriosSalvos.filter(r => r.id !== relatorio.id);
                                setRelatoriosSalvos(relatoriosAtualizados);
                                
                                setSnackbar({
                                  open: true,
                                  message: 'Relatório removido com sucesso!',
                                  severity: 'success'
                                });
                              }}
                            >
                              <Delete />
                            </IconButton>
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
                              Criado em {new Date(parseInt(relatorio.id || '0')).toLocaleDateString('pt-BR')}
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              sx={{ bgcolor: '#9c27b0' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Gerar relatório diretamente pelo ID
                                gerarRelatorio(relatorio.id || '');
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
                  Criar Novo Relatório
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
                        {camposDisponiveis.map((campo) => (
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
                              const campo = camposDisponiveis.find(c => c.id === item.campo);
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
                {/* Remover SELETOR DE COR do relatório personalizado */}
                {/* (remover o bloco <FormControl> com <InputLabel>Cor do Relatório</InputLabel> e o <Select> relacionado) */}
                {/* Remover visualização da cor selecionada */}
                {/* (remover o <Box> que mostra a cor e o texto 'Visualização da cor selecionada') */}
              </Card>
              
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    // Salvar relatório personalizado
                    const novoRelatorio = {
                      ...relatorioPersonalizado,
                      id: Date.now().toString(),
                      ordemColunas: ordemColunas
                    };
                    
                    // Adicionar à lista de relatórios salvos
                    const relatoriosAtualizados = [...relatoriosSalvos, novoRelatorio];
                    setRelatoriosSalvos(relatoriosAtualizados);
                    
                    // Limpar formulário
                    setRelatorioPersonalizado({
                      nome: '',
                      descricao: '',
                      campos: [],
                      filtros: []
                    });
                    setOrdemColunas([]);
                    
                    setSnackbar({
                      open: true,
                      message: 'Relatório criado com sucesso!',
                      severity: 'success'
                    });
                  }}
                  disabled={!relatorioPersonalizado.nome || relatorioPersonalizado.campos.length === 0}
                >
                  Criar Relatório
                </Button>
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
                              background: white; 
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
                              background-color: #f5f5f5; 
                              font-weight: bold;
                            }
                            .numeric { 
                              text-align: right;
                            }
                            .date { 
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
                                    if (key.includes('valor_estimado') || key.includes('valor_realizado') || key.includes('desagio')) {
                                      // Usar formatação similar ao formatarReal com 3 casas decimais
                                      const valorAbsoluto = Math.abs(value);
                                      if (valorAbsoluto >= 1000000000000) { // Trilhões
                                        formattedValue = 'R$ ' + (value / 1000000000000).toFixed(1).replace('.', ',') + 'T';
                                      } else if (valorAbsoluto >= 1000000000) { // Bilhões
                                        formattedValue = 'R$ ' + (value / 1000000000).toFixed(1).replace('.', ',') + 'B';
                                      } else if (valorAbsoluto >= 1000000) { // Milhões
                                        formattedValue = 'R$ ' + (value / 1000000).toFixed(1).replace('.', ',') + 'M';
                                      } else if (valorAbsoluto >= 1000) { // Milhares
                                        formattedValue = 'R$ ' + (value / 1000).toFixed(1).replace('.', ',') + 'K';
                                      } else {
                                        formattedValue = new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        }).format(value);
                                      }
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
                                    return camposOrdenados.map((key: string) => {
                                      const campo = camposDisponiveis.find(c => c.id === key);
                                      const isNumeric = campo?.tipo === 'numero' || key.includes('valor') || key.includes('desagio') || key.includes('percentual');
                                      const isDate = key.includes('data');
                                      const className = isNumeric ? 'numeric' : isDate ? 'date' : '';
                                      return `<th class="${className}">${campo?.nome || key.replace(/_/g, ' ').toUpperCase()}</th>`;
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
                                    camposOrdenados = Object.keys(row);
                                  }
                                  return `
                                    <tr>
                                      ${camposOrdenados.map((key: string) => {
                                        const value = row[key];
                                        const campo = camposDisponiveis.find(c => c.id === key);
                                        const isNumeric = campo?.tipo === 'numero' || key.includes('valor') || key.includes('desagio') || key.includes('percentual');
                                        const isDate = key.includes('data');
                                        const className = isNumeric ? 'numeric' : isDate ? 'date' : '';
                                        
                                        let formattedValue = String(value || '-');
                                        if (key.includes('data') && value) {
                                          // Formatação de data diretamente
                                          const date = new Date(value);
                                          if (!isNaN(date.getTime())) {
                                            formattedValue = date.toLocaleDateString('pt-BR');
                                          }
                                        } else if (campo && campo.tipo === 'numero') {
                                          // Formatação monetária completa para campos numéricos
                                          const valorNum = typeof value === 'string' ? parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(',', '.')) : Number(value);
                                          if (!isNaN(valorNum)) {
                                            formattedValue = new Intl.NumberFormat('pt-BR', {
                                              style: 'currency',
                                              currency: 'BRL',
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            }).format(valorNum);
                                          }
                                        } else if (typeof value === 'number' && (key.includes('valor') || key.includes('desagio'))) {
                                          // Formatação monetária para campos de valor
                                          const valorNum = Number(value);
                                          if (!isNaN(valorNum)) {
                                            formattedValue = new Intl.NumberFormat('pt-BR', {
                                              style: 'currency',
                                              currency: 'BRL',
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            }).format(valorNum);
                                          }
                                        } else if (typeof value === 'number') {
                                          // Outros números
                                          formattedValue = value.toLocaleString('pt-BR');
                                        } else if (typeof value === 'boolean') {
                                          formattedValue = value ? 'Sim' : 'Não';
                                        }
                                        
                                        return `<td class="${className}">${formattedValue}</td>`;
                                      }).join('')}
                                    </tr>
                                  `;
                                }).join('')}
                              </tbody>
                            </table>
                          ` : '<p style="text-align: center; color: #666;">Nenhum dado encontrado</p>'}
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
                size="small"
                startIcon={<CloudDownload />}
                onClick={() => {
                  // TODO: Implementar exportação
                  setSnackbar({
                    open: true,
                    message: 'Exportação será implementada em breve',
                    severity: 'info'
                  });
                }}
              >
                Exportar
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {dadosRelatorio ? (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Estatísticas */}
                {dadosRelatorio.estatisticas && Object.keys(dadosRelatorio.estatisticas).length > 0 && (
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" gutterBottom>Estatísticas</Typography>
                    <Grid container spacing={2}>
                      {Object.entries(dadosRelatorio.estatisticas).map(([key, value]) => (
                        <Grid item xs={6} sm={3} key={key}>
                          <Card variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {key.replace(/_/g, ' ').toUpperCase()}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {(() => {
                                if (typeof value === 'number') {
                                  // Aplicar formatação específica para valores monetários
                                  if (key.includes('valor_estimado') || key.includes('valor_realizado') || key.includes('desagio')) {
                                    return formatarReal(value);
                                  }
                                  // Para outros números, usar formatação padrão
                                  return formatarNumero(value, key);
                                }
                                return String(value);
                              })()}
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Dados */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {dadosRelatorio.dados && dadosRelatorio.dados.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            {(() => {
                              // Se for relatório personalizado, usa ordemColunas; se for template, usa ordem do array campos
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
                              return camposOrdenados.map((key: string) => {
                                const campo = camposDisponiveis.find(c => c.id === key);
                                const isNumeric = campo?.tipo === 'numero' || key.includes('valor') || key.includes('desagio') || key.includes('percentual');
                                return (
                                  <TableCell 
                                    key={key} 
                                    sx={{ 
                                      fontWeight: 'bold',
                                      textAlign: isNumeric ? 'right' : 'left'
                                    }}
                                  >
                                    {campo?.nome || key.replace(/_/g, ' ').toUpperCase()}
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
                            return (
                              <TableRow key={index} hover>
                                {camposOrdenados.map((key: string, cellIndex: number) => {
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
                                        // Verificar se é uma data
                                        if (key.includes('data') && value) {
                                          return formatarData(value);
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
                                          return value ? 'Sim' : 'Não';
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
          </DialogContent>
        </Dialog>
      </>
    )}
  </Box>
);
}
