import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  Snackbar,
} from '@mui/material';
import {
  Close,
  Search,
  Clear,
} from '@mui/icons-material';
import api from '../services/api';
import { ProcessoAndamento } from '../types';
import { formatServerDateBR } from '../utils/dateUtils';

interface ProcessosAndamentoModalProps {
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void; // Callback opcional para notificar refresh
}

const ProcessosAndamentoModal: React.FC<ProcessosAndamentoModalProps> = ({
  open,
  onClose,
  onRefresh,
}) => {
  // console.log('ProcessosAndamentoModal renderizado. Open:', open);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processos, setProcessos] = useState<ProcessoAndamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Função para obter a cor da situação (usa a cor do banco de dados)
  const getSituacaoColor = (processo: ProcessoAndamento) => {
    return processo.cor_situacao || '#6B7280'; // Cor padrão se não houver
  };

  // Função para verificar se o usuário pode editar o processo
  const canEditProcess = (processo: ProcessoAndamento) => {
    // Admin pode editar qualquer processo
    if (user?.perfil === 'admin') return true;
    
    // Usuário pode editar apenas processos que ele é responsável
    return processo.responsavel_email === user?.email;
  };

  // Função para lidar com clique na linha do processo (abrir edição)
  const handleProcessoClick = async (processo: ProcessoAndamento) => {
    try {
      // Verificar se o usuário é responsável pelo processo específico
      if (user?.perfil !== 'admin') {
        if (!processo.responsavel_email || processo.responsavel_email !== user?.email) {
          setSnackbarOpen(true);
          return;
        }
      }
      
      // Fechar o modal primeiro
      onClose();
      // Navegar para a página de processos com foco no processo específico
      navigate(`/admin/processos?edit=${processo.id}`);
    } catch (error) {
      console.error('Erro ao verificar permissão de edição:', error);
      setSnackbarOpen(true);
    }
  };

  // Filtrar processos baseado na busca
  const filteredProcessos = useMemo(() => {
    if (!searchTerm) return processos;
    
    const searchLower = searchTerm.toLowerCase();
    return processos.filter(processo => {
      // Buscar no NUP completo e também nos últimos 11 caracteres (como exibido)
      const nupCompleto = processo.nup.toLowerCase();
      const nupExibido = processo.nup ? processo.nup.slice(-11).toLowerCase() : '';
      
      return nupCompleto.includes(searchLower) ||
             nupExibido.includes(searchLower) ||
             processo.objeto.toLowerCase().includes(searchLower);
    });
  }, [processos, searchTerm]);

  const loadProcessos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/andamento');
      setProcessos(response.data.data || []);
      // Notificar parent component sobre o refresh se callback fornecido
      onRefresh?.();
    } catch (err) {
      console.error('Erro ao carregar processos em andamento:', err);
      setError('Erro ao carregar os dados dos processos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      // console.log('Modal aberto, carregando processos...');
      // Limpar dados anteriores para forçar reload
      setProcessos([]);
      setSearchTerm('');
      loadProcessos();
    } else {
      // Limpar dados quando modal fecha para garantir reload na próxima abertura
      setProcessos([]);
      setError(null);
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
        <Box>
          <Typography variant="h5">Processos em Andamento</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Clique em qualquer linha ou no ícone de edição para editar o processo
          </Typography>
        </Box>
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
                      <TableCell sx={{ width: '40px', padding: '8px', textAlign: 'center' }}><strong>U.G.</strong></TableCell>
                      <TableCell sx={{ width: '40px', padding: '8px', textAlign: 'center' }}><strong>Mod.</strong></TableCell>
                      <TableCell sx={{ width: '120px', padding: '8px', textAlign: 'center' }}><strong>Número</strong></TableCell>
                      <TableCell sx={{ width: '90px', padding: '8px' }}><strong>Sessão</strong></TableCell>
                      <TableCell sx={{ width: '140px', padding: '8px', textAlign: 'right' }}><strong>Valor Estimado</strong></TableCell>
                      <TableCell sx={{ width: '160px', padding: '8px', textAlign: 'center' }}><strong>Situação</strong></TableCell>
                      <TableCell sx={{ width: '100px', padding: '8px', textAlign: 'center' }}><strong>Data</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProcessos.map((processo) => (
                      <TableRow 
                        key={processo.id} 
                        hover
                        onClick={() => handleProcessoClick(processo)}
                        sx={{
                          cursor: canEditProcess(processo) ? 'pointer' : 'default',
                          '&:hover': {
                            backgroundColor: canEditProcess(processo) ? 'action.hover' : 'transparent',
                          },
                        }}
                      >
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
                            {formatServerDateBR(processo.data_sessao)}
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
                        <TableCell sx={{ padding: '8px', textAlign: 'center' }}>
                          <Typography variant="body2">
                            {formatServerDateBR(processo.data_situacao)}
                          </Typography>
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

      {/* Snackbar de Permissão de Edição */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="error" 
          sx={{ 
            width: '100%',
            backgroundColor: '#d32f2f !important', // Força vermelho
            color: '#fff !important', // Força texto branco
            '& .MuiAlert-icon': {
              color: '#fff !important' // Força ícone branco
            },
            '& .MuiIconButton-root': {
              color: '#fff !important' // Força botão fechar branco
            }
          }}
        >
          🔒 Você não tem permissão para editar este processo. Apenas o responsável pode fazer alterações.
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ProcessosAndamentoModal;
