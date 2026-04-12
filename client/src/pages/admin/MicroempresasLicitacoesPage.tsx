import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Chip,
  IconButton,
  LinearProgress,
  Container,
  Paper,
  Tooltip,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  CloudSync as CloudSyncIcon,
  DeleteSweep as DeleteSweepIcon,
  FilterAltOff as FilterAltOffIcon
} from '@mui/icons-material';
import { useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { pcpService } from '../../services/api';
import { SyncProgressModal, SyncStatus } from '../../components/SyncProgressModal';
import { processosDataService, DadosFiltrados } from '../../services/processosDataService';
import { formatServerDateBR } from '../../utils/dateUtils';

import { APP_VERSION } from '../../version';
import api from '../../services/api';
import { UnidadeGestora } from '../../types';
import PageHeader from '../../components/PageHeader';
import PageContainer from '../../components/PageContainer';

const MicroempresasLicitacoesPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const pollingInterval = useRef<any>(null);
  const [dados, setDados] = useState<DadosFiltrados[]>([]);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 25,
    total: 0
  });
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroRazaoSocial, setFiltroRazaoSocial] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroBeneficioLocal, setFiltroBeneficioLocal] = useState('');
  const [filtroUgId, setFiltroUgId] = useState('');
  const [unidadesGestoras, setUnidadesGestoras] = useState<UnidadeGestora[]>([]);
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [opcoesFiltro, setOpcoesFiltro] = useState<{
    tipos: string[];
    ugs: number[];
  }>({
    tipos: [],
    ugs: []
  });

  const carregarOpcoes = async () => {
    try {
      const [options, ugsResponse] = await Promise.all([
        processosDataService.obterOpcoesFiltro(),
        api.get('/unidades-gestoras')
      ]);
      setOpcoesFiltro(options);
      setUnidadesGestoras(ugsResponse.data || []);
    } catch (error) {
      console.error('Erro ao carregar opções de filtro:', error);
    }
  };

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const response = await processosDataService.carregarDados({
        page: pagination.page + 1,
        limit: pagination.limit,
        numero: filtroNumero || undefined,
        razaoSocial: filtroRazaoSocial || undefined,
        tipo: filtroTipo || undefined,
        beneficioLocal: filtroBeneficioLocal || undefined,
        ug_id: filtroUgId || undefined,
        dataInicio: filtroDataInicio || undefined,
        dataFim: filtroDataFim || undefined,
        orderBy: 'data_abertura_date',
        orderDir: 'DESC'
      });
      setDados(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total
      }));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filtroNumero,
    filtroRazaoSocial,
    filtroTipo,
    filtroBeneficioLocal,
    filtroUgId,
    filtroDataInicio,
    filtroDataFim
  ]);

  const handleSyncPcp = async () => {
    try {
      setIsSyncing(true);
      setShowSyncModal(true);
      setSyncStatus(null);

      await pcpService.sync([]);
      startPolling();
      toast.success('Sincronização iniciada!', { id: 'pcp-sync-start' });
    } catch (err: any) {
      console.error('Erro ao sincronizar PCP:', err);
      const msg = err.response?.data?.message || err.message || 'Erro inesperado';
      toast.error(`Falha ao iniciar: ${msg}`, { id: 'pcp-sync-start' });
      setIsSyncing(false);
      setShowSyncModal(false);
    }
  };

  const handleResetPcp = async () => {
    try {
      setLoading(true);
      await processosDataService.resetPcpData();
      toast.success('Dados do PCP removidos com sucesso!');
      setShowResetDialog(false);
      carregarDados();
    } catch (err: any) {
      console.error('Erro ao resetar dados PCP:', err);
      toast.error('Falha ao remover dados');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);
    fetchStatus();
    pollingInterval.current = setInterval(fetchStatus, 1500);
  };

  const fetchStatus = async () => {
    try {
      const status = await pcpService.getSyncStatus();
      setSyncStatus(status);

      if (!status.isSyncing && (status.status === 'completed' || status.status === 'error')) {
        stopPolling();
        setIsSyncing(false);
        if (status.status === 'completed') {
          carregarDados();
        }
      }
    } catch (err) {
      console.error('Erro ao buscar status de sincronização:', err);
    }
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    carregarOpcoes();
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  const limparFiltros = () => {
    setFiltroNumero('');
    setFiltroRazaoSocial('');
    setFiltroTipo('');
    setFiltroBeneficioLocal('');
    setFiltroUgId('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Licitações PCP (Sincronização)"
        subtitle="Visualização completa dos dados sincronizados do Portal de Compras Públicas"
      />
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Box display="flex" gap={1} alignItems="center">
          {user?.perfil === 'admin' && (
            <>
              <Tooltip title="Limpar dados PCP">
                <IconButton
                  onClick={() => setShowResetDialog(true)}
                  disabled={loading || isSyncing}
                  sx={{ color: theme.palette.error.main }}
                >
                  <DeleteSweepIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={isSyncing ? "Sincronizando..." : "Sincronizar PCP"}>
                <IconButton
                  onClick={handleSyncPcp}
                  disabled={loading || isSyncing}
                  sx={{ color: '#f9a825' }}
                >
                  {isSyncing ? <CircularProgress size={24} color="inherit" /> : <CloudSyncIcon />}
                </IconButton>
              </Tooltip>
            </>
          )}
          <Tooltip title="Recarregar Dados">
            <IconButton 
              onClick={carregarDados} 
              disabled={loading} 
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <SyncProgressModal
        show={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        status={syncStatus}
      />

      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)}>
        <DialogTitle>Limpar Dados PCP</DialogTitle>
        <DialogContent>
          <Typography>
            Esta ação removerá todos os processos coletados do PCP da base de dados local.
            Você terá que sincronizar novamente se desejar recuperar os dados. Continuar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>Cancelar</Button>
          <Button onClick={handleResetPcp} color="error" variant="contained">Limpar Tudo</Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ mb: 3, p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1', md: '1fr 2fr' }, gap: 3, mb: 3 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              Número da Licitação
            </Typography>
            <TextField
              size="small"
              placeholder="Ex: 001/2026"
              value={filtroNumero}
              onChange={(e) => setFiltroNumero(e.target.value)}
              fullWidth
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              Razão Social ou CNPJ do Vencedor
            </Typography>
            <TextField
              size="small"
              placeholder="Pesquisar por nome ou CNPJ..."
              value={filtroRazaoSocial}
              onChange={(e) => setFiltroRazaoSocial(e.target.value)}
              fullWidth
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: '180px' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              Tipo
            </Typography>
            <TextField
              select
              size="small"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="">Todos</option>
              {opcoesFiltro.tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </TextField>
          </Box>

          <Box sx={{ minWidth: '180px' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              Benefício Local (PCP)
            </Typography>
            <TextField
              select
              size="small"
              value={filtroBeneficioLocal}
              onChange={(e) => setFiltroBeneficioLocal(e.target.value)}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="">Todos</option>
              <option value="1">Sim</option>
              <option value="0">Não</option>
            </TextField>
          </Box>

          <Box sx={{ minWidth: '220px' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              U.G.
            </Typography>
            <TextField
              select
              size="small"
              value={filtroUgId}
              onChange={(e) => setFiltroUgId(e.target.value)}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="">Todas</option>
              {opcoesFiltro.ugs
                .slice()
                .sort((a, b) => {
                  const ugA = unidadesGestoras.find(u => u.id === a);
                  const ugB = unidadesGestoras.find(u => u.id === b);
                  if (ugA && ugB) return (ugA.sigla || '').localeCompare(ugB.sigla || '');
                  return a - b;
                })
                .map(u => {
                  const ug = unidadesGestoras.find(unit => unit.id === u);
                  return (
                    <option key={u} value={u}>
                      {u}{ug ? ` - ${ug.sigla}` : ''}
                    </option>
                  );
                })}
            </TextField>
          </Box>

          <Box sx={{ minWidth: '150px' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              Início Abertura
            </Typography>
            <TextField
              size="small"
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              fullWidth
            />
          </Box>

          <Box sx={{ minWidth: '150px' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              Fim Abertura
            </Typography>
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                size="small"
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                fullWidth
              />
              <Tooltip title="Limpar Filtros">
                <IconButton 
                  onClick={limparFiltros} 
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <FilterAltOffIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Card sx={{ position: 'relative', overflow: 'hidden' }}>
        {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />}
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Número</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper', minWidth: 300 }}>Objeto</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Abertura</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Situação / CD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper', minWidth: 250 }}>Vencedor / Tipo / ME</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }} align="right">Valor Negociado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>UG ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Benefício Local (API)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dados.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Chip
                        label={row.tipo_licitacao}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{row.numero}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {row.objeto}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {(() => {
                        const dateValue = row.dataAberturaIso || row.dataAberturaPropostas;
                        if (!dateValue) return '-';

                        // Extrair apenas os dígitos de data (YYYY-MM-DD)
                        const matches = dateValue.match(/(\d{4})-(\d{2})-(\d{2})/);
                        if (matches) {
                          const [_, y, m, d] = matches;
                          return `${d}/${m}/${y}`;
                        }

                        // Fallback para o utilitário
                        return formatServerDateBR(dateValue);
                      })()}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                          {row.situacao}
                        </Typography>
                        <Chip
                          label={`CD: ${row.cd_situacao}`}
                          size="small"
                          sx={{ height: 16, fontSize: '0.6rem', mt: 0.5 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column">
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: row.vencedor ? 'bold' : 'normal',
                            color: row.vencedor
                              ? (row.declaracaome
                                ? (theme.palette.mode === 'dark' ? 'success.light' : 'success.main')
                                : (theme.palette.mode === 'dark' ? 'info.light' : 'info.main'))
                              : 'inherit',
                            textTransform: 'uppercase',
                            fontSize: '0.7rem'
                          }}
                        >
                          {row.razaosocial || '-'}
                        </Typography>
                        <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                          {row.tipoempresa && (
                            <Chip label={row.tipoempresa} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                          )}
                          {row.vencedor && (
                            <Chip
                              label={row.declaracaome ? "ME/EPP" : "DEMAIS"}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.6rem',
                                fontWeight: 'bold',
                                bgcolor: row.declaracaome
                                  ? (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'success.main')
                                  : (theme.palette.mode === 'dark' ? 'rgba(3, 169, 244, 0.2)' : 'info.main'),
                                color: row.declaracaome
                                  ? (theme.palette.mode === 'dark' ? '#81c784' : '#fff')
                                  : (theme.palette.mode === 'dark' ? '#64b5f6' : '#fff'),
                              }}
                            />
                          )}
                          {row.cd_boleano_d_beneficio_local && (
                            <Chip
                              label="FORNECEDOR LOCAL"
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.6rem',
                                fontWeight: 'bold',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'warning.main',
                                color: theme.palette.mode === 'dark' ? '#ffcc80' : '#fff',
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {row.valor_negociado ? parseFloat(row.valor_negociado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label={row.ug_id} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={row.cd_boleano_d_beneficio_local === true ? 'SIM' : row.cd_boleano_d_beneficio_local === false ? 'NÃO' : 'NULO'} 
                        size="small" 
                        color={row.cd_boleano_d_beneficio_local === true ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={pagination.total}
            rowsPerPage={pagination.limit}
            page={pagination.page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Itens por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default MicroempresasLicitacoesPage;
