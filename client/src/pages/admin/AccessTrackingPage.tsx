import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Timeline as TimelineIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface AuthLog {
  id: string;
  email: string;
  event: 'login_success' | 'login_fail' | 'logout';
  ip: string;
  user_agent: string;
  created_at: string;
}

interface PageVisit {
  id: string;
  email: string;
  path: string;
  ip: string;
  user_agent: string;
  enter_at: string;
  exit_at: string | null;
  session_id: string;
  duration_seconds: number | null;
}

interface Stats {
  mostVisitedPages: Array<{
    path: string;
    visits: number;
    unique_users: number;
    avg_duration_seconds: number;
  }>;
  mostActiveUsers: Array<{
    email: string;
    page_visits: number;
    unique_pages: number;
    last_visit: string;
  }>;
}

interface Filters {
  email: string;
  from: Date | null;
  to: Date | null;
  path: string;
  event: string;
}

const AccessTrackingPage: React.FC = () => {
  const { user } = useAuth();
  
  // Verificar se o usuário é administrador
  if (user?.perfil !== 'admin') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="50vh">
        <Typography variant="h5" color="error" gutterBottom>
          Acesso Restrito
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Esta página é acessível apenas para administradores.
        </Typography>
      </Box>
    );
  }
  const [currentTab, setCurrentTab] = useState(0);
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    email: '',
    from: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h atrás
    to: new Date(),
    path: '',
    event: ''
  });

  useEffect(() => {
    loadData();
  }, [currentTab, page, rowsPerPage]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        offset: (page * rowsPerPage).toString(),
        ...(filters.email && { email: filters.email }),
        ...(filters.from && { from: filters.from.toISOString() }),
        ...(filters.to && { to: filters.to.toISOString() }),
        ...(filters.path && { path: filters.path }),
        ...(filters.event && { event: filters.event })
      });

      let endpoint = '';
      if (currentTab === 0) {
        endpoint = `/access-tracking/auth-logs?${params}`;
      } else if (currentTab === 1) {
        endpoint = `/access-tracking/page-visits?${params}`;
      }

      const response = await api.get(endpoint);
      
      if (currentTab === 0) {
        setAuthLogs(response.data.data || response.data);
        setTotalCount(response.data.pagination?.total || response.data.length);
      } else if (currentTab === 1) {
        setPageVisits(response.data.data || response.data);
        setTotalCount(response.data.pagination?.total || response.data.length);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from.toISOString());
      if (filters.to) params.append('to', filters.to.toISOString());
      
      const response = await api.get(`/access-tracking/stats?${params}`);
      setStats(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setPage(0);
  };

  const handleFilterChange = (field: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setPage(0);
    loadData();
    loadStats();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      email: '',
      from: new Date(Date.now() - 24 * 60 * 60 * 1000),
      to: new Date(),
      path: '',
      event: ''
    });
    setPage(0);
  };

  const exportData = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...(filters.email && { email: filters.email }),
        ...(filters.from && { from: filters.from.toISOString() }),
        ...(filters.to && { to: filters.to.toISOString() }),
        ...(filters.path && { path: filters.path }),
        ...(filters.event && { event: filters.event })
      });

      const endpoint = currentTab === 0 
        ? `/access-tracking/auth-logs?${params}`
        : `/access-tracking/page-visits?${params}`;

      const response = await api.get(endpoint, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentTab === 0 ? 'auth-logs.csv' : 'page-visits.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'login_success':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'login_fail':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'logout':
        return <LogoutIcon color="action" fontSize="small" />;
      default:
        return <LoginIcon color="action" fontSize="small" />;
    }
  };

  const getEventText = (event: string) => {
    switch (event) {
      case 'login_success':
        return 'Login';
      case 'login_fail':
        return 'Falha';
      case 'logout':
        return 'Logout';
      default:
        return event;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            📊 Tracking de Acesso
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Filtros">
              <IconButton onClick={() => setShowFilters(true)}>
                <FilterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Atualizar">
              <IconButton onClick={loadData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Exportar">
              <IconButton onClick={exportData}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Estatísticas */}
        {stats && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">📈 Estatísticas</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        🏆 Páginas Mais Visitadas
                      </Typography>
                      {stats.mostVisitedPages.length > 0 ? (
                        stats.mostVisitedPages.slice(0, 5).map((page, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              <strong>{page.path}</strong> - {page.visits} visitas
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {page.unique_users} usuários únicos • {formatDuration(page.avg_duration_seconds)} médio
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Nenhum dado disponível
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        👥 Usuários Mais Ativos
                      </Typography>
                      {stats.mostActiveUsers.length > 0 ? (
                        stats.mostActiveUsers.slice(0, 5).map((user, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              <strong>{user.email}</strong> - {user.page_visits} visitas
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {user.unique_pages} páginas únicas • Último acesso: {new Date(user.last_visit).toLocaleString('pt-BR')}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Nenhum dado disponível
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        <Paper sx={{ width: '100%' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab 
              label="🔐 Logs de Autenticação" 
              icon={<LoginIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="📄 Páginas Visitadas" 
              icon={<VisibilityIcon />} 
              iconPosition="start"
            />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Logs de Autenticação */}
            {currentTab === 0 && !loading && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data/Hora</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Evento</TableCell>
                      <TableCell>IP</TableCell>
                      <TableCell>User Agent</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {authLogs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{log.email}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getEventIcon(log.event)}
                            <Chip 
                              label={getEventText(log.event)}
                              color={log.event === 'login_success' ? 'success' : 
                                     log.event === 'login_fail' ? 'error' : 'default'}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{log.ip || '-'}</TableCell>
                        <TableCell>
                          <Tooltip title={log.user_agent || '-'}>
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.user_agent || '-'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Páginas Visitadas */}
            {currentTab === 1 && !loading && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Entrada</TableCell>
                      <TableCell>Saída</TableCell>
                      <TableCell>Duração</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Página</TableCell>
                      <TableCell>IP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pageVisits.map((visit) => (
                      <TableRow key={visit.id} hover>
                        <TableCell>
                          {new Date(visit.enter_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {visit.exit_at ? 
                            new Date(visit.exit_at).toLocaleString('pt-BR') : 
                            <Chip label="🟢 Ativa" color="success" size="small" />
                          }
                        </TableCell>
                        <TableCell>
                          {formatDuration(visit.duration_seconds)}
                        </TableCell>
                        <TableCell>{visit.email}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {visit.path}
                          </Typography>
                        </TableCell>
                        <TableCell>{visit.ip || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Linhas por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}–${to} de ${count !== -1 ? count : `mais que ${to}`}`
              }
            />
          </Box>
        </Paper>

        {/* Dialog de Filtros */}
        <Dialog open={showFilters} onClose={() => setShowFilters(false)} maxWidth="md" fullWidth>
          <DialogTitle>🔍 Filtros</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={filters.email}
                  onChange={(e) => handleFilterChange('email', e.target.value)}
                  placeholder="usuario@email.com"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Página"
                  value={filters.path}
                  onChange={(e) => handleFilterChange('path', e.target.value)}
                  placeholder="/dashboard"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Data Inicial"
                  value={filters.from}
                  onChange={(date) => handleFilterChange('from', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Data Final"
                  value={filters.to}
                  onChange={(date) => handleFilterChange('to', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              
              {currentTab === 0 && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Evento</InputLabel>
                    <Select
                      value={filters.event}
                      onChange={(e) => handleFilterChange('event', e.target.value)}
                      label="Evento"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="login_success">Login Sucesso</MenuItem>
                      <MenuItem value="login_fail">Login Falha</MenuItem>
                      <MenuItem value="logout">Logout</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={clearFilters}>Limpar</Button>
            <Button onClick={() => setShowFilters(false)}>Cancelar</Button>
            <Button onClick={applyFilters} variant="contained">Aplicar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AccessTrackingPage;
