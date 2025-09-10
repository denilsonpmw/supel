import React, { useState, useEffect, useCallback } from 'react';
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
  DialogActions
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
import { modalidadesService, indicadoresService } from '../../services/api';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<IndicadoresData | null>(null);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [dialogPrint, setDialogPrint] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>({
  dataInicio: new Date(new Date().getFullYear(), 0, 1), // Primeiro dia do ano atual
  dataFim: new Date(), // Data atual
  colunaDataInicio: 'data_sessao', // padrão Data da Sessão
  colunaDataFim: 'data_tce_2',     // padrão Data Conclusão
  modalidadeId: ''
  });

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
      const response = await indicadoresService.getIndicadores({
        dataInicio: format(filtros.dataInicio, 'yyyy-MM-dd'),
        dataFim: format(filtros.dataFim, 'yyyy-MM-dd'),
        colunaDataInicio: filtros.colunaDataInicio,
        colunaDataFim: filtros.colunaDataFim,
        modalidadeId: filtros.modalidadeId || undefined
      });
      
      setDados(response);
    } catch (error) {
      setErro('Erro ao carregar dados dos indicadores');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

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
    if (!dados) {
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
                <div class="metric-value">${dados.tempoMedio.length > 0 ? (dados.tempoMedio.reduce((acc, item) => acc + item.tempoMedio, 0) / dados.tempoMedio.length).toFixed(1) : '0'} dias</div>
                <div class="metric-label">Tempo Médio Geral</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${dados.eficacia.reduce((acc, item) => acc + item.total, 0)}</div>
                <div class="metric-label">Total de Processos</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${dados.eficacia.length > 0 ? ((dados.eficacia.reduce((acc, item) => acc + item.finalizados, 0) / dados.eficacia.reduce((acc, item) => acc + item.total, 0)) * 100).toFixed(1) : '0'}%</div>
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
                  <th class="center">Com Sucesso</th>
                  <th class="center">Sem Sucesso</th>
                  <th class="center">Taxa Sucesso</th>
                  <th class="center">Total de Dias</th>
                  <th class="center">Tempo Médio</th>
                </tr>
              </thead>
              <tbody>
                ${dados.eficacia.map(item => {
                  const tempoItem = dados.tempoMedio.find(t => t.modalidade === item.modalidade);
                  const chipClass = item.taxaSucesso >= 70 ? 'chip-success' : item.taxaSucesso > 30 ? 'chip-warning' : 'chip-error';
                  return `
                    <tr>
                      <td>${item.modalidade}</td>
                      <td class="center">${item.total}</td>
                      <td class="center">${item.finalizados}</td>
                      <td class="center">${item.semSucesso}</td>
                      <td class="center"><span class="chip ${chipClass}">${item.taxaSucesso.toFixed(1)}%</span></td>
                      <td class="center">${item.totalDias.toLocaleString()} dias</td>
                      <td class="center">${tempoItem ? `${tempoItem.tempoMedio} dias` : 'N/A'}</td>
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

  const MetricCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    color?: string;
    subtitle?: string;
  }> = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: `${color}.main` }} className="metric-card-icon">
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box p={3} sx={{ bgcolor: 'background.default', minHeight: '100vh' }} className="main-content">
        {/* Cabeçalho */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <AssessmentIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight={600}>
              Indicadores Gerenciais
            </Typography>
          </Box>
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
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {erro && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {erro}
          </Alert>
        )}

        {/* Dados */}
        {dados && !loading && (
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
                  subtitle="Processos finalizados com sucesso"
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
                            <th style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>Com Sucesso</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>Sem Sucesso</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>Taxa Sucesso</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>Total de Dias</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>Tempo Médio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dados.eficacia.map((item, index) => {
                            const tempoItem = dados.tempoMedio.find(t => t.modalidade === item.modalidade);
                            return (
                              <tr key={item.modalidade} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                                <td style={{ padding: '12px', fontWeight: 500, color: theme.palette.text.primary }}>{item.modalidade}</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>{item.total}</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: theme.palette.success.main }}>{item.finalizados}</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: theme.palette.error.main }}>{item.semSucesso}</td>
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
                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 500, color: theme.palette.text.primary }}>
                                  {item.totalDias.toLocaleString()} dias
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', color: theme.palette.text.primary }}>
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
                        data={dados.tempoMedio}
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
                        data={dados.eficacia}
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
                            `${value}%`,
                            'Taxa de Sucesso'
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
                          dataKey="taxaSucesso" 
                          fill={theme.palette.success.main}
                          name="Taxa de Sucesso (%)"
                          radius={[4, 4, 0, 0]}
                          isAnimationActive={false}
                        >
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
          {dados && (
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
                        {dados.tempoMedio.map((item, index) => {
                          const eficaciaItem = dados.eficacia.find(e => e.modalidade === item.modalidade);
                          const taxaSucesso = eficaciaItem?.taxaSucesso || 0;
                          
                          const getChipColor = (taxa: number): 'success' | 'warning' | 'error' => {
                            if (taxa >= 70) return 'success';
                            if (taxa > 30) return 'warning';
                            return 'error';
                          };

                          return (
                            <tr key={item.modalidade}>
                              <td style={{ 
                                padding: '12px', 
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                color: theme.palette.text.primary
                              }}>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {item.nome_modalidade}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.modalidade}
                                  </Typography>
                                </Box>
                              </td>
                              <td style={{ 
                                padding: '12px', 
                                textAlign: 'center', 
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                color: theme.palette.text.primary
                              }}>
                                {item.tempoMedio}
                              </td>
                              <td style={{ 
                                padding: '12px', 
                                textAlign: 'center', 
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                color: theme.palette.text.primary
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
                          data={dados.tempoMedio}
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
                          data={dados.eficacia}
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
                              `${value}%`,
                              'Taxa de Sucesso'
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
                            dataKey="taxaSucesso" 
                            fill={theme.palette.success.main}
                            name="Taxa de Sucesso"
                            isAnimationActive={false}
                          >
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
    </LocalizationProvider>
  );
}
