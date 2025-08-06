import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Divider
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Visibility,
  Mouse,
  AccessTime,
  Download,
  Search,
  Report,
  Error,
  Refresh,
  GetApp
} from '@mui/icons-material';
// Removendo date-fns por problemas de compatibilidade - usando alternativas nativas

interface DashboardMetrics {
  summary: {
    totalUsers: number;
    totalSessions: number;
    totalEvents: number;
    avgSessionTime: number;
    bounceRate: number;
    newUsers: number;
    returningUsers: number;
  };
  timeSeriesData: Array<{
    date: string;
    users: number;
    sessions: number;
    events: number;
    avgTime: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
    avgTime: number;
    bounceRate: number;
  }>;
  userBehavior: Array<{
    eventType: string;
    count: number;
    percentage: number;
  }>;
  deviceStats: Array<{
    device: string;
    browser: string;
    os: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    username: string;
    action: string;
    page: string;
    timestamp: string;
    sessionTime: number;
  }>;
  searchMetrics: {
    totalSearches: number;
    avgResultsCount: number;
    noResultsRate: number;
    topQueries: Array<{
      query: string;
      count: number;
      avgResults: number;
    }>;
  };
  reportMetrics: {
    totalReports: number;
    avgGenerationTime: number;
    topReportTypes: Array<{
      type: string;
      count: number;
      avgTime: number;
    }>;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  const timeRangeOptions = [
    { value: '1d', label: 'Últimas 24 horas' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' }
  ];

  const loadMetrics = async () => {
    try {
      console.log('🔄 Carregando métricas de analytics...');
      console.log('TimeRange:', timeRange);
      console.log('Token:', localStorage.getItem('supel_token') ? 'Existe' : 'Não existe');
      
      const response = await fetch(`/api/analytics/dashboard?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supel_token')}`
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        console.error('❌ Response não ok:', response.statusText);
        setError('Falha ao carregar métricas');
        return;
      }

      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao carregar analytics:', err);
      setError('Erro ao carregar dados de analytics');
      console.error('Erro no dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
  };

  const exportData = async () => {
    try {
      const response = await fetch(`/api/analytics/export?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supel_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `analytics-${timeRange}-${formatDate(new Date().toISOString())}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Erro ao exportar dados:', err);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'há alguns segundos';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `há ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `há ${days} dia${days > 1 ? 's' : ''}`;
    }
  };

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

  const COLORS = MODERN_COLORS.light;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Nenhum dado disponível para o período selecionado.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header com controles */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={timeRange}
              label="Período"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {timeRangeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Atualizar dados">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exportar dados">
            <IconButton onClick={exportData}>
              <GetApp />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Cards de resumo */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Usuários Únicos
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.summary ? formatNumber(metrics.summary.totalUsers) : '0'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {metrics?.summary ? `${metrics.summary.newUsers} novos usuários` : '0 novos usuários'}
                  </Typography>
                </Box>
                <Visibility color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Sessões
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.summary ? formatNumber(metrics.summary.totalSessions) : '0'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {metrics?.summary ? `Taxa de rejeição: ${formatPercentage(metrics.summary.bounceRate)}` : 'Taxa de rejeição: 0%'}
                  </Typography>
                </Box>
                <AccessTime color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Eventos
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.summary ? formatNumber(metrics.summary.totalEvents) : '0'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Interações registradas
                  </Typography>
                </Box>
                <Mouse color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tempo Médio
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.summary ? formatTime(metrics.summary.avgSessionTime) : '0min'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Por sessão
                  </Typography>
                </Box>
                <TrendingUp color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos principais */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Atividade ao Longo do Tempo
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.timeSeriesData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: string) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    labelFormatter={(value: string) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      });
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stackId="1"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.1}
                    name="Usuários"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stackId="1"
                    stroke={COLORS[1]}
                    fill={COLORS[1]}
                    fillOpacity={0.1}
                    name="Sessões"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Interações dos Usuários
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Distribuição das ações realizadas (cliques, navegação, formulários, etc.)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.userBehavior}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${(percentage * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {metrics.userBehavior.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Páginas mais visitadas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Páginas Mais Visitadas
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Página</TableCell>
                      <TableCell align="right">Visualizações</TableCell>
                      <TableCell align="right">Tempo Médio</TableCell>
                      <TableCell align="right">Taxa Rejeição</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.topPages.slice(0, 5).map((page, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {page.page}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(page.views)}
                        </TableCell>
                        <TableCell align="right">
                          {formatTime(page.avgTime)}
                        </TableCell>
                        <TableCell align="right">
                          {formatPercentage(page.bounceRate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estatísticas de Dispositivos
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Dispositivo</TableCell>
                      <TableCell>Navegador</TableCell>
                      <TableCell>Sistema</TableCell>
                      <TableCell align="right">Acessos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.deviceStats.slice(0, 5).map((device, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {device.device}
                        </TableCell>
                        <TableCell>{device.browser}</TableCell>
                        <TableCell>{device.os}</TableCell>
                        <TableCell align="right">
                          {formatNumber(device.count)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Métricas de pesquisa e relatórios */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Search sx={{ mr: 1, verticalAlign: 'middle' }} />
                Métricas de Pesquisa
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Total de pesquisas: {formatNumber(metrics.searchMetrics.totalSearches)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Média de resultados: {metrics.searchMetrics.avgResultsCount.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Taxa sem resultados: {formatPercentage(metrics.searchMetrics.noResultsRate)}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Consultas Mais Populares
              </Typography>
              {metrics.searchMetrics.topQueries.slice(0, 3).map((query, index) => (
                <Box key={index} mb={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">{query.query}</Typography>
                    <Chip
                      label={formatNumber(query.count)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Report sx={{ mr: 1, verticalAlign: 'middle' }} />
                Métricas de Relatórios
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Total de relatórios: {formatNumber(metrics.reportMetrics.totalReports)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Tempo médio de geração: {metrics.reportMetrics.avgGenerationTime.toFixed(1)}s
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Tipos Mais Gerados
              </Typography>
              {metrics.reportMetrics.topReportTypes.slice(0, 3).map((report, index) => (
                <Box key={index} mb={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">{report.type}</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={formatNumber(report.count)}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="textSecondary">
                        {report.avgTime.toFixed(1)}s
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Atividade recente */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Atividade Recente
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuário</TableCell>
                  <TableCell>Ação</TableCell>
                  <TableCell>Página</TableCell>
                  <TableCell>Tempo na Sessão</TableCell>
                  <TableCell align="right">Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.recentActivity.slice(0, 10).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell component="th" scope="row">
                      {activity.username}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.action}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{activity.page}</TableCell>
                    <TableCell>{formatTime(activity.sessionTime)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="textSecondary">
                        {formatRelativeTime(activity.timestamp)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalyticsDashboard;
