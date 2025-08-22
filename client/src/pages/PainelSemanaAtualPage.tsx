import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { painelPublicoService } from '../services/api';
import { formatServerDateBR } from '../utils/dateUtils';

interface ProcessoPainelSemana {
  id: number;
  nup: string;
  numero_ano: string;
  data_sessao: string;
  sigla_modalidade: string;
  modalidade_cor: string;
  primeiro_nome: string;
  sigla_unidade?: string;
  nome_situacao: string;
  situacao_cor: string;
}

interface DadosSemanaAtual {
  periodo: { inicio: string; fim: string; descricao: string };
  total_processos: number;
  processos: ProcessoPainelSemana[];
}

// Paleta fixa para o layout solicitado (fundo preto puro, textos brancos e alto contraste)
const COLORS = {
  background: '#000000',
  surface: '#0d0d0d',
  surfaceAlt: '#141414',
  white: '#ffffff',
  accent: '#39FF14', // verde neon
  accent2: '#1b41fa', // azul forte já usado no projeto
  warning: '#FFA500',
  danger: '#ff1414',
  subtle: '#828282'
};

export default function PainelSemanaAtualPage() {
  const [dadosSemana, setDadosSemana] = useState<DadosSemanaAtual | null>(null);
  const [loading, setLoading] = useState(true);
  const [horaAtual, setHoraAtual] = useState<Date>(new Date());
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());
  const [erro, setErro] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const resp = await painelPublicoService.getSemanaAtual();
      setDadosSemana(resp);
      setUltimaAtualizacao(new Date());
    } catch (e: any) {
      console.error('Falha ao carregar semana atual', e);
      setErro('Falha ao carregar dados. Tente novamente (Ctrl+Shift+R).');
    } finally {
      setLoading(false);
    }
  }, []);

  // Primeira carga + intervalo a cada 60s
  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 60000);
    return () => clearInterval(interval);
  }, [carregar]);

  // Relógio em tempo real
  useEffect(() => {
    const t = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Atalho Ctrl+Shift+R para recarregar
  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.ctrlKey && ev.shiftKey && ev.key === 'R') {
        ev.preventDefault();
        carregar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carregar]);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" sx={{ bgcolor: COLORS.background, color: COLORS.white }}>
        <CircularProgress size={72} sx={{ color: COLORS.accent }} />
      </Box>
    );
  }

  const processos = (dadosSemana?.processos || []).slice().sort((a, b) => new Date(a.data_sessao).getTime() - new Date(b.data_sessao).getTime());

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      bgcolor: COLORS.background,
      color: COLORS.white,
      fontFamily: 'Inter, Roboto, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      p: isMobile ? 2 : 4,
      boxSizing: 'border-box'
    }}>
      {/* Barra superior */}
      <Box display="flex" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={2} mb={isMobile ? 2 : 3}>
        <Typography variant={isMobile ? 'h5' : 'h3'} fontWeight={600} sx={{ letterSpacing: 0.6, color: COLORS.white, lineHeight: 1.05, textTransform: 'uppercase', width: '100%', textAlign: 'center' }}>
          PAINEL SEMANA ATUAL
        </Typography>
        <Box display="flex" flexDirection="column" gap={0.5} flexGrow={1} minWidth={280}>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant={isMobile ? 'body2' : 'body1'} sx={{ color: COLORS.warning, textTransform: 'uppercase', fontWeight: 600 }}>
              {(dadosSemana?.periodo?.descricao || 'Período não informado').toUpperCase()}
            </Typography>
            <Chip 
              label={`TOTAL: ${dadosSemana?.total_processos || 0}`} 
              size={isMobile ? 'small' : 'medium'}
              sx={{ 
                bgcolor: COLORS.surfaceAlt, 
                color: COLORS.danger, 
                fontWeight: 700, 
                border: '1px solid #1f1f1f',
                letterSpacing: 0.8,
                fontSize: isMobile ? '0.80rem' : '0.95rem',
                height: isMobile ? 28 : 40,
                px: isMobile ? 1.5 : 2.25
              }} 
            />
          </Box>
        </Box>
  <Box display="flex" alignItems="center" gap={2} sx={{ ml: 'auto' }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant={isMobile ? 'caption' : 'body2'} sx={{ color: COLORS.subtle }}>
              Atual: {horaAtual.toLocaleTimeString('pt-BR')}
            </Typography>
            <Typography variant={isMobile ? 'caption' : 'body2'} sx={{ color: COLORS.accent }}>
              Atualizado: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
            </Typography>
          </Box>
          <Tooltip title="Recarregar (Ctrl+Shift+R)">
            <IconButton onClick={carregar} sx={{ color: COLORS.accent, border: '1px solid ' + COLORS.accent, '&:hover': { bgcolor: COLORS.accent, color: COLORS.background } }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

  {/* (Removido o card isolado de total para ganhar espaço) */}

      {/* Lista de processos */}
      <Grid container spacing={isMobile ? 2 : 3}>
        {erro && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: '#310000', border: '1px solid ' + COLORS.danger }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: COLORS.danger, textTransform: 'uppercase' }}>{erro.toUpperCase()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        {processos.length === 0 && !erro && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: COLORS.surface, border: '1px dashed #2e2e2e' }}>
              <CardContent>
                <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ color: COLORS.subtle, textAlign: 'center', textTransform: 'uppercase' }}>
                  NENHUM PROCESSO PROGRAMADO PARA ESTA SEMANA
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        {processos.map((p) => (
          <Grid key={p.id} item xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                bgcolor: COLORS.surface,
                border: '1px solid #1f1f1f',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(57,255,20,0.15), rgba(27,65,250,0.08))',
                  opacity: 0,
                  transition: 'opacity .3s'
                },
                '&:hover:before': { opacity: 1 },
                '&:hover': { borderColor: COLORS.accent }
              }}
              elevation={6}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Chip
                    label={p.sigla_modalidade?.toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: 'transparent',
                      border: '1px solid ' + (p.modalidade_cor || COLORS.accent2),
                      color: p.modalidade_cor || COLORS.accent2,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase'
                    }}
                  />
                  <Typography
                    variant={isMobile ? 'body2' : 'subtitle2'}
                    sx={{
                      color: COLORS.subtle,
                      fontWeight: 500,
                      letterSpacing: 0.5,
                      fontSize: isMobile ? '0.9rem' : '1.05rem'
                    }}
                  >
                    {formatServerDateBR(p.data_sessao)}
                  </Typography>
                </Box>
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  fontWeight={600}
                  sx={{ color: COLORS.white, lineHeight: 1.1, textTransform: 'uppercase' }}
                >
                  {String(p.numero_ano).toUpperCase()}
                </Typography>
                <Box mt={0.5} display="flex" flexWrap="wrap" gap={0.5}>
                  {p.sigla_unidade && (
                    <Chip
                      label={p.sigla_unidade.toUpperCase()}
                      size="small"
                      sx={{ bgcolor: COLORS.surfaceAlt, color: COLORS.white, fontWeight: 500, textTransform: 'uppercase' }}
                    />
                  )}
                  <Chip
                    label={p.primeiro_nome.toUpperCase()}
                    size="small"
                    sx={{ bgcolor: COLORS.surfaceAlt, color: COLORS.white, fontWeight: 500, textTransform: 'uppercase' }}
                  />
                </Box>
                <Box mt="auto" pt={1}>
                  <Chip
                    label={p.nome_situacao.toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: 'transparent',
                      border: '1px solid ' + (p.situacao_cor || COLORS.accent),
                      color: p.situacao_cor || COLORS.accent,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
