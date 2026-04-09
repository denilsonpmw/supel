import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  LabelList
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import { TabelaProcessos } from '../../components/TabelaProcessos';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { modalidadesService, indicadoresService, pcpService } from '../../services/api';
import { MODERN_COLORS } from '../../contexts/ThemeContext';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { toast } from 'react-hot-toast';
import { processosDataService } from '../../services/processosDataService';

import { useAuth } from '../../contexts/AuthContext';

// Funções utilitárias movidas para fora para evitar re-criação
const getModalidadeColor = (modalidade: string, isDarkMode: boolean, filtroModalidade?: string) => {
  const colors = isDarkMode ? MODERN_COLORS.dark : MODERN_COLORS.light;
  const modalidadeColorMap: { [key: string]: number } = {
    'Dispensa Eletrônica': 0,
    'Pregão Eletrônico': 1,
    'Concorrência': 2,
    'DE': 0,
    'PE': 1,
    'CC': 2
  };
  const colorIndex = modalidadeColorMap[modalidade] ?? modalidadeColorMap[modalidade.split(' ')[0]] ?? 0;
  let color = colors[colorIndex];
  if (filtroModalidade && modalidade !== filtroModalidade) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    color = `rgba(${r}, ${g}, ${b}, 0.4)`;
  }
  return color;
};

const MetricCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color?: string;
  subtitle?: string;
}> = ({ title, value, icon, color = 'primary', subtitle }) => (
  <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
        <Box sx={{ color: `${color}.main`, mb: 1 }} className="metric-card-icon">
          {icon}
        </Box>
        <Typography color="text.secondary" gutterBottom variant="body2">
          {title}
        </Typography>
        <Typography variant="h4" component="div" color={color} sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

interface SyncProgressModalProps {
  show: boolean;
  onClose: () => void;
  status: SyncStatus | null;
}

const SyncProgressModal: React.FC<SyncProgressModalProps> = ({ show, onClose, status }) => {
  if (!status) return null;

  const unitWeight = 100 / (status.totalUnits || 1);
  const baseProgress = (Math.max(0, status.currentUnitIndex - 1)) * unitWeight;
  const internalProgress = status.unitTotalProcesses > 0 
    ? (status.unitProcessedProcesses / status.unitTotalProcesses) * unitWeight
    : 0;
    
  const rawProgress = status.status === 'completed' ? 100 : Math.min(99.99, baseProgress + internalProgress);
  const progress = Math.round(rawProgress * 100) / 100;
  const progressFormatted = progress.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Dialog open={show} onClose={onClose} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 'bold', color: 'text.primary' }}>
        Portal de Compras Públicas
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            {status.status === 'completed' ? (
              <CheckCircleIcon sx={{ fontSize: 44, color: 'success.main', mb: 1 }} />
            ) : (
              <CircularProgress size={40} color="inherit" sx={{ mb: 1, color: '#f9a825 !important' }} />
            )}
            <Typography variant="h6" display="block" sx={{ fontWeight: 600 }}>
              {status.status === 'completed' ? 'Concluída' : 'Sincronizando...'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              UG {status.currentUnitIndex} de {status.totalUnits}
            </Typography>
          </Box>
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight="bold">
              {status.message}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">
              {progressFormatted}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              backgroundColor: 'rgba(249, 168, 37, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#f9a825'
              }
            }} 
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {status.status === 'completed' ? `${status.syncedCount} novos` : `${status.unitProcessedProcesses}/${status.unitTotalProcesses} na unidade`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {status.skippedCount} já atualizados
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={onClose} disabled={status.isSyncing} variant="contained" color="primary">
          {status.isSyncing ? 'Sincronizando...' : 'Fechar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Interfaces para os dados das métricas
interface TempoMedioData {
  modalidade: string;
  nome_modalidade: string;
  tempoMedio: number;
  totalProcessos: number;
  totalDias: number;
}

interface EficaciaData {
  modalidade: string;
  nome_modalidade: string;
  finalizados: number;
  semSucesso: number;
  total: number;
  totalDias: number;
  taxaSucesso: number;
}

interface Modalidade {
  id: number;
  sigla_modalidade: string;
  nome_modalidade: string;
}

interface FiltrosState {
  dataInicio: Date;
  dataFim: Date;
  colunaDataInicio: string;
  colunaDataFim: string;
  modalidadeId: number | '';
}

interface IndicadoresData {
  tempoMedio: TempoMedioData[];
  eficacia: EficaciaData[];
  resumoGeral: {
    totalProcessos: number;
    tempoMedioGeral: number;
    taxaSucessoGeral: number;
  };
}

interface StatsPcp {
  totalVencedores: number;
  vencedoresMe: number;
  vencedoresDemais: number;
  percentualMe: string;
  dataAtualizacao: string;
}

interface SyncStatus {
  isSyncing: boolean;
  status: 'idle' | 'running' | 'completed' | 'error';
  totalUnits: number;
  currentUnitIndex: number;
  currentUnitName: string;
  totalProcesses: number;
  processedProcesses: number;
  syncedCount: number;
  skippedCount: number;
  unitTotalProcesses: number;
  unitProcessedProcesses: number;
  errors: string[];
  startTime: string | null;
  endTime: string | null;
  message: string;
}

// Opções de colunas de data início
const COLUNAS_DATA_INICIO = [
  { value: 'data_entrada', label: 'Data de Entrada' },
  { value: 'data_sessao', label: 'Data da Sessão' }
];

// Opções de colunas de data fim
const COLUNAS_DATA_FIM = [
  { value: 'data_situacao', label: 'Data da Situação' },
  { value: 'data_tce_2', label: 'Data da Conclusão' }
];

// Cores para os gráficos
const CORES = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'];

export default function IndicadoresGerenciaisPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const pollingInterval = useRef<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<IndicadoresData | null>(null);
  const [dadosTabela, setDadosTabela] = useState<IndicadoresData | null>(null);
  const [statsPcp, setStatsPcp] = useState<StatsPcp | null>(null);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [dialogPrint, setDialogPrint] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>({
    dataInicio: new Date(new Date().getFullYear(), 0, 1), // Primeiro dia do ano atual
    dataFim: new Date(), // Data atual
    colunaDataInicio: 'data_sessao', // padrão Data da Sessão
    colunaDataFim: 'data_tce_2',     // padrão Data Conclusão
    modalidadeId: ''
  });

  const handleCloseSyncModal = () => {
    setShowSyncModal(false);
  };

  // Carregar modalidades
  useEffect(() => {
    const carregarModalidades = async () => {
      try {
        const response = await modalidadesService.list();
        // Filtrar modalidades excluindo credenciamento
    const modalidadesFiltradas = response.filter((modalidade: { sigla_modalidade: string; nome_modalidade: string }) =>
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

  // Simular dados (substituir por chamada real à API)
  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro(null);
    
    try {
      // Carregar dados para gráficos (com filtro se aplicado)
      const responseGraficos = await indicadoresService.getIndicadores({
        dataInicio: format(filtros.dataInicio, 'yyyy-MM-dd'),
        dataFim: format(filtros.dataFim, 'yyyy-MM-dd'),
        colunaDataInicio: filtros.colunaDataInicio,
        colunaDataFim: filtros.colunaDataFim,
        modalidadeId: filtros.modalidadeId || undefined
      });
      
      // Carregar dados para tabela (SEMPRE sem filtro de modalidade)
      const responseTabela = await indicadoresService.getIndicadores({
        dataInicio: format(filtros.dataInicio, 'yyyy-MM-dd'),
        dataFim: format(filtros.dataFim, 'yyyy-MM-dd'),
        colunaDataInicio: filtros.colunaDataInicio,
        colunaDataFim: filtros.colunaDataFim
        // Sem modalidadeId para sempre carregar todas as modalidades
      });
      
      // Carregar estatísticas PCP ME/EPP
      const responseStats = await pcpService.getStats({
        dataInicio: format(filtros.dataInicio, 'yyyy-MM-dd'),
        dataFim: format(filtros.dataFim, 'yyyy-MM-dd'),
        tipo: filtros.modalidadeId || undefined
      });
      
      setDados(responseGraficos);
      setDadosTabela(responseTabela);
      setStatsPcp(responseStats);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Sincronizar PCP com monitoramento em tempo real
  const handleSyncPcp = async () => {
    try {
      setIsSyncing(true);
      setShowSyncModal(true);
      setSyncStatus(null);
      
      const result = await pcpService.sync([]);
      
      // Iniciar polling para obter status
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
      carregarDados(); // Recarregar para zerar os indicadores
    } catch (err: any) {
      console.error('Erro ao resetar dados PCP:', err);
      toast.error('Falha ao remover dados');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);
    
    // Polling imediato
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
          carregarDados(); // Recarregar indicadores ao finalizar com sucesso
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

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => stopPolling();
  }, []);

  // Obter nome da modalidade filtrada
  const modalidadeFiltrada = filtros.modalidadeId 
    ? modalidades.find(m => m.id === filtros.modalidadeId)?.nome_modalidade 
    : undefined;

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleAplicarFiltros = () => {
    carregarDados();
  };

  const handleImprimir = () => {
    // Capturar o conteúdo atual da página antes de abrir o modal
    setTimeout(() => {
      setDialogPrint(true);
    }, 100);
  };

  const handleImprimirModal = () => {
    // Verificar se há dados antes de imprimir
    if (!dados || !dadosTabela) {
      alert('Erro: Nenhum dado disponível para impressão');
      return;
    }

    // Criar uma nova janela para impressão usando a mesma estrutura dos relatórios
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Erro: Não foi possível abrir a janela de impressão');
      return;
    }

    // Captura os SVGs dos gráficos
    const svgTempoMedio = document.querySelector('.print-content-modal .grafico-tempo-medio svg');
    const svgEficacia = document.querySelector('.print-content-modal .grafico-eficacia svg');
    const svgTempoMedioStr = svgTempoMedio ? svgTempoMedio.outerHTML : '';
    const svgEficaciaStr = svgEficacia ? svgEficacia.outerHTML : '';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Indicadores Gerenciais - SUPEL</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #1976d2;
              padding-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
              margin-bottom: 10px;
            }
            .date-info {
              font-size: 12px;
              color: #666;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 15px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .metric-card {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              background: #f9f9f9;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 8px;
            }
            .metric-label {
              font-size: 14px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #1976d2;
              color: white;
              font-weight: bold;
              padding: 12px;
              text-align: left;
              border: 1px solid #ddd;
            }
            td {
              padding: 12px;
              border: 1px solid #ddd;
            }
            .numeric {
              text-align: right;
            }
            .center {
              text-align: center;
            }
            .chip {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              color: white;
            }
            .chip-success {
              background-color: #4caf50;
            }
            .chip-warning {
              background-color: #ff9800;
            }
            .chip-error {
              background-color: #f44336;
            }
            .modalidade-filtrada {
              font-weight: bold;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Indicadores Gerenciais</div>
            <div class="subtitle">Sistema de Acompanhamento de Processos Licitatórios - SUPEL</div>
            <div class="date-info">
              Gerado em: ${new Date().toLocaleString('pt-BR')}<br>
              Período: ${format(filtros.dataInicio, 'dd/MM/yyyy')} a ${format(filtros.dataFim, 'dd/MM/yyyy')}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Métricas Principais</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${dadosTabela.tempoMedio.length > 0 ? (dadosTabela.tempoMedio.reduce((acc, item) => acc + item.tempoMedio, 0) / dadosTabela.tempoMedio.length).toFixed(1) : '0'} dias</div>
                <div class="metric-label">Tempo Médio Geral</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${dadosTabela.eficacia.reduce((acc, item) => acc + item.total, 0)}</div>
                <div class="metric-label">Total de Processos</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${dadosTabela.eficacia.length > 0 ? ((dadosTabela.eficacia.reduce((acc, item) => acc + item.finalizados, 0) / dadosTabela.eficacia.reduce((acc, item) => acc + item.total, 0)) * 100).toFixed(1) : '0'}%</div>
                <div class="metric-label">Taxa de Eficácia Geral</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detalhamento por Modalidade</div>
            <table>
              <thead>
                <tr>
                  <th>Modalidade</th>
                  <th class="center">Total Processos</th>
                  <th class="center">Homologado</th>
                  <th class="center">Deserto/Fracassado</th>
                  <th class="center">Taxa Sucesso</th>
                  <th class="center">Total de Dias</th>
                  <th class="center">Tempo Médio</th>
                </tr>
              </thead>
              <tbody>
                ${dadosTabela.eficacia.map(item => {
                  const tempoItem = dadosTabela.tempoMedio.find(t => t.modalidade === item.modalidade);
                  const chipClass = item.taxaSucesso >= 70 ? 'chip-success' : item.taxaSucesso > 30 ? 'chip-warning' : 'chip-error';
                  const isModalidadeFiltrada = filtros.modalidadeId && 
                    modalidades.find(m => m.id === filtros.modalidadeId)?.sigla_modalidade === item.modalidade;
                  const modalidadeClass = isModalidadeFiltrada ? 'modalidade-filtrada' : '';
                  return `
                    <tr>
                      <td class="${modalidadeClass}">${item.modalidade}</td>
                      <td class="center ${modalidadeClass}">${item.total}</td>
                      <td class="center ${modalidadeClass}">${item.finalizados}</td>
                      <td class="center ${modalidadeClass}">${item.semSucesso}</td>
                      <td class="center"><span class="chip ${chipClass}">${item.taxaSucesso.toFixed(1)}%</span></td>
                      <td class="center ${modalidadeClass}">${item.totalDias.toLocaleString()} dias</td>
                      <td class="center ${modalidadeClass}">${tempoItem ? `${tempoItem.tempoMedio} dias` : 'N/A'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Gráficos</div>
            <div>
              <h4>Tempo Médio por Modalidade</h4>
              <div>${svgTempoMedioStr}</div>
            </div>
            <div style="margin-top: 30px;">
              <h4>Índice de Eficácia por Modalidade</h4>
              <div>${svgEficaciaStr}</div>
            </div>
          </div>
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
  };


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box p={3} sx={{ bgcolor: 'background.default', minHeight: '100vh' }} className="main-content">
        <SyncProgressModal 
          show={showSyncModal} 
          onClose={handleCloseSyncModal} 
          status={syncStatus} 
        />
        {/* Cabeçalho */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <AssessmentIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight={600}>
              Indicadores Gerenciais
            </Typography>
          </Box>
          {user?.perfil === 'admin' && (
            <Box display="flex" gap={1}>
              <Tooltip title="Limpar todos os dados sincronizados do PCP para uma nova carga">
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => setShowResetDialog(true)}
                  disabled={isSyncing || loading}
                  className="no-print"
                  sx={{ 
                    borderRadius: '30px',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    px: 2,
                    py: 1,
                    boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)',
                    '&:hover': {
                      backgroundColor: theme.palette.error.dark,
                      boxShadow: '0 4px 12px rgba(211, 47, 47, 0.4)'
                    }
                  }}
                >
                  Limpar Dados PCP
                </Button>
              </Tooltip>
              <Tooltip title="Sincronizar todos os processos do Portal de Compras Públicas">
                <Button
                  variant="contained"
                  startIcon={isSyncing ? <CircularProgress size={20} color="inherit" /> : <CloudSyncIcon />}
                  onClick={handleSyncPcp}
                  disabled={isSyncing || loading}
                  className="no-print"
                  sx={{ 
                    borderRadius: '30px',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    px: 4,
                    py: 1,
                    backgroundColor: '#f9a825',
                    color: '#000',
                    '&:hover': {
                      backgroundColor: '#f57f17',
                      boxShadow: '0 4px 12px rgba(249, 168, 37, 0.4)'
                    },
                    '& .MuiButton-startIcon': {
                      marginRight: '12px'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar PCP'}
                </Button>
              </Tooltip>
            </Box>
          )}
          <Box display="flex" gap={1}>
            <Tooltip title="Imprimir página">
              <IconButton 
                color="primary"
                className="no-print"
                disabled
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Recarregar dados">
              <IconButton 
                onClick={carregarDados} 
                disabled={loading}
                color="primary"
                className="no-print"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 3 }} className="no-print">
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Data Início"
                value={filtros.dataInicio}
                onChange={(date) => date && setFiltros(prev => ({ ...prev, dataInicio: date }))}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Data Fim"
                value={filtros.dataFim}
                onChange={(date) => date && setFiltros(prev => ({ ...prev, dataFim: date }))}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Modalidade</InputLabel>
                <Select
                  value={filtros.modalidadeId}
                  onChange={(e) => setFiltros(prev => ({ ...prev, modalidadeId: e.target.value as number | '' }))}
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
            <Grid item xs={12} sm={6} md={2}>
              <FormControl size="small" fullWidth disabled>
                <InputLabel>Coluna Data Início</InputLabel>
                <Select
                  value={filtros.colunaDataInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, colunaDataInicio: e.target.value }))}
                  label="Coluna Data Início"
                >
                  {COLUNAS_DATA_INICIO.map(col => (
                    <MenuItem key={col.value} value={col.value}>
                      {col.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl size="small" fullWidth disabled>
                <InputLabel>Coluna Data Fim</InputLabel>
                <Select
                  value={filtros.colunaDataFim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, colunaDataFim: e.target.value }))}
                  label="Coluna Data Fim"
                >
                  {COLUNAS_DATA_FIM.map(col => (
                    <MenuItem key={col.value} value={col.value}>
                      {col.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                onClick={() => setFiltros({ dataInicio: new Date(new Date().getFullYear(), 0, 1), dataFim: new Date(), colunaDataInicio: 'data_sessao', colunaDataFim: 'data_tce_2', modalidadeId: '' })}
                disabled={loading}
                size="large"
                sx={{ minWidth: 140, whiteSpace: 'nowrap' }}
              >
                Limpar filtros
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Loading e Erro */}
        {loading && !dados && (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress size={60} />
          </Box>
        )}

        {loading && dados && (
          <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 1100, mt: -2, mb: 2 }}>
            <LinearProgress color="primary" />
            <Typography variant="caption" sx={{ ml: 1, display: 'block', textAlign: 'center', color: 'primary.main' }}>
              Atualizando indicadores...
            </Typography>
          </Box>
        )}

        {erro && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {erro}
          </Alert>
        )}

        {/* Dados */}
        {dados && dadosTabela && (
          <div className="print-content">
            {/* Cards de Resumo */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={4}>
                <MetricCard
                  title="Total de Processos"
                  value={dados.resumoGeral.totalProcessos}
                  icon={<AssessmentIcon sx={{ fontSize: 40 }} />}
                  subtitle="Processos finalizados no período"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <MetricCard
                  title="Tempo Médio Geral"
                  value={`${dados.resumoGeral.tempoMedioGeral} dias`}
                  icon={<SpeedIcon sx={{ fontSize: 40 }} />}
                  color="warning"
                  subtitle="Média geral de todos os processos"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <MetricCard
                  title="Taxa de Sucesso Geral"
                  value={`${dados.resumoGeral.taxaSucessoGeral.toFixed(1)}%`}
                  icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
                  color="success"
                  subtitle="Processos homologados"
                />
              </Grid>
            </Grid>

            {/* Detalhamento de Processos */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Detalhamento por Modalidade"
                    subheader="Quantidade de processos finalizados e dados detalhados"
                  />
                  <CardContent>
                    <Box sx={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${theme.palette.divider}` }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: theme.palette.text.primary }}>Modalidade</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>Total Processos</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>Homologado</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>Deserto/Fracassado</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>Taxa Sucesso</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>Total de Dias</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>Tempo Médio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dadosTabela.eficacia.map((item, index) => {
                            const tempoItem = dadosTabela.tempoMedio.find(t => t.modalidade === item.modalidade);
                            const isModalidadeFiltrada = filtros.modalidadeId && 
                              modalidades.find(m => m.id === filtros.modalidadeId)?.sigla_modalidade === item.modalidade;
                            return (
                              <tr key={item.modalidade} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                                <td style={{ 
                                  padding: '12px', 
                                  fontWeight: isModalidadeFiltrada ? 'bold' : '500', 
                                  color: theme.palette.text.primary 
                                }}>
                                  {item.modalidade}
                                </td>
                                <td style={{ 
                                  padding: '12px', 
                                  textAlign: 'center', 
                                  color: theme.palette.text.primary,
                                  fontWeight: isModalidadeFiltrada ? 'bold' : 'normal'
                                }}>
                                  {item.total}
                                </td>
                                <td style={{ 
                                  padding: '12px', 
                                  textAlign: 'center', 
                                  color: theme.palette.success.main,
                                  fontWeight: isModalidadeFiltrada ? 'bold' : 'normal'
                                }}>
                                  {item.finalizados}
                                </td>
                                <td style={{ 
                                  padding: '12px', 
                                  textAlign: 'center', 
                                  color: theme.palette.error.main,
                                  fontWeight: isModalidadeFiltrada ? 'bold' : 'normal'
                                }}>
                                  {item.semSucesso}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <Chip 
                                    label={`${item.taxaSucesso.toFixed(1)}%`}
                                    color={item.taxaSucesso >= 70 ? 'success' : item.taxaSucesso > 30 ? 'warning' : 'error'}
                                    size="small"
                                    sx={{
                                      backgroundColor: item.taxaSucesso >= 70 
                                        ? theme.palette.success.main 
                                        : item.taxaSucesso > 30 
                                        ? theme.palette.warning.main 
                                        : theme.palette.error.main,
                                      color: item.taxaSucesso >= 70 
                                        ? theme.palette.success.contrastText 
                                        : item.taxaSucesso > 30 
                                        ? theme.palette.warning.contrastText 
                                        : theme.palette.error.contrastText,
                                      '&:hover': {
                                        backgroundColor: item.taxaSucesso >= 70 
                                          ? theme.palette.success.dark 
                                          : item.taxaSucesso > 30 
                                          ? theme.palette.warning.dark 
                                          : theme.palette.error.dark,
                                      }
                                    }}
                                  />
                                </td>
                                <td style={{ 
                                  padding: '12px', 
                                  textAlign: 'center', 
                                  fontWeight: isModalidadeFiltrada ? 'bold' : '500', 
                                  color: theme.palette.text.primary 
                                }}>
                                  {item.totalDias.toLocaleString()} dias
                                </td>
                                <td style={{ 
                                  padding: '12px', 
                                  textAlign: 'center', 
                                  color: theme.palette.text.primary,
                                  fontWeight: isModalidadeFiltrada ? 'bold' : 'normal'
                                }}>
                                  {tempoItem ? `${tempoItem.tempoMedio} dias` : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3}>
              {/* Tempo Médio por Modalidade */}
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardHeader
                    title="Tempo Médio por Modalidade"
                    subheader="Tempo médio em dias para finalização dos processos"
                    action={
                      <TrendingUpIcon color="primary" />
                    }
                  />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={dadosTabela?.tempoMedio || []}
                        style={{ backgroundColor: theme.palette.background.paper }}
                      >
                        <XAxis 
                          dataKey="nome_modalidade" 
                          textAnchor="middle"
                          height={60}
                          fontSize={14}
                          stroke={theme.palette.text.primary}
                          tick={{ 
                            fill: theme.palette.text.primary,
                            fontWeight: 'bold'
                          }}
                        />
                        <YAxis 
                          domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]}
                          hide
                        />
                        <RechartsTooltip 
                          formatter={(value, name) => [
                            `${value} dias`,
                            'Tempo Médio'
                          ]}
                          labelFormatter={(label) => `Modalidade: ${label}`}
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400]}`,
                            borderRadius: '8px',
                            color: theme.palette.text.primary,
                          }}
                          itemStyle={{
                            color: theme.palette.text.primary,
                          }}
                          cursor={{fill: 'transparent'}}
                        />
                        <Bar 
                          dataKey="tempoMedio" 
                          fill={theme.palette.primary.main}
                          name="Tempo Médio (dias)"
                          radius={[4, 4, 0, 0]}
                          isAnimationActive={false}
                        >
                          {dadosTabela?.tempoMedio.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getModalidadeColor(entry.nome_modalidade, theme.palette.mode === 'dark', modalidadeFiltrada)} 
                            />
                          )) || []}
                          <LabelList 
                            dataKey="tempoMedio" 
                            position="top" 
                            formatter={(value) => `${value}d`}
                            style={{ 
                              fontSize: '12px', 
                              fill: theme.palette.text.primary 
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Índice de Eficácia */}
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardHeader
                    title="Índice de Eficácia por Modalidade"
                    subheader="Taxa de sucesso (%) dos processos finalizados"
                    action={<CheckCircleIcon color="success" />}
                  />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={dadosTabela?.eficacia || []}
                        style={{ backgroundColor: theme.palette.background.paper }}
                      >
                        <XAxis 
                          dataKey="nome_modalidade" 
                          textAnchor="middle"
                          height={60}
                          fontSize={14}
                          stroke={theme.palette.text.primary}
                          tick={{ 
                            fill: theme.palette.text.primary,
                            fontWeight: 'bold'
                          }}
                        />
                        <YAxis 
                          domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]}
                          hide
                        />
                        <RechartsTooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div style={{
                                  backgroundColor: theme.palette.background.paper,
                                  border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400]}`,
                                  borderRadius: '8px',
                                  padding: '12px',
                                  color: theme.palette.text.primary,
                                  fontSize: '14px'
                                }}>
                                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                    Modalidade: {label}
                                  </div>
                                  <div style={{ color: theme.palette.success.main, marginBottom: '4px' }}>
                                    Homologado: {data.finalizados}
                                  </div>
                                  <div style={{ color: theme.palette.error.main, marginBottom: '4px' }}>
                                    Fracassado/Deserto: {data.semSucesso}
                                  </div>
                                  <div style={{ fontWeight: 'bold' }}>
                                    Taxa de Sucesso: {data.taxaSucesso.toFixed(1)}%
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                          cursor={{fill: 'transparent'}}
                        />
                        <Bar 
                          dataKey="taxaSucesso" 
                          fill={theme.palette.success.main}
                          name="Taxa de Sucesso (%)"
                          radius={[4, 4, 0, 0]}
                          isAnimationActive={false}
                        >
                          {dadosTabela?.eficacia.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getModalidadeColor(entry.nome_modalidade, theme.palette.mode === 'dark', modalidadeFiltrada)} 
                            />
                          )) || []}
                          <LabelList 
                            dataKey="taxaSucesso" 
                            position="top" 
                            formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : ''}
                            style={{ 
                              fontSize: '12px', 
                              fill: theme.palette.text.primary 
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Análise de Licitações ME/EPP */}
            <Box sx={{ mt: 6, mb: 4, textAlign: 'center' }}>
              <Typography 
                variant="h5" 
                fontWeight={700} 
                sx={{ color: theme.palette.primary.main, mb: 0.5 }}
              >
                Análise de Licitações ME/EPP
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 2 }}
              >
                Indicadores referentes a Microempresas e Empresas de Pequeno Porte
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Chip 
                  label={`Modalidade: ${modalidadeFiltrada || 'Todas'}`}
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                    fontWeight: 600,
                    px: 1
                  }}
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3.5}>
                  <Card sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8faff',
                    borderRadius: 2,
                    borderLeft: `4px solid ${theme.palette.primary.main}`
                  }}>
                    <CardContent sx={{ py: 3 }}>
                      <Typography color="text.secondary" variant="body2" fontWeight={600} gutterBottom>
                        Contratações PJ
                      </Typography>
                      <Typography variant="h3" fontWeight={700} color="primary">
                        {statsPcp?.totalVencedores || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3.5}>
                  <Card sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8faff',
                    borderRadius: 2,
                    borderLeft: `4px solid ${theme.palette.primary.main}`
                  }}>
                    <CardContent sx={{ py: 3 }}>
                      <Typography color="text.secondary" variant="body2" fontWeight={600} gutterBottom>
                        Contratações DEMAIS
                      </Typography>
                      <Typography variant="h3" fontWeight={700} color="primary">
                        {statsPcp?.vencedoresDemais || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3.5}>
                  <Card sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8faff',
                    borderRadius: 2,
                    borderLeft: `4px solid ${theme.palette.primary.main}`
                  }}>
                    <CardContent sx={{ py: 3 }}>
                      <Typography color="text.secondary" variant="body2" fontWeight={600} gutterBottom>
                        Contratações ME/EPP
                      </Typography>
                      <Typography variant="h3" fontWeight={700} color="primary">
                        {statsPcp?.vencedoresMe || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={1.5}>
                  <Card sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8faff',
                    borderRadius: 2,
                    borderLeft: `4px solid ${theme.palette.success.main}`,
                    height: '100%'
                  }}>
                    <CardContent sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center',
                      textAlign: 'center',
                      py: 2
                    }}>
                      <Typography color="text.secondary" variant="caption" fontWeight={700} sx={{ display: 'block', lineHeight: 1.2, mb: 0.5 }}>
                        ME/EPP vs DEMAIS
                      </Typography>
                      <Typography variant="h5" fontWeight={800} sx={{ color: theme.palette.success.main }}>
                        {statsPcp?.percentualMe || 0}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Tabela de Processos Coletados */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <TabelaProcessos 
                  modalidade={filtros.modalidadeId ? String(filtros.modalidadeId) : undefined}
                  dataInicio={filtros.dataInicio}
                  dataFim={filtros.dataFim}
                />
              </Grid>
            </Grid>
          </div>
        )}
      </Box>

      {/* Modal de Impressão */}
      <Dialog
        open={dialogPrint}
        onClose={() => setDialogPrint(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              Indicadores Gerenciais - Visualização de Impressão
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Período: {format(filtros.dataInicio, 'dd/MM/yyyy', { locale: ptBR })} a {format(filtros.dataFim, 'dd/MM/yyyy', { locale: ptBR })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={handleImprimirModal}
            >
              Imprimir
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setDialogPrint(false)}
            >
              Fechar
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {dados && dadosTabela && (
            <Box p={3} className="print-content-modal" sx={{ backgroundColor: 'background.default' }}>
              {/* Cópia exata do conteúdo da página principal */}
              
              {/* Cards de Resumo */}
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard
                    title="Total de Processos"
                    value={dados.resumoGeral.totalProcessos}
                    icon={<AssessmentIcon />}
                    color="primary"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard
                    title="Tempo Médio Geral"
                    value={`${dados.resumoGeral.tempoMedioGeral} dias`}
                    icon={<SpeedIcon />}
                    color="warning"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard
                    title="Taxa de Sucesso Geral"
                    value={`${dados.resumoGeral.taxaSucessoGeral}%`}
                    icon={<CheckCircleIcon />}
                    color="success"
                  />
                </Grid>
              </Grid>

              {/* Detalhamento por Modalidade - TABELA COMO NA PÁGINA ORIGINAL */}
              <Card sx={{ mb: 4 }}>
                <CardHeader
                  title="Detalhamento por Modalidade"
                  subheader="Análise detalhada dos indicadores por modalidade de licitação"
                />
                <CardContent>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                          <th style={{ 
                            padding: '12px', 
                            textAlign: 'left', 
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                            fontWeight: 'bold'
                          }}>
                            Modalidade
                          </th>
                          <th style={{ 
                            padding: '12px', 
                            textAlign: 'center', 
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                            fontWeight: 'bold'
                          }}>
                            Tempo Médio (dias)
                          </th>
                          <th style={{ 
                            padding: '12px', 
                            textAlign: 'center', 
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                            fontWeight: 'bold'
                          }}>
                            Total de Processos
                          </th>
                          <th style={{ 
                            padding: '12px', 
                            textAlign: 'center', 
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                            fontWeight: 'bold'
                          }}>
                            Taxa de Sucesso
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dadosTabela?.tempoMedio.map((item, index) => {
                          const eficaciaItem = dadosTabela.eficacia.find(e => e.modalidade === item.modalidade);
                          const taxaSucesso = eficaciaItem?.taxaSucesso || 0;
                          
                          const getChipColor = (taxa: number): 'success' | 'warning' | 'error' => {
                            if (taxa >= 70) return 'success';
                            if (taxa > 30) return 'warning';
                            return 'error';
                          };

                          // Verificar se esta é a modalidade filtrada para destacar
                          const isModalidadeFiltrada = filtros.modalidadeId && 
                            modalidades.find(m => m.id === filtros.modalidadeId)?.sigla_modalidade === item.modalidade;

                          return (
                            <tr 
                              key={item.modalidade}
                              style={{
                                backgroundColor: isModalidadeFiltrada 
                                  ? (theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.1)' : 'rgba(25, 118, 210, 0.08)')
                                  : 'transparent'
                              }}
                            >
                              <td style={{ 
                                padding: '12px', 
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                color: theme.palette.text.primary
                              }}>
                                <Box>
                                  <Typography 
                                    variant="body2" 
                                    fontWeight={isModalidadeFiltrada ? "bold" : "medium"}
                                  >
                                    {item.nome_modalidade}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    fontWeight={isModalidadeFiltrada ? "bold" : "normal"}
                                  >
                                    {item.modalidade}
                                  </Typography>
                                </Box>
                              </td>
                              <td style={{ 
                                padding: '12px', 
                                textAlign: 'center', 
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                color: theme.palette.text.primary,
                                fontWeight: isModalidadeFiltrada ? 'bold' : 'normal'
                              }}>
                                {item.tempoMedio}
                              </td>
                              <td style={{ 
                                padding: '12px', 
                                textAlign: 'center', 
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                color: theme.palette.text.primary,
                                fontWeight: isModalidadeFiltrada ? 'bold' : 'normal'
                              }}>
                                {item.totalProcessos}
                              </td>
                              <td style={{ 
                                padding: '12px', 
                                textAlign: 'center', 
                                borderBottom: `1px solid ${theme.palette.divider}`
                              }}>
                                <Chip
                                  label={`${taxaSucesso.toFixed(1)}%`}
                                  color={getChipColor(taxaSucesso)}
                                  size="small"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Box>
                </CardContent>
              </Card>

              {/* Gráficos - EXATAMENTE COMO NA PÁGINA ORIGINAL */}
              <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                  <Card>
                    <CardHeader
                      title="Tempo Médio por Modalidade"
                      subheader="Tempo médio em dias para finalização dos processos"
                      action={
                        <TrendingUpIcon color="primary" />
                      }
                    />
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={dadosTabela?.tempoMedio || []}
                          style={{ backgroundColor: theme.palette.background.paper }}
                        >
                          <XAxis 
                            dataKey="nome_modalidade" 
                            textAnchor="middle"
                            height={60}
                            fontSize={14}
                            stroke={theme.palette.text.primary}
                            tick={{ 
                              fill: theme.palette.text.primary,
                              fontWeight: 'bold'
                            }}
                          />
                          <YAxis 
                            domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]}
                            hide
                          />
                          <RechartsTooltip 
                            formatter={(value, name) => [
                              `${value} dias`,
                              'Tempo Médio'
                            ]}
                            labelFormatter={(label) => `Modalidade: ${label}`}
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400]}`,
                              borderRadius: '8px',
                              color: theme.palette.text.primary,
                            }}
                            itemStyle={{
                              color: theme.palette.text.primary,
                            }}
                            cursor={{fill: 'transparent'}}
                          />
                          <Bar 
                            dataKey="tempoMedio" 
                            fill={theme.palette.primary.main}
                            name="Tempo Médio"
                            isAnimationActive={false}
                          >
                            {dadosTabela?.tempoMedio.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getModalidadeColor(entry.nome_modalidade, theme.palette.mode === 'dark', modalidadeFiltrada)} 
                              />
                            )) || []}
                            <LabelList 
                              dataKey="tempoMedio" 
                              position="top" 
                              style={{ 
                                fill: theme.palette.text.primary,
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                              formatter={(value) => `${value}d`}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} lg={6}>
                  <Card>
                    <CardHeader
                      title="Índice de Eficácia por Modalidade"
                      subheader="Taxa de sucesso (%) dos processos finalizados"
                      action={<CheckCircleIcon color="success" />}
                    />
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={dadosTabela?.eficacia || []}
                          style={{ backgroundColor: theme.palette.background.paper }}
                        >
                          <XAxis 
                            dataKey="nome_modalidade" 
                            textAnchor="middle"
                            height={60}
                            fontSize={14}
                            stroke={theme.palette.text.primary}
                            tick={{ 
                              fill: theme.palette.text.primary,
                              fontWeight: 'bold'
                            }}
                          />
                          <YAxis 
                            domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]}
                            hide
                          />
                          <RechartsTooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div style={{
                                    backgroundColor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400]}`,
                                    borderRadius: '8px',
                                    padding: '12px',
                                    color: theme.palette.text.primary,
                                    fontSize: '14px'
                                  }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                      Modalidade: {label}
                                    </div>
                                    <div style={{ color: theme.palette.success.main, marginBottom: '4px' }}>
                                      Homologado: {data.finalizados}
                                    </div>
                                    <div style={{ color: theme.palette.error.main, marginBottom: '4px' }}>
                                      Fracassado/Deserto: {data.semSucesso}
                                    </div>
                                    <div style={{ fontWeight: 'bold' }}>
                                      Taxa de Sucesso: {data.taxaSucesso.toFixed(1)}%
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                            cursor={{fill: 'transparent'}}
                          />
                          <Bar 
                            dataKey="taxaSucesso" 
                            fill={theme.palette.success.main}
                            name="Taxa de Sucesso"
                            isAnimationActive={false}
                          >
                            {dadosTabela?.eficacia.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getModalidadeColor(entry.nome_modalidade, theme.palette.mode === 'dark', modalidadeFiltrada)} 
                              />
                            )) || []}
                            <LabelList 
                              dataKey="taxaSucesso" 
                              position="top" 
                              style={{ 
                                fill: theme.palette.text.primary,
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                              formatter={(value) => `${value}%`}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      {/* Modal de Confirmação de Reset */}
      <Dialog
        open={showResetDialog}
        onClose={() => !loading && setShowResetDialog(false)}
      >
        <DialogTitle>Limpar Dados Sincronizados?</DialogTitle>
        <DialogContent>
          <Typography>
            Esta ação removerá todos os processos coletados do PCP da base de dados local. 
            Você precisará realizar uma nova sincronização para visualizar os indicadores novamente.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleResetPcp} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteSweepIcon />}
          >
            {loading ? 'Limpando...' : 'Confirmar e Limpar'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
