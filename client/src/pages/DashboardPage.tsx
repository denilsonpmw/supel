import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Container,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  AttachMoney,
  Timeline,
  Refresh,
  Info,
  Close,
  TrendingUp,
} from '@mui/icons-material';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import api from '../services/api';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface DashboardMetrics {
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

interface HeatmapData {
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

interface ProcessEvolution {
  mes: string;
  total_processos: number;
  valor_total: number;
}

interface ProcessoCritico {
  id: number;
  nup: string;
  objeto: string;
  nome_situacao: string;
  data_situacao: string;
  dias_parado: number;
  unidade_gestora: string;
  responsavel: string;
  cor_hex: string;
  valor_estimado: number;
}

interface ProcessoDetalhado {
  id: number;
  nup: string;
  objeto: string;
  data_situacao: string;
  sigla?: string;
  diasParados: number;
  situacao_id: number;
  unidade_gestora?: {
    sigla: string;
  };
}

interface SituacaoProcessada {
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
  processos: ProcessoDetalhado[];
}

const MODERN_COLORS = {
  light: [
    '#3B82F6', // Blue-500
    '#10B981', // Emerald-500
    '#F59E0B', // Amber-500
    '#EF4444', // Red-500
    '#8B5CF6', // Violet-500
    '#06B6D4', // Cyan-500
    '#84CC16', // Lime-500
    '#F97316', // Orange-500
  ],
  dark: [
    '#2563EB', // Blue-600
    '#059669', // Emerald-600
    '#D97706', // Amber-600
    '#DC2626', // Red-600
    '#8B5CF6', // Violet-500
    '#EC4899', // Pink-500
  ],
};

// Função utilitária para parse seguro de datas YYYY-MM-DD
function parseDateBr(dateStr: string) {
  if (!dateStr) return null;
  
  // Se já é uma data válida no formato YYYY-MM-DD, usar diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Tentar converter outras strings de data
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}

const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [modalidadeDistribution, setModalidadeDistribution] = useState<ModalidadeDistribution[]>([]);
  const [modalidadeDistributionValores, setModalidadeDistributionValores] = useState<ModalidadeDistributionValores[]>([]);
  const [tipoValor, setTipoValor] = useState<'estimado' | 'realizado'>('estimado');
  const [tipoAnaliseModalidade, setTipoAnaliseModalidade] = useState<'valor' | 'quantidade'>('quantidade');
  const [processEvolution, setProcessEvolution] = useState<ProcessEvolution[]>([]);
  const [processosCriticos, setProcessosCriticos] = useState<ProcessoCritico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Iniciando carregamento dos dados do dashboard...');

      const [
        metricsResponse,
        heatmapResponse,
        modalidadeResponse,
        modalidadeValoresResponse,
        evolutionResponse,
        criticosResponse,
      ] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/heatmap'),
        api.get('/dashboard/modalidades'),
        api.get(`/dashboard/modalidades-valores?tipo=${tipoValor}`),
        api.get(`/dashboard/evolution?tipo=${tipoValor}`),
        api.get('/dashboard/criticos'),
      ]);

      console.log('📊 Dados brutos recebidos:', {
        metrics: metricsResponse.data,
        heatmap: heatmapResponse.data,
        modalidades: modalidadeResponse.data,
        modalidadesValores: modalidadeValoresResponse.data,
        evolution: evolutionResponse.data,
        criticos: criticosResponse.data,
      });

      setMetrics(metricsResponse.data.data || null);
      
      // Apenas passa os dados brutos, a lógica de filtro/ordenação fica no componente
      setHeatmapData(heatmapResponse.data.data || []);
      
      const modalidadesProcessadas = (modalidadeResponse.data.data || [])
        .filter((item: ModalidadeDistribution) => item.total_processos > 0)
        .map((item: ModalidadeDistribution) => {
            const total = (modalidadeResponse.data.data || []).reduce((sum: number, m: ModalidadeDistribution) => sum + m.total_processos, 0);
            const percentual = total > 0 ? ((item.total_processos / total) * 100).toFixed(0) : '0';
            return { ...item, percentual: parseInt(percentual) };
        });
      setModalidadeDistribution(modalidadesProcessadas);

      const rawModalidadesValores = modalidadeValoresResponse.data?.data;
      const modalidadesValoresProcessados = Array.isArray(rawModalidadesValores)
        ? rawModalidadesValores.map((item: any) => ({
            ...item,
            name: item.sigla,
            value: tipoValor === 'estimado' ? item.valor_estimado_total : item.valor_realizado_total,
          }))
        : [];
      setModalidadeDistributionValores(modalidadesValoresProcessados);

      setProcessEvolution(evolutionResponse.data.data || []);
      setProcessosCriticos(criticosResponse.data.data || []);

    } catch (err) {
      console.error('❌ Erro ao carregar dados do dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [tipoValor]);

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleTipoValorChange = (
    _event: React.MouseEvent<HTMLElement> | null,
    newTipoValor: 'estimado' | 'realizado' | null,
  ) => {
    if (newTipoValor !== null) {
      setTipoValor(newTipoValor);
    }
  };

  if (loading) {
    return (
      <Box width="100%" sx={{ mt: 4, mb: 4, px: { xs: 1, sm: 2, md: 4 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box width="100%" sx={{ mt: 4, mb: 4, px: { xs: 1, sm: 2, md: 4 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box display="flex" justifyContent="center">
          <IconButton onClick={loadDashboardData} color="primary">
            <Refresh />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 1, sm: 2, md: 3 }, py: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Dashboard
        </Typography>
        <Tooltip title="Atualizar dados">
          <IconButton onClick={loadDashboardData} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 20 }} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {metrics?.processos_ativos.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Processos Ativos
                  </Typography>
                  <Typography variant="h6" fontWeight="medium" color="text.primary">
                    {formatCurrency(metrics?.processos_ativos.valor_associado || 0)}
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {metrics?.processos_andamento.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Em Andamento
                  </Typography>
                  <Typography variant="h6" fontWeight="medium" color="text.primary">
                    {formatCurrency(metrics?.processos_andamento.valor_associado || 0)}
                  </Typography>
                </Box>
                <Timeline sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {metrics?.estimado_concluidos.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Estimado Concluídos
                  </Typography>
                  <Typography variant="h6" fontWeight="medium" color="text.primary">
                    {formatCurrency(metrics?.estimado_concluidos.valor_estimado || 0)}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'secondary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {metrics?.processos_concluidos.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Concluídos
                  </Typography>
                  <Typography variant="h6" fontWeight="medium" color="text.primary">
                    {formatCurrency(metrics?.processos_concluidos.valor_associado || 0)}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ display: 'block', mt: 0.5, color: 'success.main', fontWeight: 500 }}
                  >
                    {metrics && metrics.processos_ativos.total > 0
                      ? `${((metrics.processos_concluidos.total / metrics.processos_ativos.total) * 100).toFixed(2)}% dos ativos`
                      : '0% dos ativos'}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {metrics?.economicidade.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Economicidade
                  </Typography>
                  <Typography variant="h6" fontWeight="medium" color="text.primary">
                    {formatCurrency(metrics?.economicidade.valor_economizado || 0)}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ display: 'block', mt: 0.5, color: 'success.main', fontWeight: 500 }}
                  >
                    {metrics?.economicidade && metrics.economicidade.percentual !== undefined
                      ? `${metrics.economicidade.percentual.toFixed(2)}% de economia`
                      : '0% de economia'
                    }
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12}>
          <MapaCalorSituacoes heatmapData={heatmapData} isMobile={isMobile} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 'bold' }}>
                  📊 {isMobile ? "Modalidades" : `Distribuição por Modalidade (${tipoAnaliseModalidade === 'valor' ? 'Valor' : 'Quantidade'})`}
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
              {tipoAnaliseModalidade === 'valor' ? (
                <DistribuicaoModalidadeValores 
                  data={modalidadeDistributionValores} 
                  tipoValor={tipoValor}
                />
              ) : (
                <DistribuicaoModalidadeQuantidade 
                  data={modalidadeDistribution}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card sx={{ width: '100%', height: isMobile ? 250 : '100%' }}>
            <CardContent sx={{ 
              width: '100%', 
              p: 1, 
              height: isMobile ? '100%' : 340,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <Typography variant={isMobile ? "body1" : "h6"} gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
                📈 {isMobile ? "Processos/Mês" : "Processos por Mês (Quantidade e Valor)"}
              </Typography>
              <Box sx={{ width: '100%', height: isMobile ? 180 : 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={processEvolution} 
                    margin={isMobile 
                      ? { top: 20, right: 0, left: 0, bottom: 5 }
                      : { top: 50, right: 5, left: 5, bottom: 5 }
                    }
                  >
                    <XAxis
                      dataKey="mes"
                      axisLine={false}
                      tickLine={false}
                      tick={isMobile ? { fontSize: 10 } : true}
                      tickFormatter={(value: string) => {
                        const date = parseDateBr(value);
                        return date ? date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '';
                      }}
                    />
                    <YAxis yAxisId="left" tick={false} axisLine={false} width={0} />
                    <YAxis yAxisId="right" orientation="right" tick={false} axisLine={false} width={0} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: '8px',
                        padding: '8px'
                      }}
                      labelStyle={{
                        color: theme.palette.text.primary,
                        fontWeight: 'bold',
                        marginBottom: '4px'
                      }}
                      itemStyle={{
                        color: theme.palette.text.primary
                      }}
                      labelFormatter={(label: string) => {
                        const date = parseDateBr(label);
                        return date ? date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'Valor Total') {
                          return [`R$ ${value.toLocaleString('pt-BR')}`, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Area
                      yAxisId="none"
                      type="monotone"
                      dataKey="total_processos"
                      stroke={theme.palette.primary.main}
                      fill={theme.palette.primary.main}
                      fillOpacity={0.1}
                      name="Processos"
                      strokeWidth={1}
                      dot={{ r: isMobile ? 3 : 4, fill: theme.palette.primary.main }}
                      label={isMobile ? false : {
                        position: 'top',
                        fill: theme.palette.primary.main,
                        fontWeight: "bold",
                        fontSize: "12px",
                        offset: 5
                      }}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="valor_total"
                      stroke={theme.palette.secondary.main}
                      fill={theme.palette.secondary.main}
                      fillOpacity={0.1}
                      name="Valor Total"
                      strokeWidth={1}
                      dot={{ r: isMobile ? 3 : 4, fill: theme.palette.secondary.main }}
                      label={isMobile ? false : {
                        position: 'top',
                        fill: theme.palette.secondary.main,
                        fontWeight: "bold",
                        fontSize: "12px",
                        offset: 5,
                        formatter: (value: number) => {
                          if (value >= 1000000000) {
                            return `${(value / 1000000000).toFixed(1).replace('.', ',')}B`;
                          } else if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(1).replace('.', ',')}M`;
                          } else if (value >= 1000) {
                            return `${(value / 1000).toFixed(1).replace('.', ',')}K`;
                          } else {
                            return `${value.toLocaleString('pt-BR')}`;
                          }
                        }
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
              {/* Legenda externa */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: isMobile ? 2 : 3, 
                mt: 1,
                flexWrap: 'wrap'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ 
                    width: 12, 
                    height: 12, 
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: '2px'
                  }} />
                  <Typography variant={isMobile ? "caption" : "body2"}>
                    Processos
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ 
                    width: 12, 
                    height: 12, 
                    backgroundColor: theme.palette.secondary.main,
                    borderRadius: '2px'
                  }} />
                  <Typography variant={isMobile ? "caption" : "body2"}>
                    Valor Total
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center">
            {isMobile ? (
              <Box display="flex" alignItems="center" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" fontWeight="medium">💰 Estimados</Typography>
                </Box>
                <Switch
                  checked={tipoValor === 'realizado'}
                  onChange={(e) => handleTipoValorChange(null, e.target.checked ? 'realizado' : 'estimado')}
                  color="primary"
                />
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" fontWeight="medium">✅ Realizados</Typography>
                </Box>
              </Box>
            ) : (
              <ToggleButtonGroup
                value={tipoValor}
                exclusive
                onChange={handleTipoValorChange}
                size="medium"
                sx={{ boxShadow: 2 }}
              >
                <ToggleButton value="estimado">
                  <Typography variant="body1" fontWeight="medium">💰 Valores Estimados</Typography>
                </ToggleButton>
                <ToggleButton value="realizado">
                  <Typography variant="body1" fontWeight="medium">✅ Valores Realizados</Typography>
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>
        </Grid>
      </Grid>

      {processosCriticos.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant={isMobile ? "body1" : "h6"} gutterBottom sx={{ fontWeight: 'bold' }}>
                  ⚠️ {isMobile ? "Processos Críticos" : "Processos Críticos (Parados há mais de 30 dias)"}
                </Typography>
                <List>
                  {processosCriticos.slice(0, 10).map((processo) => (
                    <ListItem key={processo.id} divider>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              {processo.nup}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              {processo.objeto}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              <strong>Situação:</strong> {processo.nome_situacao}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Situação desde:</strong> {parseDateBr(processo.data_situacao) ? parseDateBr(processo.data_situacao)?.toLocaleDateString('pt-BR') : ''}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Unidade Gestora:</strong> {processo.unidade_gestora || 'N/A'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

const DistribuicaoModalidadeValores: React.FC<{
  data: ModalidadeDistributionValores[];
  tipoValor: 'estimado' | 'realizado';
}> = ({ data, tipoValor }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const COLORS = isDarkMode ? MODERN_COLORS.dark : MODERN_COLORS.light;

  const total = data.reduce((acc, entry) => {
    const value = tipoValor === 'estimado' ? entry.valor_estimado_total : entry.valor_realizado_total;
    return acc + (value || 0);
  }, 0);

  const dataWithPercent = data.map(entry => {
    const value = tipoValor === 'estimado' ? entry.valor_estimado_total : entry.valor_realizado_total;
    return {
      ...entry,
      value: value,
      percent: total > 0 && value ? value / total : 0,
    };
  }).filter(entry => entry.value && entry.value > 0);

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `R$ ${(value / 1e3).toFixed(1)}k`;
    return `R$ ${value.toFixed(2)}`;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.08) return null;

    return (
      <text
        x={x}
        y={y}
        fill={isDarkMode ? '#fff' : '#222'}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14px"
        fontWeight="bold"
      >
        {formatCurrency(value)}
      </text>
    );
  };

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mt: 2, maxWidth: '100%' }}>
        {payload.map((entry: any, index: number) => (
          <Chip
            key={`item-${index}`}
            label={`${entry.payload.sigla}: ${entry.payload.total_processos} (${(entry.payload.percent * 100).toFixed(1)}%)`}
            sx={{
              bgcolor: entry.color,
              color: theme.palette.getContrastText(entry.color),
              m: 0.5,
              fontWeight: 'medium',
            }}
            size="small"
          />
        ))}
      </Box>
    );
  };

  if (dataWithPercent.length === 0) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Sem dados para exibir.</Typography>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsPieChart>
        <Pie
          data={dataWithPercent}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={140}
          fill="#8884d8"
          dataKey="value"
          nameKey="sigla"
          label={CustomLabel}
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          formatter={(value: number, _name: string, props: any) => [formatCurrency(value), `${props.payload.sigla} - ${props.payload.nome}`]}
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            borderRadius: '8px',
            padding: '8px',
            color: theme.palette.text.primary,
          }}
          itemStyle={{
            color: theme.palette.text.primary,
          }}
        />
        <Legend content={<CustomLegend />} />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

const DistribuicaoModalidadeQuantidade: React.FC<{ data: ModalidadeDistribution[] }> = ({ data }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const COLORS = isDarkMode ? MODERN_COLORS.dark : MODERN_COLORS.light;

  const total = data.reduce((acc, entry) => acc + entry.total_processos, 0);

  const dataWithPercent = data.map(entry => ({
    ...entry,
    value: entry.total_processos,
    percent: total > 0 ? entry.total_processos / total : 0,
  })).filter(entry => entry.value > 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.08) return null;

    return (
      <text
        x={x}
        y={y}
        fill={isDarkMode ? '#fff' : '#222'}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14px"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mt: 2, maxWidth: '100%' }}>
        {payload.map((entry: any, index: number) => (
          <Chip
            key={`item-${index}`}
            label={`${entry.payload.sigla}: ${entry.payload.total_processos} (${(entry.payload.percent * 100).toFixed(1)}%)`}
            sx={{
              bgcolor: entry.color,
              color: theme.palette.getContrastText(entry.color),
              m: 0.5,
              fontWeight: 'medium',
            }}
            size="small"
          />
        ))}
      </Box>
    );
  };

  if (dataWithPercent.length === 0) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Sem dados para exibir.</Typography>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsPieChart>
        <Pie
          data={dataWithPercent}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={140}
          fill="#8884d8"
          dataKey="value"
          nameKey="sigla"
          label={CustomLabel}
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          formatter={(value: number, _name: string, props: any) => [`${value} processos`, `${props.payload.sigla} - ${props.payload.nome}`]}
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            borderRadius: '8px',
            padding: '8px',
            color: theme.palette.text.primary,
          }}
          itemStyle={{
            color: theme.palette.text.primary,
          }}
        />
        <Legend content={<CustomLegend />} />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

const MapaCalorSituacoes: React.FC<{ heatmapData: HeatmapData[]; isMobile: boolean }> = ({heatmapData, isMobile}) => {
  const [dialogDetalhes, setDialogDetalhes] = useState<{
    open: boolean;
    situacao: SituacaoProcessada | null;
    processos: ProcessoDetalhado[];
  }>({open: false, situacao: null, processos: [] });
  const [loading, setLoading] = useState(false);

  const carregarProcessosDetalhados = async (situacaoId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/processes?situacao_id=${situacaoId}&page=1&limit=100`);
      const processos = response.data.data || response.data.processes || response.data || [];

      const processosComDias = processos.map((processo: any) => ({
        id: processo.id,
        nup: processo.nup,
        objeto: processo.objeto,
        data_situacao: processo.data_situacao,
        sigla: processo.unidade_gestora?.sigla || processo.sigla || "N/A",
        diasParados: processo.data_situacao ?
        Math.max(0, Math.floor((new Date().getTime() - new Date(processo.data_situacao).getTime()) / (1000 * 60 * 60 * 24))) : 0,
        situacao_id: processo.situacao_id,
        unidade_gestora: processo.unidade_gestora
      }));

      return processosComDias;
    } catch (error) {
      console.error('Erro ao carregar processos detalhados:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const calcularCor = (percentualCriticos: number) => {
    if (percentualCriticos >= 70) return '#DC2626'; // Red-600
    if (percentualCriticos >= 50) return '#EA580C'; // Orange-600
    if (percentualCriticos >= 30) return '#F59E0B'; // Amber-500
    if (percentualCriticos >= 15) return '#EAB308'; // Yellow-500
    return '#10B981'; // Emerald-500
  };

  const calcularTamanho = (dias: number, quantidade: number) => {
    let tamanho = 75 + (dias * 1.2) + (quantidade * 1.5);
    return Math.max(60, Math.min(tamanho, 140));
  };

  const getQuadradoStyle = (situacao: HeatmapData) => {
    const tamanho = calcularTamanho(situacao.tempo_medio_dias, situacao.total_processos);
    const cor = calcularCor(situacao.percentual_criticos);

    return {
      width: tamanho,
      height: tamanho,
      backgroundColor: cor,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '8px',
      padding: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      color: '#FFFFFF',
      transition: 'transform 0.2s, box-shadow 0.2s',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    };
  };

  const handleClickSituacao = async (situacao: HeatmapData) => {
    const processosDetalhados = await carregarProcessosDetalhados(situacao.id);

    const situacaoProcessada: SituacaoProcessada = {
      ...situacao,
      processos: processosDetalhados
    };

    setDialogDetalhes({
      open: true,
      situacao: situacaoProcessada,
      processos: processosDetalhados
    });
  };

  const formatarData = (dataISO: string) => {
    if (!dataISO) return "-";
    try {
      return new Date(dataISO).toLocaleDateString('pt-BR');
    } catch {
      return "-";
    }
  };

  const situacoesFiltradas = heatmapData
    .filter(situacao => {
      console.log('🔍 Analisando situação:', situacao);
      const passou = situacao.tempo_medio_dias >= 5;
      console.log(`   Tempo médio: ${situacao.tempo_medio_dias} dias - Passou filtro: ${passou}`);
      return passou;
    })
    .sort((a, b) => {
      console.log(`🔄 Ordenando: A(${a.nome_situacao}): ${a.score_tamanho_visual} vs B(${b.nome_situacao}): ${b.score_tamanho_visual}`);
      return b.score_tamanho_visual - a.score_tamanho_visual;
    });

  console.log('🎨 Situações filtradas:', situacoesFiltradas);

  return (
    <>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant={isMobile ? "body1" : "h6"} gutterBottom sx={{ fontWeight: 'bold' }}>
            🌡️ {isMobile ? "Mapa de Calor" : "Mapa de Calor das Situações"}
          </Typography>
          <Tooltip title="Informações">
            <IconButton size="small">
              <Info />
            </IconButton>
          </Tooltip>
        </Box>

        {situacoesFiltradas.length > 0 ? (
          <>
            <Box
              display="flex"
              flexWrap="wrap"
              justifyContent="center"
              alignItems="flex-start"
              gap={2}
              mb={4}
            >
              {situacoesFiltradas.map((situacao) => {
                console.log('🎯 Renderizando situação:', {
                  nome: situacao.nome_situacao,
                  tempo_medio: situacao.tempo_medio_dias,
                  total_processos: situacao.total_processos,
                  percentual_criticos: situacao.percentual_criticos,
                  tamanho: calcularTamanho(situacao.tempo_medio_dias, situacao.total_processos),
                  cor: calcularCor(situacao.percentual_criticos)
                });

                return (
                  <Box
                    key={situacao.id}
                    onClick={() => handleClickSituacao(situacao)}
                    sx={getQuadradoStyle(situacao)}
                  >
                    <Typography
                      variant="body2"
                      textAlign="center"
                      sx={{
                        color: '#FFFFFF',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                        mb: 0.5,
                        wordBreak: 'break-word',
                        maxWidth: '100%',
                        fontSize: "12px",
                        lineHeight: 1.1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        maxHeight: '2.4em', // Aproximadamente 2 linhas
                      }}
                    >
                      {situacao.nome_situacao}
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      textAlign="center"
                      sx={{
                        color: '#FFFFFF',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                        fontSize: 18,
                        lineHeight: 1.1,
                        mb: 0.5,
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                      }}
                    >
                      {situacao.total_processos}
                    </Typography>
                    <Typography
                      variant="caption"
                      textAlign="center"
                      sx={{
                        color: '#FFFFFF',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                        fontSize: 13,
                        lineHeight: 1.1,
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                      }}
                    >
                      {situacao.tempo_medio_dias} dias
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Legenda
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Cores (% Processos Críticos)
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {[
                      { cor: '#DC2626', texto: '≥70% críticos' },
                      { cor: '#EA580C', texto: '50-69% críticos' },
                      { cor: '#F59E0B', texto: '30-49% críticos' },
                      { cor: '#EAB308', texto: '15-29% críticos' },
                      { cor: '#10B981', texto: '<15% críticos' }
                    ].map((item, index) => (
                      <Box key={index} display="flex" alignItems="center" gap={1}>
                        <Box width={16} height={16} bgcolor={item.cor} borderRadius={1} />
                        <Typography variant="body2" color="text.secondary">
                          {item.texto}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Leitura do quadrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Situação Atual
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantidade
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Média de dias parados
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Box mt={4}>
              <Typography variant="subtitle2" gutterBottom>
                Resumo Executivo
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} textAlign="center">
                  <Typography variant="h4" color="error.main">
                    {situacoesFiltradas.reduce((sum, s) => sum + s.processos_criticos, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Processos Críticos
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({'>'}15 dias parados)
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {situacoesFiltradas.reduce((sum, s) => sum + s.processos_atencao, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Processos em Atenção
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (7-15 dias parados)
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} textAlign="center">
                  <Typography variant="h4" color="info.main">
                    {situacoesFiltradas.length > 0 ?
                      Math.round(situacoesFiltradas.reduce((sum, s) => sum + s.tempo_medio_dias, 0) / situacoesFiltradas.length)
                      : 0
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Média Geral
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (dias parados)
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </>
        ) : (
          <Box
            height={320}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            color="text.secondary"
          >
            <Typography variant={isMobile ? "body1" : "h6"} color="text.primary" gutterBottom sx={{ fontWeight: 'bold' }}>
              {isMobile ? "Nenhuma situação encontrada" : "Nenhuma situação com ≥5 dias encontrada"}
            </Typography>
            <Typography variant="body2">
              Apenas situações com processos parados há 5 ou mais dias são exibidas
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog
        open={dialogDetalhes.open}
        onClose={() => setDialogDetalhes({ open: false, situacao: null, processos: [] })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Processos em: {dialogDetalhes.situacao?.nome_situacao}
            </Typography>
            <IconButton
              onClick={() => setDialogDetalhes({ open: false, situacao: null, processos: [] })}
              size="small"
              sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {dialogDetalhes.processos.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total de Processos
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {dialogDetalhes.situacao?.tempo_medio_dias || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Média de Dias Parados
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {dialogDetalhes.situacao?.processos_criticos || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Processos Críticos
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box maxHeight={400} overflow="auto">
                {dialogDetalhes.processos
                  .sort((a, b) => b.diasParados - a.diasParados) // Ordenar por dias (maior para menor)
                  .map((processo) => (
                  <Paper
                    key={processo.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {processo.nup}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {processo.objeto}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Situação desde: {parseDateBr(processo.data_situacao) ? parseDateBr(processo.data_situacao)?.toLocaleDateString('pt-BR') : ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • UG: {processo.sigla}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={`${processo.diasParados} dias`}
                      color={processo.diasParados > 15 ? "error" : processo.diasParados > 7 ? "warning" : "default"}
                      size="small"
                      sx={{
                        backgroundColor: processo.diasParados > 15 
                          ? '#FEE2E2' // Red-100
                          : processo.diasParados > 7 
                          ? '#FEF3C7' // Amber-100
                          : '#F3F4F6', // Gray-100
                        color: processo.diasParados > 15 
                          ? '#991B1B' // Red-800
                          : processo.diasParados > 7 
                          ? '#92400E' // Amber-800
                          : '#1F2937', // Gray-800
                        '& .MuiChip-label': {
                          fontWeight: 500,
                        },
                      }}
                    />
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardPage; 