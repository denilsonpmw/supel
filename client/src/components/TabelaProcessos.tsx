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
      setDados(response.dados);
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

  useEffect(() => {
    carregarDados();
  }, [pagination.page, pagination.limit, modalidade, dataInicio, dataFim, filtroNumero, filtroRazaoSocial]);

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
  const licitacoes = stats?.totalLicitacoes ?? 0;
  const participacoes = stats?.totalParticipacoes ?? 0;
  const participacoesME = stats?.participacoesME ?? 0;
  const vencedores = stats?.totalVencedores ?? 0;
  const percentualParticipacoesME = stats?.percentualParticipacoesME ?? '0';
  // Novo cálculo: percentual de vencedores sobre o total de participações
  const percentualVencedores = participacoes > 0 ? ((vencedores / participacoes) * 100).toFixed(1) : '0';

  // Função para obter o nome da modalidade
  const getModalidadeNome = () => {
    if (!modalidade) return 'Todas';
    
    const modalidadeEncontrada = modalidades.find(m => m.id === parseInt(modalidade));
    return modalidadeEncontrada ? modalidadeEncontrada.nome_modalidade : 'Todas';
  };

  return (
    <>
      <Box mb={2} mt={2}>
        <Typography variant="h5" fontWeight={700} align="center" color="primary">
          Análise de Licitações ME/EPP
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          Indicadores referentes a Microempresas e Empresas de Pequeno Porte
        </Typography>
        <Box mt={2} display="flex" justifyContent="center">
          <Chip 
            label={`Modalidade: ${getModalidadeNome()}`}
            size="medium"
            color="secondary"
            variant="outlined"
            sx={{ fontSize: '1rem', height: 36, px: 2 }}
          />
        </Box>
      </Box>
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Licitações" />
            <CardContent>
              <Typography variant="h3" color="primary" align="center">{licitacoes.toLocaleString('pt-BR')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Participações" />
            <CardContent>
              <Typography variant="h3" color="primary" align="center">{participacoes.toLocaleString('pt-BR')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Participações ME" />
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h3" color="primary" align="center">{participacoesME.toLocaleString('pt-BR')}</Typography>
                <Chip 
                  label={`${percentualParticipacoesME}%`} 
                  size="medium" 
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: '1.1rem', height: 38, ml: 2 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Vencedores" />
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h3" color="primary" align="center">{vencedores.toLocaleString('pt-BR')}</Typography>
                <Chip 
                  label={`${percentualVencedores}%`} 
                  size="medium" 
                  color="success"
                  variant="outlined"
                  sx={{ fontSize: '1.1rem', height: 38, ml: 2 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};
