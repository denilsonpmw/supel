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
  useTheme
} from '@mui/material';
import { Refresh as RefreshIcon, Search as SearchIcon, Business as BusinessIcon, CloudSync as CloudSyncIcon } from '@mui/icons-material';
import { processosDataService, DadosFiltrados } from '../../services/processosDataService';
import { formatServerDateBR } from '../../utils/dateUtils';

import { APP_VERSION } from '../../version';

const MicroempresasLicitacoesPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<DadosFiltrados[]>([]);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 25,
    total: 0
  });
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroRazaoSocial, setFiltroRazaoSocial] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('');
  const [filtroCdSituacao, setFiltroCdSituacao] = useState('');
  const [filtroUgId, setFiltroUgId] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [opcoesFiltro, setOpcoesFiltro] = useState<{
    tipos: string[];
    situacoes: string[];
    codigosSituacao: number[];
    ugs: number[];
  }>({
    tipos: [],
    situacoes: [],
    codigosSituacao: [],
    ugs: []
  });

  const carregarOpcoes = async () => {
    try {
      const options = await processosDataService.obterOpcoesFiltro();
      setOpcoesFiltro(options);
    } catch (error) {
      console.error('Erro ao carregar opções de filtro:', error);
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const response = await processosDataService.carregarDados({
        page: pagination.page + 1,
        limit: pagination.limit,
        numero: filtroNumero || undefined,
        razaoSocial: filtroRazaoSocial || undefined,
        tipo: filtroTipo || undefined,
        situacao: filtroSituacao || undefined,
        cd_situacao: filtroCdSituacao || undefined,
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
  };

  useEffect(() => {
    carregarOpcoes();
  }, []);

  useEffect(() => {
    carregarDados();
  }, [
    pagination.page, 
    pagination.limit, 
    filtroNumero, 
    filtroRazaoSocial, 
    filtroTipo, 
    filtroSituacao, 
    filtroCdSituacao, 
    filtroUgId,
    filtroDataInicio,
    filtroDataFim
  ]);

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
    setFiltroSituacao('');
    setFiltroCdSituacao('');
    setFiltroUgId('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CloudSyncIcon fontSize="large" color="primary" />
            Licitações PCP (Sincronização)
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Visualização completa dos dados sincronizados do Portal de Compras Públicas
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={limparFiltros} color="secondary" title="Limpar Filtros">
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={carregarDados} disabled={loading} color="primary" sx={{ bgcolor: 'action.hover' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

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
              Situação
            </Typography>
            <TextField
              select
              size="small"
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="">Todas</option>
              {opcoesFiltro.situacoes.map(s => <option key={s} value={s}>{s}</option>)}
            </TextField>
          </Box>

          <Box sx={{ minWidth: '120px' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              Código
            </Typography>
            <TextField
              select
              size="small"
              value={filtroCdSituacao}
              onChange={(e) => setFiltroCdSituacao(e.target.value)}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="">Todos</option>
              {opcoesFiltro.codigosSituacao.map(c => <option key={c} value={c}>{c}</option>)}
            </TextField>
          </Box>

          <Box sx={{ minWidth: '100px' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              UG ID
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
              {opcoesFiltro.ugs.map(u => <option key={u} value={u}>{u}</option>)}
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
            <TextField
              size="small"
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              fullWidth
            />
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
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {row.valor_negociado ? parseFloat(row.valor_negociado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label={row.ug_id} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
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
    </Container>
  );
};

export default MicroempresasLicitacoesPage;
