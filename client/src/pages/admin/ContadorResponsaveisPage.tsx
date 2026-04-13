import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  LabelList
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import api, { modalidadesService } from '../../services/api';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import PageHeader from '../../components/PageHeader';
import PageContainer from '../../components/PageContainer';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

interface ResponsavelAnalise {
  id: number;
  primeiro_nome: string;
  nome_responsavel: string;
  total_processos: number;
  processos_concluidos: number;
  processos_andamento: number;
  valor_total_estimado: number;
  valor_total_realizado: number;
  valor_medio_estimado: number;
}

interface ModalidadeDistribuicao {
  id: number;
  sigla: string;
  nome: string;
  cor_hex: string;
  total_processos: number;
  valor_total_estimado: number;
  valor_total_realizado: number;
}

interface Modalidade {
  id: number;
  sigla_modalidade: string;
  nome_modalidade: string;
}

interface EvolucaoMensal {
  mes: string;
  total_processos: number;
  valor_total_estimado: number;
  valor_total_realizado: number;
}

// Interfaces para os componentes de modalidade do Dashboard
interface ModalidadeDistribution {
  sigla: string;
  nome: string;
  total_processos: number;
  valor_total: number;
}

interface ModalidadeDistributionValores {
  id: number;
  sigla: string;
  nome: string;
  cor_hex: string;
  total_processos: number;
  valor_total: number;
  valor_estimado_total: number;
  valor_realizado_total: number;
  percentual: number;
}

// Cores modernas do Dashboard - Refinadas para Premium Look
const MODERN_COLORS = {
  light: [
    '#2563EB', // Blue-600 (Confiança)
    '#059669', // Emerald-600 (Sucesso)
    '#D97706', // Amber-600 (Atenção)
    '#DC2626', // Red-600 (Urgência)
    '#7C3AED', // Violet-600 (Processamento)
    '#0891B2', // Cyan-600 (Informação)
    '#65A30D', // Lime-600 (Novo)
    '#EA580C', // Orange-600 (Transição)
  ],
  dark: [
    '#60A5FA', // Blue-400 (Brilho suave)
    '#34D399', // Emerald-400
    '#FBBF24', // Amber-400
    '#F87171', // Red-400
    '#A78BFA', // Violet-400
    '#22D3EE', // Cyan-400
    '#A3E635', // Lime-400
    '#FB923C', // Orange-400
  ],
};

const COLORS_MODERN = [
  '#3B82F6', // Blue-500
  '#10B981', // Emerald-500
  '#F59E0B', // Amber-500
  '#EF4444', // Red-500
  '#8B5CF6', // Violet-500
  '#06B6D4', // Cyan-500
  '#84CC16', // Lime-500
  '#F97316', // Orange-500
  '#EC4899', // Pink-500
  '#6B7280', // Gray-500
];

const ContadorResponsaveisPage = () => {
  const [responsaveisAnalise, setResponsaveisAnalise] = useState<ResponsavelAnalise[]>([]);
  const [modalidadesDistribuicao, setModalidadesDistribuicao] = useState<ModalidadeDistribuicao[]>([]);
  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<number | null>(null);
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'geral' | 'individual'>('geral');
  const [tipoValor, setTipoValor] = useState<'estimado' | 'realizado'>('estimado');
  const [tipoAnaliseModalidade, setTipoAnaliseModalidade] = useState<'valor' | 'quantidade'>('quantidade');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responsavelFiltro, setResponsavelFiltro] = useState<'todos' | number>('todos');
  
  // Novos Filtros
  const [dataInicio, setDataInicio] = useState<Date | null>(new Date(new Date().getFullYear(), 0, 1));
  const [dataFim, setDataFim] = useState<Date | null>(new Date());
  const [modalidadeId, setModalidadeId] = useState<number | ''>('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Carregar modalidades para o filtro
  useEffect(() => {
    const fetchModalidades = async () => {
      try {
        const response = await modalidadesService.list();
        setModalidades(response);
      } catch (err) {
        console.error('Erro ao carregar modalidades:', err);
      }
    };
    fetchModalidades();
  }, []);

  useEffect(() => {
    loadData();
  }, [tipoVisualizacao, responsavelSelecionado, tipoValor, responsavelFiltro, dataInicio, dataFim, modalidadeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Preparar query params
      const params: any = {};
      if (dataInicio) params.dataInicio = format(dataInicio, 'yyyy-MM-dd');
      if (dataFim) params.dataFim = format(dataFim, 'yyyy-MM-dd');
      if (modalidadeId) params.modalidadeId = modalidadeId;
      if (responsavelFiltro !== 'todos') params.responsavelId = responsavelFiltro;
      
      const queryStr = new URLSearchParams(params).toString();
      
      if (tipoVisualizacao === 'geral') {
        let evolucaoEndpoint = `/responsaveis/evolucao-mensal-geral?${queryStr}`;
        
        // Se um responsável específico estiver selecionado no filtro, usar endpoint específico
        if (responsavelFiltro !== 'todos') {
          evolucaoEndpoint = `/responsaveis/${responsavelFiltro}/evolucao-mensal?${queryStr}`;
        }

        const [responsaveisRes, modalidadesRes, evolucaoRes] = await Promise.all([
          api.get(`/responsaveis/analise?${queryStr}`),
          api.get(`/responsaveis/modalidades-geral?${queryStr}`),
          api.get(evolucaoEndpoint)
        ]);

        setResponsaveisAnalise(responsaveisRes.data.data || []);
        setModalidadesDistribuicao(modalidadesRes.data.data || []);
        setEvolucaoMensal(evolucaoRes.data.data || []);
      } else if (responsavelSelecionado) {
        const [responsaveisRes, modalidadesRes, evolucaoRes] = await Promise.all([
          api.get(`/responsaveis/analise?${queryStr}`),
          api.get(`/responsaveis/${responsavelSelecionado}/modalidades?${queryStr}`),
          api.get(`/responsaveis/${responsavelSelecionado}/evolucao-mensal?${queryStr}`)
        ]);

        setResponsaveisAnalise(responsaveisRes.data.data || []);
        setModalidadesDistribuicao(modalidadesRes.data.data || []);
        setEvolucaoMensal(evolucaoRes.data.data || []);
      } else if (tipoVisualizacao === 'individual') {
        const responsaveisRes = await api.get(`/responsaveis/analise?${queryStr}`);
        setResponsaveisAnalise(responsaveisRes.data.data || []);
        setModalidadesDistribuicao([]);
        setEvolucaoMensal([]);
      }
    } catch (error) {
      setError('Erro ao carregar dados de análise');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `R$ ${(value / 1e3).toFixed(1)}K`;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${monthNames[parseInt(monthNum) - 1]}/${year.slice(2)}`;
  };

  // Função para filtrar os dados conforme o responsável selecionado
  const filtrarResponsaveis = (dados: typeof responsaveisAnalise) => {
    if (responsavelFiltro === 'todos') return dados;
    return dados.filter(r => r.id === responsavelFiltro);
  };

  // Dados filtrados para uso em todos os componentes
  const responsaveisFiltrados = filtrarResponsaveis(responsaveisAnalise);

  // Usar responsaveisFiltrados para calcular dados dependentes
  const responsavelSelecionadoData = responsaveisFiltrados.find(r => r.id === responsavelSelecionado);
  // Preparar dados para o gráfico de barras (ordenado do maior para menor, já filtrado)
  const dadosGraficoBarras = responsaveisAnalise
    .sort((a, b) => b.total_processos - a.total_processos)
    .slice(0, 15)
    .map(r => ({
      id: r.id,
      nome: r.primeiro_nome,
      processos: r.total_processos,
      concluidos: r.processos_concluidos,
      andamento: r.processos_andamento,
      valor: tipoValor === 'estimado' ? r.valor_total_estimado : r.valor_total_realizado
    }));

  // === AJUSTE: Filtrar gráficos de modalidade e evolução mensal ===
  // Se cada responsável em responsaveisFiltrados tiver um array de processos, podemos montar os dados filtrados assim:

  // 1. Modalidade (quantidade e valor)
  let modalidadesFiltradas: ModalidadeDistribuicao[] = [];
  if (responsaveisFiltrados.length === 0) {
    modalidadesFiltradas = [];
  } else {
    // Como não temos acesso aos processos individuais, vamos usar os dados agregados
    // ou criar uma estrutura vazia para evitar o erro
    modalidadesFiltradas = [];
  }

  const modalidadeDistributionQuantidade: ModalidadeDistribution[] = modalidadesDistribuicao
    .map(modalidade => ({
      sigla: modalidade.sigla,
      nome: modalidade.nome,
      total_processos: modalidade.total_processos,
      valor_total: tipoValor === 'estimado' ? modalidade.valor_total_estimado : modalidade.valor_total_realizado
    }));

  const modalidadeDistributionValores: ModalidadeDistributionValores[] = modalidadesDistribuicao
    .map(modalidade => {
      const totalModalidades = modalidadesDistribuicao.reduce((acc, m) => acc + m.total_processos, 0);
      return {
        id: modalidade.id,
        sigla: modalidade.sigla,
        nome: modalidade.nome,
        cor_hex: modalidade.cor_hex,
        total_processos: modalidade.total_processos,
        valor_total: tipoValor === 'estimado' ? modalidade.valor_total_estimado : modalidade.valor_total_realizado,
        valor_estimado_total: modalidade.valor_total_estimado,
        valor_realizado_total: modalidade.valor_total_realizado,
        percentual: totalModalidades > 0 ? (modalidade.total_processos / totalModalidades) * 100 : 0
      };
    });

  // Lista de responsáveis para o filtro
  const listaResponsaveis = [
    { id: 'todos', primeiro_nome: 'Todos' },
    ...responsaveisAnalise.map(r => ({ id: r.id, primeiro_nome: r.primeiro_nome }))
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <PageContainer sx={{ 
        '& .recharts-bar-rectangle:hover': {
          filter: 'none !important',
          opacity: '1 !important',
        },
        '& .recharts-active-bar': {
          filter: 'none !important',
          opacity: '1 !important',
        },
        '& .recharts-tooltip-cursor': {
          fill: 'transparent !important',
        }
      }}>
        <PageHeader
          title="Contador de Processos por Responsável"
          subtitle="Distribuição de processos entre os responsáveis cadastrados"
          actions={
            <Tooltip title="Atualizar dados">
              <IconButton onClick={loadData} color="primary" disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          }
        />

        {/* Loading progress linear */}
        {loading && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 3 }} className="no-print">
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Data Início"
                value={dataInicio}
                onChange={(date) => setDataInicio(date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Data Fim"
                value={dataFim}
                onChange={(date) => setDataFim(date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Modalidade</InputLabel>
                <Select
                  value={modalidadeId}
                  onChange={(e) => setModalidadeId(e.target.value as number | '')}
                  label="Modalidade"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {modalidades.map(modalidade => (
                    <MenuItem key={modalidade.id} value={modalidade.id}>
                      {modalidade.nome_modalidade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" gap={1} alignItems="center">
                <FormControl size="small" fullWidth>
                  <InputLabel>Responsável</InputLabel>
                  <Select
                    value={responsavelFiltro}
                    onChange={(e) => setResponsavelFiltro(e.target.value as 'todos' | number)}
                    label="Responsável"
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    {responsaveisAnalise.map(r => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.primeiro_nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title="Limpar Filtros">
                  <IconButton 
                    onClick={() => {
                      setDataInicio(new Date(new Date().getFullYear(), 0, 1));
                      setDataFim(new Date());
                      setModalidadeId('');
                      setResponsavelFiltro('todos');
                    }}
                    disabled={loading}
                    sx={{ 
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <FilterAltOffIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>

      {/* === CARDS DE INDICADORES === */}
      <Grid container spacing={3} mb={3}>
        {/* Card: Total de Processos */}
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'background.paper', boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BarChartIcon sx={{ color: '#2563EB', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold">Total de Processos</Typography>
              </Box>
              {/* Soma total de processos do(s) responsável(is) filtrado(s) */}
              <Typography variant="h3" fontWeight="bold">
                {responsaveisFiltrados.reduce((acc, r) => acc + Number(r.total_processos || 0), 0)}
              </Typography>
              {/* Soma total de valores estimados do(s) responsável(is) filtrado(s) */}
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(responsaveisFiltrados.reduce((acc, r) => acc + Number(r.valor_total_estimado || 0), 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* Card: Em Andamento */}
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'background.paper', boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold">Em Andamento</Typography>
              </Box>
              {/* Soma total de processos em andamento do(s) responsável(is) filtrado(s) */}
              <Typography variant="h3" fontWeight="bold">
                {responsaveisFiltrados.reduce((acc, r) => acc + Number(r.processos_andamento || 0), 0)}
              </Typography>
              {/* Soma total de valores estimados dos processos em andamento do(s) responsável(is) filtrado(s) */}
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(responsaveisFiltrados.reduce((acc, r) => acc + Number(r.valor_total_estimado || 0), 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* Card: Concluídos */}
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'background.paper', boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BarChartIcon sx={{ color: '#10B981', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold">Concluídos</Typography>
              </Box>
              {/* Soma total de processos concluídos do(s) responsável(is) filtrado(s) */}
              <Typography variant="h3" fontWeight="bold">
                {responsaveisFiltrados.reduce((acc, r) => acc + Number(r.processos_concluidos || 0), 0)}
              </Typography>
              {/* Soma total de valores realizados dos processos concluídos do(s) responsável(is) filtrado(s) */}
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(responsaveisFiltrados.reduce((acc, r) => acc + Number(r.valor_total_realizado || 0), 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* Card: Responsáveis Ativos */}
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'background.paper', boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <PersonIcon sx={{ color: '#06B6D4', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold">Responsáveis Ativos</Typography>
              </Box>
              {/* Quantidade de responsáveis ativos filtrados */}
              <Typography variant="h3" fontWeight="bold">{responsaveisFiltrados.length}</Typography>
              <Typography variant="body2" color="text.secondary">Ativos no sistema</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* === GRÁFICO DE BARRAS EMPILHADAS (TOP 15) === */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ height: 600, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                📊 Ranking de Processos por Responsável (Top 15)
              </Typography>
              <Box sx={{ flex: 1, height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={dadosGraficoBarras} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                      <defs>
                        <linearGradient id="colorAndamento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.4}/>
                        </linearGradient>
                        <linearGradient id="colorConcluidos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="nome" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis stroke={theme.palette.text.secondary} />
                      <RechartsTooltip 
                        formatter={(value: any, name: any) => {
                          if (name === 'valor') {
                            return [formatCurrency(value as number), `Valor Estimado`];
                          }
                          return [value, name === 'concluidos' ? 'Concluídos' : name === 'andamento' ? 'Em Andamento' : name];
                        }}
                        contentStyle={{
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '12px',
                          padding: '12px',
                          backdropFilter: 'blur(8px)',
                          boxShadow: theme.shadows[4]
                        }}
                      />
                      <Bar dataKey="andamento" stackId="a" fill="url(#colorAndamento)" name="Em Andamento" isAnimationActive={false}>
                        {dadosGraficoBarras.map((entry, index) => (
                          <Cell
                            key={`cell-andamento-${index}`}
                            fill={
                              responsavelFiltro !== 'todos' && Number(entry.id) === Number(responsavelFiltro)
                                ? theme.palette.error.main
                                : 'url(#colorAndamento)'
                            }
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="concluidos" stackId="a" fill="url(#colorConcluidos)" name="Concluídos" isAnimationActive={false}>
                        {dadosGraficoBarras.map((entry, index) => (
                          <Cell
                            key={`cell-concluidos-${index}`}
                            fill={
                              responsavelFiltro !== 'todos' && Number(entry.id) === Number(responsavelFiltro)
                                ? theme.palette.grey[500]
                                : 'url(#colorConcluidos)'
                            }
                          />
                        ))}
                        <LabelList 
                          dataKey="processos" 
                          position="top" 
                          style={{ 
                            fill: theme.palette.text.primary, 
                            fontWeight: 700,
                            fontSize: '12px'
                          }} 
                        />
                      </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribuição por Modalidades */}
        <Grid item xs={12} lg={4} sx={{ height: 500 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 'bold' }}>
                  📊 {isMobile ? "Modalidades" : `Distribuição por Modalidade (${tipoAnaliseModalidade === 'valor' ? 'Valor' : 'Quantidade'})`}
                  {tipoVisualizacao === 'individual' && responsavelSelecionadoData && (
                    <Typography variant="body2" color="text.secondary">
                      {responsavelSelecionadoData.primeiro_nome}
                    </Typography>
                  )}
                </Typography>
                <ToggleButtonGroup
                  value={tipoAnaliseModalidade}
                  exclusive
                  onChange={(_event, newTipo) => {
                    if (newTipo !== null) {
                      setTipoAnaliseModalidade(newTipo);
                    }
                  }}
                  size="small"
                  sx={{ height: 32 }}
                >
                  <ToggleButton value="valor" size="small">
                    💰
                  </ToggleButton>
                  <ToggleButton value="quantidade" size="small">
                    📊
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box sx={{ flex: 1, minHeight: 400, position: 'relative' }}>
                {modalidadesDistribuicao.length > 0 ? (
                  tipoAnaliseModalidade === 'valor' ? (
                    <DistribuicaoModalidadeValores 
                      data={modalidadeDistributionValores} 
                      tipoValor={tipoValor}
                    />
                  ) : (
                    <DistribuicaoModalidadeQuantidade 
                      data={modalidadeDistributionQuantidade}
                    />
                  )
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography color="text.secondary">Sem dados para exibir.</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Evolução Mensal */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Evolução Mensal de Processos
                {responsavelFiltro !== 'todos' && (
                  <Typography variant="body2" color="text.secondary">
                    {responsaveisAnalise.find(r => r.id === responsavelFiltro)?.primeiro_nome || 'Responsável Selecionado'}
                  </Typography>
                )}
                {tipoVisualizacao === 'individual' && responsavelSelecionadoData && (
                  <Typography variant="body2" color="text.secondary">
                    {responsavelSelecionadoData.primeiro_nome}
                  </Typography>
                )}
              </Typography>
              <Box sx={{ height: 300 }}>
                {evolucaoMensal.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolucaoMensal}>
                      <defs>
                        <linearGradient id="colorEvolucao" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={theme.palette.mode === 'dark' ? 0.6 : 0.4}/>
                          <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="mes" 
                        tickFormatter={formatMonth}
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={false} domain={[0, (dataMax: number) => (isFinite(dataMax) ? dataMax + 5 : 5)]} allowDataOverflow={true} stroke={theme.palette.text.secondary} />
                      <RechartsTooltip 
                        labelFormatter={(value: any) => formatMonth(String(value))}
                        formatter={(value: any, name: any) => {
                          if (name === 'valor_total_estimado' || name === 'valor_total_realizado') {
                            return [formatCurrency(value as number), name === 'valor_total_estimado' ? 'Valor Estimado' : 'Valor Realizado'];
                          }
                          return [value, 'Processos'];
                        }}
                        contentStyle={{
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '12px',
                          padding: '12px',
                          backdropFilter: 'blur(8px)',
                          boxShadow: theme.shadows[4]
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total_processos" 
                        stroke={theme.palette.primary.main}
                        strokeWidth={3}
                        fill="url(#colorEvolucao)"
                        name="total_processos"
                        isAnimationActive={false}
                      >
                        <LabelList dataKey="total_processos" position="top" style={{ fill: theme.palette.primary.main, fontWeight: 700 }} />
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center" 
                    height="100%"
                    color="text.secondary"
                  >
                    <Typography>
                      {responsavelFiltro !== 'todos' 
                        ? `Nenhum dado disponível para ${responsaveisAnalise.find(r => r.id === responsavelFiltro)?.primeiro_nome || 'este responsável'}`
                        : 'Nenhum dado disponível para o período'
                      }
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de Responsáveis - AGORA ABAIXO DOS GRÁFICOS */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Detalhamento por Responsável
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Responsável</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Concluídos</TableCell>
                    <TableCell align="right">Em Andamento</TableCell>
                    <TableCell align="right">Valor {tipoValor === 'estimado' ? 'Estimado' : 'Realizado'}</TableCell>
                    <TableCell align="right">% Conclusão</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(tipoVisualizacao === 'individual' && responsavelSelecionado
                    ? responsaveisFiltrados.filter(r => r.id === responsavelSelecionado)
                    : responsaveisFiltrados
                  ).map((responsavel) => {
                    const percentualConclusao = responsavel.total_processos > 0 
                      ? (responsavel.processos_concluidos / responsavel.total_processos) * 100 
                      : 0;
                    return (
                      <TableRow key={responsavel.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ 
                              mr: 2, 
                              width: 32, 
                              height: 32,
                              bgcolor: theme.palette.mode === 'dark' ? '#ff5d14' : 'primary.main'
                            }}>
                              {responsavel.primeiro_nome.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {responsavel.primeiro_nome}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {responsavel.nome_responsavel}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={responsavel.total_processos}
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={responsavel.processos_concluidos}
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={responsavel.processos_andamento}
                            color="warning"
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(tipoValor === 'estimado' 
                              ? responsavel.valor_total_estimado 
                              : responsavel.valor_total_realizado
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${percentualConclusao.toFixed(1)}%`}
                            color={percentualConclusao >= 70 ? 'success' : percentualConclusao >= 40 ? 'warning' : 'error'}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
    </LocalizationProvider>
  );
};

// NOVO COMPONENTE: Gráfico de Barras para Distribuição por Modalidade (Quantidade)
const DistribuicaoModalidadeQuantidade: React.FC<{
  data: ModalidadeDistribution[];
}> = ({ data }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const COLORS = isDarkMode ? MODERN_COLORS.dark : MODERN_COLORS.light;
  const sortedData = [...data].sort((a, b) => b.total_processos - a.total_processos);
  if (sortedData.length === 0) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Sem dados para exibir.</Typography>;
  }
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsBarChart data={sortedData} layout="vertical" margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
        <defs>
          {COLORS.map((color, index) => (
            <linearGradient key={`grad-modalidade-qtd-${index}`} id={`gradQtd${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.4}/>
            </linearGradient>
          ))}
        </defs>
        <XAxis type="number" axisLine={false} tickLine={false} tick={false} />
        <YAxis dataKey="sigla" type="category" width={80} stroke={theme.palette.text.secondary} />
        <RechartsTooltip 
          formatter={(value: any, _name: any, props: any) => [`${value} processos`, `${props.payload.sigla} - ${props.payload.nome}`]}
          contentStyle={{
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px',
            padding: '12px',
            backdropFilter: 'blur(8px)',
            boxShadow: theme.shadows[4]
          }}
        />
        <Bar dataKey="total_processos" name="Processos" fill={theme.palette.primary.main} isAnimationActive={false}>
          {sortedData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={`url(#gradQtd${index % COLORS.length})`} />
          ))}
          <LabelList 
            dataKey="total_processos" 
            position="right" 
            dx={8} 
            style={{ 
              fill: theme.palette.text.primary, 
              fontWeight: 700,
              fontSize: '12px'
            }} 
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

// NOVO COMPONENTE: Gráfico de Barras para Distribuição por Modalidade (Valor)
const DistribuicaoModalidadeValores: React.FC<{
  data: ModalidadeDistributionValores[];
  tipoValor: 'estimado' | 'realizado';
}> = ({ data, tipoValor }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const COLORS = isDarkMode ? MODERN_COLORS.dark : MODERN_COLORS.light;
  const sortedData = [...data].sort((a, b) => {
    const aValue = tipoValor === 'estimado' ? a.valor_estimado_total : a.valor_realizado_total;
    const bValue = tipoValor === 'estimado' ? b.valor_estimado_total : b.valor_realizado_total;
    return (bValue || 0) - (aValue || 0);
  });
  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `R$ ${(value / 1e3).toFixed(1)}k`;
    return `R$ ${value.toFixed(2)}`;
  };
  if (sortedData.length === 0) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Sem dados para exibir.</Typography>;
  }
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsBarChart data={sortedData} layout="vertical" margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
        <defs>
          {COLORS.map((color, index) => (
            <linearGradient key={`grad-modalidade-val-${index}`} id={`gradVal${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.4}/>
            </linearGradient>
          ))}
        </defs>
        <XAxis type="number" axisLine={false} tickLine={false} tick={false} />
        <YAxis dataKey="sigla" type="category" width={80} stroke={theme.palette.text.secondary} />
        <RechartsTooltip 
          formatter={(value: any, _name: any, props: any) => [formatCurrency(value), `${props.payload.sigla} - ${props.payload.nome}`]}
          contentStyle={{
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px',
            padding: '12px',
            backdropFilter: 'blur(8px)',
            boxShadow: theme.shadows[4]
          }}
        />
        <Bar dataKey={tipoValor === 'estimado' ? 'valor_estimado_total' : 'valor_realizado_total'} name={tipoValor === 'estimado' ? 'Valor Estimado' : 'Valor Realizado'} fill={theme.palette.primary.main} minPointSize={8} isAnimationActive={false}>
          {sortedData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={`url(#gradVal${index % COLORS.length})`} />
          ))}
          <LabelList 
            dataKey={tipoValor === 'estimado' ? 'valor_estimado_total' : 'valor_realizado_total'} 
            position="right" 
            dx={8} 
            style={{ 
              fill: theme.palette.text.primary, 
              fontWeight: 700,
              fontSize: '11px'
            }} 
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default ContadorResponsaveisPage; 