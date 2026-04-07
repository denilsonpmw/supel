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
        title="Processos Sincronizados (PCP)" 
        subheader="Lista detalhada de processos capturados do Portal de Compras Públicas"
        action={
          <IconButton onClick={carregarDados} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        }
      />
      <CardContent sx={{ p: 0 }}>
        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {!loading && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Número/Ano</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Objeto</TableCell>
                  <TableCell>Abertura</TableCell>
                  <TableCell>Vencedor (ME/EPP)</TableCell>
                  <TableCell align="right">Valor Negociado</TableCell>
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
                        <Tooltip title={row.objeto}>
                          <Typography variant="body2" sx={{ 
                            maxWidth: 300, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}>
                            {row.objeto}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {row.dataabertura_date ? new Date(row.dataabertura_date).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexDirection="column">
                          <Typography variant="caption" sx={{ fontWeight: row.vencedor ? 'bold' : 'normal', color: row.vencedor ? 'success.main' : 'inherit' }}>
                            {row.razaosocial}
                          </Typography>
                          {row.vencedor && (
                            <Chip 
                              label={row.declaracaome ? "Vencedor (ME/EPP)" : "Vencedor (Demais)"} 
                              size="small" 
                              color={row.declaracaome ? "success" : "info"}
                              variant="filled"
                              sx={{ height: 16, fontSize: '0.6rem', mt: 0.5 }}
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
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
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
        />
      </CardContent>
    </Card>
  );
};
