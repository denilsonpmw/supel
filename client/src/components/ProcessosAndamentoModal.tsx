import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  Search,
  Clear,
} from '@mui/icons-material';
import api from '../services/api';
import { ProcessoAndamento } from '../types';

interface ProcessosAndamentoModalProps {
  open: boolean;
  onClose: () => void;
}

const ProcessosAndamentoModal: React.FC<ProcessosAndamentoModalProps> = ({
  open,
  onClose,
}) => {
  console.log('ProcessosAndamentoModal renderizado. Open:', open);
  
  const [processos, setProcessos] = useState<ProcessoAndamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Função para obter a cor da situação (usa a cor do banco de dados)
  const getSituacaoColor = (processo: ProcessoAndamento) => {
    return processo.cor_situacao || '#6B7280'; // Cor padrão se não houver
  };

  // Filtrar processos baseado na busca
  const filteredProcessos = useMemo(() => {
    if (!searchTerm) return processos;
    
    const searchLower = searchTerm.toLowerCase();
    return processos.filter(processo => 
      processo.nup.toLowerCase().includes(searchLower) ||
      processo.objeto.toLowerCase().includes(searchLower)
    );
  }, [processos, searchTerm]);

  const loadProcessos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/andamento');
      setProcessos(response.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar processos em andamento:', err);
      setError('Erro ao carregar os dados dos processos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      console.log('Modal aberto, carregando processos...');
      loadProcessos();
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      sx={{
        zIndex: 99999,
        '& .MuiDialog-paper': {
          width: '90%',
          maxWidth: '90%',
          margin: 2,
          backgroundColor: 'background.paper',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5">Processos em Andamento</Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Campo de busca */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por NUP ou objeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    edge="end"
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
              },
            }}
          />
          {searchTerm && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {filteredProcessos.length} processo(s) encontrado(s)
            </Typography>
          )}
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            {filteredProcessos.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                {searchTerm ? 'Nenhum processo encontrado para a busca' : 'Nenhum processo em andamento encontrado'}
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={1}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '100px', padding: '8px' }}><strong>NUP</strong></TableCell>
                      <TableCell sx={{ width: '600px', padding: '8px' }}><strong>Objeto</strong></TableCell>
                      <TableCell sx={{ width: '60px', padding: '8px', textAlign: 'center' }}><strong>U.G.</strong></TableCell>
                      <TableCell sx={{ width: '60px', padding: '8px', textAlign: 'center' }}><strong>Mod.</strong></TableCell>
                      <TableCell sx={{ width: '80px', padding: '8px', textAlign: 'center' }}><strong>Número</strong></TableCell>
                      <TableCell sx={{ width: '90px', padding: '8px' }}><strong>Sessão</strong></TableCell>
                      <TableCell sx={{ width: '160px', padding: '8px', textAlign: 'right' }}><strong>Valor Estimado</strong></TableCell>
                      <TableCell sx={{ width: '130px', padding: '8px', textAlign: 'center' }}><strong>Situação</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProcessos.map((processo) => (
                      <TableRow key={processo.id} hover>
                        <TableCell sx={{ padding: '8px' }}>
                          <Typography variant="body2">
                            {processo.nup ? processo.nup.slice(-11) : ''}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ padding: '8px' }}>
                          <Typography variant="body2" sx={{ maxWidth: 600, wordWrap: 'break-word' }}>
                            {processo.objeto}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ padding: '8px', textAlign: 'center' }}>
                          <Typography variant="body2">
                            {processo.unidade_gestora_sigla}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ padding: '8px', textAlign: 'center' }}>
                          <Typography variant="body2">
                            {processo.modalidade_sigla}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ padding: '8px', textAlign: 'center' }}>
                          <Typography variant="body2">
                            {processo.numero_ano}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ padding: '8px' }}>
                          <Typography variant="body2">
                            {processo.data_sessao ? 
                              new Date(processo.data_sessao).toLocaleDateString('pt-BR') 
                              : '-'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ padding: '8px', textAlign: 'right' }}>
                          <Typography variant="body2">
                            {processo.valor_estimado ? 
                              `R$ ${Number(processo.valor_estimado).toLocaleString('pt-BR', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}` 
                              : '-'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ padding: '8px', textAlign: 'center' }}>
                          <Chip 
                            label={processo.situacao}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: getSituacaoColor(processo),
                              color: getSituacaoColor(processo),
                              backgroundColor: 'transparent',
                              fontWeight: 'medium',
                              '& .MuiChip-label': {
                                fontSize: '0.75rem',
                              },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProcessosAndamentoModal;
