import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { 
  buscarDetalhesOutliers, 
  ProcessoOutlier, 
  EstatisticasOutliers,
  formatarValorMonetario
} from '../utils/statisticsUtils';

interface OutliersDetalhesModalProps {
  open: boolean;
  onClose: () => void;
}

const OutliersDetalhesModal: React.FC<OutliersDetalhesModalProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outliers, setOutliers] = useState<ProcessoOutlier[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasOutliers | null>(null);

  const carregarOutliers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Carregando detalhes dos outliers...');
      const dados = await buscarDetalhesOutliers();
      console.log('✅ Dados recebidos:', dados);
      console.log('📊 Dados completos do primeiro outlier:', dados.data[0]);
      setOutliers(dados.data);
      setEstatisticas(dados.estatisticas);
    } catch (err: any) {
      console.error('❌ Erro ao carregar outliers:', err);
      console.error('❌ Detalhes do erro:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(`Erro ao carregar detalhes dos processos ocultos: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      carregarOutliers();
    }
  }, [open]);

  const formatarData = (data: string | null) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VisibilityIcon />
        Processos Ocultos por Filtro Estatístico
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Carregando detalhes...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            {estatisticas && (
              <Alert 
                severity="info" 
                sx={{ mb: 3 }}
                icon={<InfoIcon />}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Informações Estatísticas do Filtro
                </Typography>
                <Typography variant="body2">
                  • <strong>Total de processos:</strong> {estatisticas.totalProcessos}
                </Typography>
                <Typography variant="body2">
                  • <strong>Processos exibidos:</strong> {estatisticas.processosValidos}
                </Typography>
                <Typography variant="body2">
                  • <strong>Processos ocultos:</strong> {estatisticas.processosOutliers}
                </Typography>
                <Typography variant="body2">
                  • <strong>Limite para outlier:</strong> {formatarValorMonetario(estatisticas.limiteOutlier)}
                </Typography>
                <Typography variant="body2">
                  • <strong>Média:</strong> {formatarValorMonetario(estatisticas.media)}
                </Typography>
                <Typography variant="body2">
                  • <strong>Desvio Padrão:</strong> {formatarValorMonetario(estatisticas.desvioPadrao)}
                </Typography>
              </Alert>
            )}

            {outliers.length === 0 ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography>
                  🎉 Excelente! Não há processos sendo ocultados no momento. 
                  Todos os processos estão dentro do padrão estatístico normal.
                </Typography>
              </Alert>
            ) : (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Processos Ocultos ({outliers.length})
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Os processos abaixo foram ocultados dos gráficos e cards do dashboard 
                  porque possuem valores estimados muito acima da média, o que poderia 
                  distorcer as visualizações.
                </Typography>

                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '100px', padding: '8px' }}><strong>NUP</strong></TableCell>
                        <TableCell sx={{ width: '600px', padding: '8px' }}><strong>Objeto</strong></TableCell>
                        <TableCell sx={{ width: '40px', padding: '8px', textAlign: 'center' }}><strong>U.G.</strong></TableCell>
                        <TableCell sx={{ width: '40px', padding: '8px', textAlign: 'center' }}><strong>Mod.</strong></TableCell>
                        <TableCell sx={{ width: '140px', padding: '8px', textAlign: 'right' }}><strong>Valor Estimado</strong></TableCell>
                        <TableCell sx={{ width: '160px', padding: '8px', textAlign: 'center' }}><strong>Situação</strong></TableCell>
                        <TableCell sx={{ width: '100px', padding: '8px', textAlign: 'center' }}><strong>Data Situação</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {outliers.map((outlier) => (
                        <TableRow key={outlier.id} hover>
                          <TableCell sx={{ padding: '8px' }}>
                            <Typography variant="body2" fontFamily="monospace">
                              {outlier.nup}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ padding: '8px' }}>
                            <Typography variant="body2" sx={{ maxWidth: 600, wordWrap: 'break-word' }}>
                              {outlier.objeto}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ padding: '8px', textAlign: 'center' }}>
                            <Typography variant="body2">
                              {outlier.unidade_gestora}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ padding: '8px', textAlign: 'center' }}>
                            <Typography variant="body2">
                              {outlier.modalidade}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ padding: '8px', textAlign: 'right' }}>
                            <Typography 
                              variant="body2" 
                              fontWeight="bold" 
                              color="error.main"
                            >
                              {outlier.valor_formatado}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ padding: '8px', textAlign: 'center' }}>
                            <Chip
                              label={outlier.situacao}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: outlier.cor_situacao,
                                color: outlier.cor_situacao,
                                backgroundColor: 'transparent',
                                fontWeight: 'medium',
                                '& .MuiChip-label': {
                                  fontSize: '0.75rem',
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ padding: '8px', textAlign: 'center' }}>
                            <Typography variant="body2">
                              {formatarData(outlier.data_situacao)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OutliersDetalhesModal;
