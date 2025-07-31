import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  TablePagination
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { ThemeToggle } from '../components/ThemeToggle';

import { ThemeContextProvider } from '../contexts/ThemeContext';
import { painelPublicoService } from '../services/api';
import { formatServerDateBR } from '../utils/dateUtils';

interface ProcessoPainel {
  id: number;
  nup: string;
  objeto: string;
  numero_ano: string;
  data_sessao: string;
  data_situacao?: string;
  valor_estimado: number;
  sigla_modalidade: string;
  nome_modalidade: string;
  modalidade_cor: string;
  primeiro_nome: string;
  nome_responsavel: string;
  nome_situacao: string;
  situacao_cor: string;
  eh_finalizadora: boolean;
  sigla_unidade?: string;
}

interface DadosSemana {
  periodo: {
    inicio: string;
    fim: string;
    descricao: string;
  };
  total_processos: number;
  processos: ProcessoPainel[];
}

interface DadosPainel {
  data_atualizacao: string;
  semana_passada: DadosSemana;
  semana_atual: DadosSemana;
  proxima_semana: DadosSemana;
  total_geral: number;
}

function PainelPublicoPage() {
  const [dados, setDados] = useState<DadosPainel | null>(null);
  const [loading, setLoading] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());
  const [horaAtual, setHoraAtual] = useState<Date>(new Date());
  const [paginaSemanaPassada, setPaginaSemanaPassada] = useState(0);
  const [paginaProximaSemana, setPaginaProximaSemana] = useState(0);
  const rowsPerPage = 5;
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Calcular altura máxima para quadros menores baseado na viewport 16:9
  const vh = window.innerHeight;
  const maxCardHeight = isMobile ? undefined : Math.floor((vh - 64) / 2.2); // 64px de margem, divide espaço

  // Atualização automática a cada 60 segundos (60000ms)
  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 60000); // Atualização a cada 60 segundos
    return () => clearInterval(interval);
  }, []);

  // Atualizar relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listener para Ctrl + Shift + R
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verifica se Ctrl + Shift + R foi pressionado
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault(); // Previne o comportamento padrão do navegador
        console.log('Ctrl + Shift + R detectado - Recarregando dados do painel...');
        carregarDados(); // Recarrega os dados
        setUltimaAtualizacao(new Date()); // Atualiza o timestamp
      }
    };

    // Adiciona o listener
    window.addEventListener('keydown', handleKeyDown);

    // Remove o listener ao desmontar o componente
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Array vazio para executar apenas uma vez

  const processosSemanaPassada = (dados?.semana_passada.processos || []).sort((a, b) => 
    new Date(b.data_sessao).getTime() - new Date(a.data_sessao).getTime()
  );
  const processosSemanaAtual = (dados?.semana_atual.processos || []).sort((a, b) => 
    new Date(a.data_sessao).getTime() - new Date(b.data_sessao).getTime()
  );
  const processosProximaSemana = (dados?.proxima_semana.processos || []).sort((a, b) => 
    new Date(a.data_sessao).getTime() - new Date(b.data_sessao).getTime()
  );

  useEffect(() => {
    // Timer para Semana Passada
    const intervalSemanaPassada = setInterval(() => {
      setPaginaSemanaPassada((paginaAtual) => {
        const totalPaginas = Math.ceil(processosSemanaPassada.length / rowsPerPage);
        return totalPaginas > 0 ? (paginaAtual + 1) % totalPaginas : 0;
      });
    }, 15000); // 15 segundos

    // Timer para Próxima Semana
    const intervalProximaSemana = setInterval(() => {
      setPaginaProximaSemana((paginaAtual) => {
        const totalPaginas = Math.ceil(processosProximaSemana.length / rowsPerPage);
        return totalPaginas > 0 ? (paginaAtual + 1) % totalPaginas : 0;
      });
    }, 17000); // 17 segundos

    // Limpar intervalos ao desmontar
    return () => {
      clearInterval(intervalSemanaPassada);
      clearInterval(intervalProximaSemana);
    };
  }, [processosSemanaPassada.length, processosProximaSemana.length, rowsPerPage]);

  const carregarDados = async () => {
    try {
      const dadosApi = await painelPublicoService.getDadosCompletos();
      setDados(dadosApi);
      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados do painel:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar datas YYYY-MM-DD como local do Brasil
    // Função removida - agora usando formatServerDateBR do utils

  // Função para calcular se o texto deve ser branco ou preto baseado na cor de fundo
  const getContrastTextColor = (backgroundColor: string) => {
    // Remove o # se presente
    const hex = backgroundColor.replace('#', '');
    
    // Converte para RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calcula a luminância
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retorna branco para fundos escuros, preto para fundos claros
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Componente para renderizar processo como card compacto (sem objeto)
  const ProcessoCardCompacto = ({ processo }: { processo: ProcessoPainel }) => (
    <Card 
      variant="outlined" 
      sx={{ 
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 2,
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-1px)',
        },
        transition: 'all 0.2s ease-in-out',
        minHeight: isMobile ? 140 : 160
      }}
    >
      <CardContent sx={{ p: isMobile ? 2 : 2.5, '&:last-child': { pb: isMobile ? 2 : 2.5 } }}>
        {/* Header com MOD - Nº/Ano */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, width: '100%' }}>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="600" sx={{ color: VERDE }} textAlign="center">
            {processo.sigla_modalidade} - {processo.numero_ano}
          </Typography>
        </Box>
        
        {/* Data da Sessão */}
        <Typography 
          variant={isMobile ? 'h6' : 'h5'} 
          color="text.primary" 
          fontWeight="medium"
          sx={{ mb: 2, width: '100%', textAlign: 'center' }}
        >
          📅 {formatServerDateBR(processo.data_sessao)}
        </Typography>
        
        {/* Chips na parte inferior */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', width: '100%', justifyContent: 'center', mb: 1.5 }}>
          <Chip 
            label={processo.sigla_unidade || 'N/A'}
            color="primary" 
            variant="outlined" 
            size="small"
            sx={{ fontSize: isMobile ? 16 : 20, fontWeight: 'medium' }}
          />
          <Chip 
            label={processo.sigla_modalidade}
            color="secondary" 
            variant="outlined" 
            size="small" 
            sx={{ fontSize: isMobile ? 16 : 20, fontWeight: 'medium' }}
          />
          <Chip 
            label={processo.primeiro_nome}
            color="info" 
            variant="outlined" 
            size="small" 
            sx={{ fontSize: isMobile ? 16 : 20, fontWeight: 'medium' }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Chip 
            label={processo.nome_situacao}
            size="small"
            variant="outlined"
            sx={{ 
              color: processo.situacao_cor, 
              fontWeight: 'medium', 
              fontSize: isMobile ? 14 : 20,
              border: 'none',
              textTransform: 'uppercase'
            }} 
          />
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <ThemeContextProvider>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          sx={{ bgcolor: 'background.default' }}
        >
          <CircularProgress size={60} color="primary" />
        </Box>
      </ThemeContextProvider>
    );
  }

  // Exemplo de cor
  const LARANJA = '#FFA500';
  const VERDE = '#39FF14';
  const VERMELHO = '#ff1414';
  const CINZA = '#828282';
  const BRANCO = '#FFFFFF';
  const AZUL = '#1b41faff'; // Azul forte para o título
  const DOURADO ='#F59E0B';
  const TABELA_BG_PAR = '#151b23';
  const TABELA_BG_IMPAR = '#181c23';

  return (
    <ThemeContextProvider>
      <Box sx={{ position: 'relative', width: '98vw', height: '98vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
        {/* Linha superior: toggle tema + relógio atualização */}
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ThemeToggle />
          <Typography variant="body1" color="text.secondary" sx={{ bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 1, boxShadow: 1, fontWeight: 600, fontSize: isMobile ? 16 : 18, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            ⟳ {horaAtual.toLocaleTimeString('pt-BR')} <span style={{opacity:0.95, fontSize: isMobile ? 14 : 16, marginLeft:8, color: theme.palette.mode === 'dark' ? '#f59e0b' : '#0061c2', fontWeight:600}}>(atualizado {ultimaAtualizacao.toLocaleTimeString('pt-BR')})</span>
          </Typography>
        </Box>
        

        
        <Box sx={{
          minHeight: '100vh',
          width: '100vw',
          bgcolor: 'background.default',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: isMobile ? 3 : 8,
          pt: isMobile ? 5 : 10,
          boxSizing: 'border-box',
        }}>
          <Grid container spacing={isMobile ? 3 : 6} justifyContent="center" alignItems="stretch" sx={{ maxWidth: 1920, width: '100%' }}>
            {/* Quadro Principal - Semana Atual com Cards Compactos */}
            <Grid item xs={12}>
              <Card sx={{
                bgcolor: 'red',
                boxShadow: 6,
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                p: isMobile ? 2 : 4,
                overflow: 'visible',
              }}>
                <CardContent sx={{ width: '100%', p: 0 }}>
                  <Box display="flex" alignItems="center" gap={2} justifyContent="center" mb={isMobile ? 2 : 3}>
                    <Typography variant={isMobile ? 'h4' : 'h2'} sx={{ color: CINZA }} fontWeight="500">
                      SEMANA ATUAL
                    </Typography>
                    <Chip 
                      label={`${dados?.semana_atual.total_processos || 0} processo(s)`}
                      color="primary"
                      size={isMobile ? 'small' : 'medium'}
                      sx={{ fontSize: isMobile ? 24 : 32, height: isMobile ? 42 : 56, fontWeight: 500 }}
                    />
                  </Box>
                  <Box sx={{ px: 2, pb: 3 }}>
                    {processosSemanaAtual.length ? (
                      <Grid container spacing={2} sx={{ pb: 2 }}>
                        {processosSemanaAtual.map((processo) => (
                          <Grid item xs={3} key={processo.id}>
                            <ProcessoCardCompacto processo={processo} />
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant={isMobile ? 'h5' : 'h4'} color="grey.500">
                              Nenhum processo programado para esta semana
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Linha de quadros menores abaixo do principal - VOLTANDO PARA TABELAS */}
            <Grid item xs={12}>
              <Grid container spacing={isMobile ? 3 : 6} alignItems="stretch">
                {/* Semana Passada - TABELA */}
                <Grid item xs={12} md={8}>
                  <Card sx={{
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    borderRadius: 3,
                    mb: isMobile ? 2 : 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                  }}>
                    <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={isMobile ? 1.5 : 2.5}>
                        <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ color: CINZA, textTransform: 'uppercase' }} fontWeight="400">
                          SEMANA PASSADA
                        </Typography>
                        <Chip 
                          label={`${processosSemanaPassada.length} processo(s)`}
                          color="secondary"
                          size={isMobile ? 'small' : 'medium'}
                          sx={{ fontSize: isMobile ? 14 : 20, height: isMobile ? 28 : 36, fontWeight: 500 }}
                        />
                      </Box>
                      <TableContainer component={Paper} sx={{ boxShadow: 0, overflowX: 'hidden' }}>
                        <Table size={isMobile ? 'small' : 'medium'} padding="none">
                          <TableHead>
                            <TableRow>
                              <TableCell align="center" sx={{ fontSize: isMobile ? 12 : 18, fontWeight: 500 }}>MOD</TableCell>
                              <TableCell align="center" sx={{ fontSize: isMobile ? 12 : 18, fontWeight: 500 }}>Nº/Ano</TableCell>
                              <TableCell align="center" sx={{ fontSize: isMobile ? 12 : 18, fontWeight: 500 }}>Data Sessão</TableCell>
                              <TableCell align="center" sx={{ fontSize: isMobile ? 12 : 18, fontWeight: 500 }}>Responsável</TableCell>
                              <TableCell align="center" sx={{ fontSize: isMobile ? 12 : 18, fontWeight: 500 }}>UG</TableCell>
                              <TableCell align="center" sx={{ fontSize: isMobile ? 12 : 18, fontWeight: 500 }}>Situação</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {processosSemanaPassada.length ? processosSemanaPassada
                              .slice(paginaSemanaPassada * rowsPerPage, paginaSemanaPassada * rowsPerPage + rowsPerPage)
                              .map((processo, index) => (
                              <TableRow 
                                key={processo.id}
                                sx={(theme) => ({
                                  bgcolor:
                                    theme.palette.mode === 'dark'
                                      ? (index % 2 === 0 ? '#151b23' : '#181c23')
                                      : (index % 2 === 0 ? '#f5f7fa' : '#e9ecef'),
                                  '&:hover': { bgcolor: theme.palette.action.selected }
                                })}
                              >
                                <TableCell align="center" sx={{ fontSize: isMobile ? 14 : 20, fontWeight: 400, py: isMobile ? 0.25 : 0.5 }}>
                                  <Chip 
                                    label={processo.sigla_modalidade}
                                    size={isMobile ? 'small' : 'medium'}
                                    sx={{ 
                                      bgcolor: 'transparent', 
                                      border: 'none', 
                                      color: processo.modalidade_cor, 
                                      fontWeight: 500, 
                                      fontSize: isMobile ? 16 : 20, // Aumenta o tamanho do texto
                                      boxShadow: 'none',
                                      textTransform: 'uppercase',
                                      letterSpacing: 0.5,
                                      minHeight: isMobile ? 32 : 38,
                                      minWidth: 80
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: isMobile ? 14 : 20, fontWeight: 400, py: isMobile ? 0.25 : 0.5 }}>{processo.numero_ano}</TableCell>
                                <TableCell align="center" sx={{ fontSize: isMobile ? 14 : 20, fontWeight: 400, py: isMobile ? 0.25 : 0.5 }}>{formatServerDateBR(processo.data_sessao)}</TableCell>
                                <TableCell align="center" sx={{ fontSize: isMobile ? 14 : 20, fontWeight: 400, py: isMobile ? 0.25 : 0.5 }}>{processo.primeiro_nome}</TableCell>
                                <TableCell align="center" sx={{ fontSize: isMobile ? 14 : 20, fontWeight: 400, py: isMobile ? 0.25 : 0.5 }}>{processo.sigla_unidade || 'N/A'}</TableCell>
                                <TableCell align="center" sx={{ fontSize: isMobile ? 14 : 20, fontWeight: 400, py: isMobile ? 0.25 : 0.5 }}>
                                  <Chip 
                                    label={processo.nome_situacao} 
                                    size={isMobile ? 'small' : 'medium'} 
                                    sx={{ 
                                      bgcolor: 'transparent', 
                                      border: 'none', 
                                      color: processo.situacao_cor, 
                                      fontWeight: 500, 
                                      fontSize: isMobile ? 16 : 20, // Aumenta o tamanho do texto
                                      boxShadow: 'none',
                                      textTransform: 'uppercase',
                                      letterSpacing: 0.5,
                                      minHeight: isMobile ? 32 : 38,
                                      minWidth: 80
                                    }} 
                                  />
                                </TableCell>
                              </TableRow>
                            )) : null}

  {/* Preencher linhas em branco se necessário */}
  {Array.from({
    length: Math.max(
      0,
      rowsPerPage -
        processosSemanaPassada.slice(
          paginaSemanaPassada * rowsPerPage,
          paginaSemanaPassada * rowsPerPage + rowsPerPage
        ).length
    ),
  }).map((_, idx) => (
    <TableRow key={`empty-sem-pas-${idx}`}>
      <TableCell colSpan={6} sx={{ height: 48 }} />
    </TableRow>
  ))}

  {/* Se não houver nenhum processo e for a primeira página, mostrar mensagem */}
  {processosSemanaPassada.length === 0 && (
    <TableRow>
      <TableCell colSpan={6} align="center" sx={{ fontSize: isMobile ? 12 : 16, color: 'grey.500', py: 2 }}>
        Nenhum processo na semana passada
      </TableCell>
    </TableRow>
  )}
                          </TableBody>
                        </Table>
                        <TablePagination
                          component="div"
                          count={processosSemanaPassada.length}
                          page={paginaSemanaPassada}
                          onPageChange={(_, newPage) => setPaginaSemanaPassada(newPage)}
                          rowsPerPage={rowsPerPage}
                          rowsPerPageOptions={[]}
                        />
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Próxima Semana - TABELA */}
                <Grid item xs={12} md={4}>
                  <Card sx={{
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    borderRadius: 3,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                  }}>
                    <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={isMobile ? 1.5 : 2.5}>
                        <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ color: CINZA, textTransform: 'uppercase' }} fontWeight="400">
                          PRÓXIMA SEMANA
                        </Typography>
                        <Chip 
                          label={`${processosProximaSemana.length} processo(s)`}
                          color="success"
                          size={isMobile ? 'small' : 'medium'}
                          sx={{ fontSize: isMobile ? 14 : 20, height: isMobile ? 28 : 36, fontWeight: 500 }}
                        />
                      </Box>
                      <TableContainer component={Paper} sx={{ boxShadow: 0, overflowX: 'hidden' }}>
                        <Table size={isMobile ? 'small' : 'medium'} padding="none">
                          <TableHead>
                            <TableRow>
                              <TableCell align="center" sx={{ fontSize: isMobile ? 12 : 18, fontWeight: 500 }}>MOD</TableCell>
                              <TableCell align="center" sx={{ fontSize: isMobile ? 12 : 18, fontWeight: 500 }}>Nº/Ano</TableCell>
                              <TableCell align="center" sx={{ fontSize: isMobile ? 12 : 18, fontWeight: 500 }}>Data Sessão</TableCell>
                              <TableCell align="center" sx={{ fontSize: isMobile ? 12 : 18, fontWeight: 500 }}>Responsável</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {processosProximaSemana.length ? processosProximaSemana
                              .slice(paginaProximaSemana * rowsPerPage, paginaProximaSemana * rowsPerPage + rowsPerPage)
                              .map((processo, index) => (
                              <TableRow 
                                key={processo.id}
                                sx={(theme) => ({
                                  bgcolor:
                                    theme.palette.mode === 'dark'
                                      ? (index % 2 === 0 ? '#151b23' : '#181c23')
                                      : (index % 2 === 0 ? '#f5f7fa' : '#e9ecef'),
                                  '&:hover': { bgcolor: theme.palette.action.selected }
                                })}
                              >
                                <TableCell align="center" sx={{ fontSize: isMobile ? 14 : 20, fontWeight: 400, py: isMobile ? 0.25 : 0.5 }}>
                                  <Chip 
                                    label={processo.sigla_modalidade}
                                    size={isMobile ? 'small' : 'medium'}
                                    sx={{ 
                                      bgcolor: 'transparent', 
                                      border: 'none', 
                                      color: processo.modalidade_cor, 
                                      fontWeight: 900, 
                                      fontSize: isMobile ? 16 : 20, // Aumenta o tamanho do texto
                                      boxShadow: 'none',
                                      textTransform: 'uppercase',
                                      letterSpacing: 0.5,
                                      minHeight: isMobile ? 32 : 38,
                                      minWidth: 80
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: isMobile ? 14 : 20, fontWeight: 400, py: isMobile ? 0.25 : 0.5 }}>{processo.numero_ano}</TableCell>
                                <TableCell align="center" sx={{ fontSize: isMobile ? 14 : 20, fontWeight: 400, py: isMobile ? 0.25 : 0.5 }}>{formatServerDateBR(processo.data_sessao)}</TableCell>
                                <TableCell align="center" sx={{ fontSize: isMobile ? 14 : 20, fontWeight: 400, py: isMobile ? 0.25 : 0.5 }}>{processo.primeiro_nome}</TableCell>
                              </TableRow>
                            )) : null}

  {/* Preencher linhas em branco se necessário */}
  {Array.from({
    length: Math.max(
      0,
      rowsPerPage -
        processosProximaSemana.slice(
          paginaProximaSemana * rowsPerPage,
          paginaProximaSemana * rowsPerPage + rowsPerPage
        ).length
    ),
  }).map((_, idx) => (
    <TableRow key={`empty-prox-sem-${idx}`}>
      <TableCell colSpan={4} sx={{ height: 48 }} />
    </TableRow>
  ))}

  {/* Se não houver nenhum processo e for a primeira página, mostrar mensagem */}
  {processosProximaSemana.length === 0 && (
    <TableRow>
      <TableCell colSpan={4} align="center" sx={{ fontSize: isMobile ? 12 : 16, color: 'grey.500', py: 2 }}>
        Nenhum processo programado para próxima semana
      </TableCell>
    </TableRow>
  )}
                          </TableBody>
                        </Table>
                        <TablePagination
                          component="div"
                          count={processosProximaSemana.length}
                          page={paginaProximaSemana}
                          onPageChange={(_, newPage) => setPaginaProximaSemana(newPage)}
                          rowsPerPage={rowsPerPage}
                          rowsPerPageOptions={[]}
                        />
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeContextProvider>
  );
}

export default PainelPublicoPage;
