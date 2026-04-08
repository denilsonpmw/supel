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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Alert,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  TableView as TableIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { processosDataService, DadosFiltrados } from '../services/processosDataService';
import { modalidadesService } from '../services/api';
import { useCustomTheme, MODERN_COLORS } from '../contexts/ThemeContext';

interface Modalidade {
  id: number;
  sigla_modalidade: string;
  nome_modalidade: string;
}

interface TabelaProcessosProps {
  modalidade?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export const TabelaProcessos: React.FC<TabelaProcessosProps> = ({ modalidade, dataInicio, dataFim }) => {
  const [orderAsc, setOrderAsc] = useState(false);
  const theme = useTheme();
  const { mode } = useCustomTheme();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<DadosFiltrados[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroRazaoSocial, setFiltroRazaoSocial] = useState('');

  // Carregar modalidades
  useEffect(() => {
    const carregarModalidades = async () => {
      try {
        const response = await modalidadesService.list();
        const modalidadesFiltradas = response.filter((modalidade: Modalidade) =>
          !modalidade.sigla_modalidade.toLowerCase().includes('credenciamento') &&
          !modalidade.nome_modalidade.toLowerCase().includes('credenciamento')
        );
        setModalidades(modalidadesFiltradas);
      } catch (error) {
        console.error('Erro ao carregar modalidades:', error);
      }
    };
    carregarModalidades();
  }, []);

  // Envia ordenação para o backend
  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line
  }, [pagination.page, pagination.limit, modalidade, dataInicio, dataFim, filtroNumero, filtroRazaoSocial, orderAsc]);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    try {
      const response = await processosDataService.carregarDados({
        page: pagination.page + 1,
        limit: pagination.limit,
        tipo: modalidade || undefined,
        dataInicio: dataInicio ? dataInicio.toISOString().slice(0, 10) : undefined,
        dataFim: dataFim ? dataFim.toISOString().slice(0, 10) : undefined,
        numero: filtroNumero || undefined,
        razaoSocial: filtroRazaoSocial || undefined,
        orderBy: 'dataAberturaPropostas',
        orderDir: orderAsc ? 'asc' : 'desc'
      });
      setDados(response.data || []);
      setStats(response.stats);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages
      }));
    } catch (error) {
      setErro('Erro ao carregar dados de processos');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleChangePage = (event: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, limit: newLimit, page: 0 }));
  };

  const formatarData = (data: string): string => {
    try {
      // Assumindo formato dd/mm/yyyy
      const [dia, mes, ano] = data.split('/');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return data;
    }
  };

  const getChipColorForTipo = (tipo: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (tipo.toLowerCase()) {
      case 'dispensa eletrônica':
        return 'success';
      case 'pregão eletrônico':
        return 'primary';
      case 'tomada de preços':
        return 'warning';
      case 'concorrência':
        return 'error';
      default:
        return 'secondary';
    }
  };

  if (erro) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <IconButton size="small" onClick={carregarDados}>
              <RefreshIcon />
            </IconButton>
          }>
            {erro}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Cálculos dos cards usando stats globais do backend
  const participacoes = stats?.totalParticipacoes ?? 0;
  const participacoesME = stats?.participacoesME ?? 0;
  const contratacoesPJ = stats?.totalVencedores ?? 0; // CNPJs distintos vencedores
  const contratacoesME = stats?.contratacoesME ?? 0; // CNPJs distintos vencedores ME
  const contratacoesDemais = contratacoesPJ - contratacoesME; // Contratações PJ que não são ME/EPP
  const percentualParticipacoesME = stats?.percentualParticipacoesME ?? '0';
  // Percentual de contratações ME sobre total de contratações PJ
  const percentualContratacoesME = contratacoesPJ > 0 ? ((contratacoesME / contratacoesPJ) * 100).toFixed(1) : '0';

  // Função para obter o nome da modalidade
  const getModalidadeNome = () => {
    if (!modalidade) return 'Todas';
    
    const modalidadeEncontrada = modalidades.find(m => m.id === parseInt(modalidade));
    return modalidadeEncontrada ? modalidadeEncontrada.nome_modalidade : 'Todas';
  };

  // Cor de fundo dos cards (cor que seria usada pelo Credenciamento)
  const cardBackgroundColor = MODERN_COLORS[mode][3]; // Índice 3 = Red (Credenciamento)

  return (
    <Card>
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" fontWeight="bold">
              Processos Sincronizados (PCP)
            </Typography>
            <Chip 
              label={`${stats?.totalProcessosDistintos || 0} processos`}
              size="small"
              color="primary"
              sx={{ 
                fontWeight: 700,
                fontSize: '0.75rem',
                backgroundColor: theme.palette.mode === 'light' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(144, 202, 249, 0.08)',
                color: theme.palette.primary.main,
                border: `1px solid ${theme.palette.primary.main}40`
              }}
            />
          </Box>
        }
        subheader="Lista detalhada de processos capturados do Portal de Compras Públicas"
        action={
          <IconButton onClick={carregarDados} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        }
      />
      <CardContent sx={{ p: 0, position: 'relative' }}>
        {loading && !dados.length && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {loading && !!dados.length && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
        )}
        
        {(dados.length > 0 || !loading) && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '110px' }}>Número/Ano</TableCell>
                  <TableCell sx={{ width: '130px' }}>Tipo</TableCell>
                  <TableCell>Objeto</TableCell>
                  <TableCell sx={{ minWidth: '350px' }}>Vencedor (ME/EPP)</TableCell>
                  <TableCell align="right" sx={{ width: '160px' }}>Valor Negociado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dados && dados.length > 0 ? (
                  dados.map((row) => (
                    <TableRow key={`${row.idlicitacao}-${row.cnpj}`}>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                        {row.numero?.includes('/') ? row.numero : `${row.numero}/${row.ano}`}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.tipo_licitacao} 
                          size="small" 
                          variant="outlined"
                          color={getChipColorForTipo(row.tipo_licitacao)}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          lineHeight: 1.4,
                          py: 0.5
                        }}>
                          {row.objeto}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexDirection="column">
                          <Typography variant="caption" sx={{ 
                            fontWeight: row.vencedor ? 'bold' : 'normal', 
                            color: row.vencedor 
                              ? (row.declaracaome 
                                ? (theme.palette.mode === 'dark' ? 'success.light' : 'success.main') 
                                : (theme.palette.mode === 'dark' ? 'info.light' : 'info.main'))
                              : 'inherit',
                            textTransform: 'uppercase'
                          }}>
                            {row.razaosocial}
                          </Typography>
                          {row.vencedor && (
                            <Chip 
                              label={row.declaracaome ? "Vencedor (ME/EPP)" : "Vencedor (Demais)"} 
                              size="small" 
                              sx={{ 
                                height: 18, 
                                fontSize: '0.65rem', 
                                mt: 0.5,
                                fontWeight: 'bold',
                                bgcolor: row.declaracaome 
                                  ? (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'success.main') 
                                  : (theme.palette.mode === 'dark' ? 'rgba(3, 169, 244, 0.2)' : 'info.main'),
                                color: row.declaracaome 
                                  ? (theme.palette.mode === 'dark' ? '#81c784' : '#fff') 
                                  : (theme.palette.mode === 'dark' ? '#64b5f6' : '#fff'),
                                border: theme.palette.mode === 'dark' ? `1px solid ${row.declaracaome ? '#81c784' : '#64b5f6'}` : 'none'
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {row.valor_negociado ? parseFloat(row.valor_negociado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhum processo encontrado para os filtros selecionados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
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
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: mode === 'light' ? '#ffffff !important' : 'transparent',
            color: mode === 'light' ? 'rgba(0, 0, 0, 0.87) !important' : 'inherit',
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontSize: '0.8rem',
              color: mode === 'light' ? 'rgba(0, 0, 0, 0.6) !important' : 'text.secondary',
              fontWeight: 500
            },
            '.MuiTablePagination-select, .MuiTablePagination-actions .MuiIconButton-root': {
              fontWeight: 600,
              color: mode === 'light' ? 'rgba(0, 0, 0, 0.87) !important' : 'inherit'
            }
          }}
        />
      </CardContent>
    </Card>
  );
};
