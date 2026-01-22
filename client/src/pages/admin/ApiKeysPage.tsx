import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
  Stack,
  InputAdornment,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';

interface ApiKey {
  id: number;
  key_name: string;
  api_key: string;
  is_active: boolean;
  allowed_endpoints: string[];
  rate_limit: number;
  expires_at: string | null;
  created_at: string;
  last_used_at: string | null;
  usage_count: number;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  
  const [newKey, setNewKey] = useState({
    key_name: '',
    allowed_endpoints: '/api/processes*',
    rate_limit: 5000,
    expires_in_days: 365
  });

  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    carregarApiKeys();
  }, []);

  const carregarApiKeys = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api-keys');
      setApiKeys(response.data);
    } catch (error) {
      console.error('Erro ao carregar API keys:', error);
      setSnackbar({ open: true, message: 'Erro ao carregar API keys', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      const endpoints = newKey.allowed_endpoints
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      const response = await api.post('/api-keys', {
        ...newKey,
        allowed_endpoints: endpoints
      });

      setGeneratedKey(response.data.api_key.api_key);
      setSnackbar({ open: true, message: 'API key criada com sucesso!', severity: 'success' });
      await carregarApiKeys();
    } catch (error) {
      console.error('Erro ao criar API key:', error);
      setSnackbar({ open: true, message: 'Erro ao criar API key', severity: 'error' });
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja revogar esta API key?')) {
      return;
    }

    try {
      await api.delete(`/api-keys/${id}`);
      setSnackbar({ open: true, message: 'API key revogada com sucesso', severity: 'success' });
      await carregarApiKeys();
    } catch (error) {
      console.error('Erro ao revogar API key:', error);
      setSnackbar({ open: true, message: 'Erro ao revogar API key', severity: 'error' });
    }
  };

  const handleViewStats = async (key: ApiKey) => {
    try {
      const response = await api.get(`/api-keys/${key.id}/stats`);
      setSelectedKey({ ...key, ...response.data });
      setStatsDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setSnackbar({ open: true, message: 'Erro ao carregar estatísticas', severity: 'error' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'Copiado para área de transferência!', severity: 'info' });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setGeneratedKey(null);
    setNewKey({
      key_name: '',
      allowed_endpoints: '/api/processes*',
      rate_limit: 5000,
      expires_in_days: 365
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 4 }, pb: 4, mt: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            API Keys para Webhooks
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie chaves de API para integração com sistemas externos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Nova API Key
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>API Key</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Usos</TableCell>
                  <TableCell>Rate Limit</TableCell>
                  <TableCell>Expira em</TableCell>
                  <TableCell>Último Uso</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : apiKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Nenhuma API key cadastrada
                    </TableCell>
                  </TableRow>
                ) : (
                  apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {key.key_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontFamily="monospace">
                            {key.api_key}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(key.api_key)}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={key.is_active ? 'Ativa' : 'Revogada'}
                          color={key.is_active ? 'success' : 'error'}
                          size="small"
                          icon={key.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {key.usage_count.toLocaleString('pt-BR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {key.rate_limit.toLocaleString('pt-BR')}/hora
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(key.expires_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(key.last_used_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Ver Estatísticas">
                            <IconButton
                              size="small"
                              onClick={() => handleViewStats(key)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {key.is_active && (
                            <Tooltip title="Revogar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteKey(key.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para criar nova API key */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {generatedKey ? 'API Key Gerada com Sucesso!' : 'Criar Nova API Key'}
        </DialogTitle>
        <DialogContent>
          {generatedKey ? (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Atenção!</strong> Copie e guarde esta chave em local seguro. 
                Ela não será exibida novamente.
              </Alert>
              <TextField
                fullWidth
                label="API Key"
                value={generatedKey}
                multiline
                rows={3}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => copyToClipboard(generatedKey)}>
                        <CopyIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { fontFamily: 'monospace' }
                }}
              />
            </Box>
          ) : (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Nome da API Key"
                fullWidth
                value={newKey.key_name}
                onChange={(e) => setNewKey({ ...newKey, key_name: e.target.value })}
                placeholder="Ex: Webhook ARPS"
                required
              />
              <TextField
                label="Endpoints Permitidos"
                fullWidth
                value={newKey.allowed_endpoints}
                onChange={(e) => setNewKey({ ...newKey, allowed_endpoints: e.target.value })}
                placeholder="Ex: /api/processes*, /api/reports*"
                helperText="Separe múltiplos endpoints por vírgula. Use * para wildcards."
              />
              <TextField
                label="Rate Limit (requisições/hora)"
                type="number"
                fullWidth
                value={newKey.rate_limit}
                onChange={(e) => setNewKey({ ...newKey, rate_limit: parseInt(e.target.value) })}
              />
              <TextField
                label="Expira em (dias)"
                type="number"
                fullWidth
                value={newKey.expires_in_days}
                onChange={(e) => setNewKey({ ...newKey, expires_in_days: parseInt(e.target.value) })}
                helperText="0 = Nunca expira"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {generatedKey ? (
            <Button onClick={handleCloseDialog} variant="contained">
              Fechar
            </Button>
          ) : (
            <>
              <Button onClick={handleCloseDialog}>Cancelar</Button>
              <Button
                onClick={handleCreateKey}
                variant="contained"
                disabled={!newKey.key_name}
              >
                Criar API Key
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de estatísticas */}
      <Dialog open={statsDialogOpen} onClose={() => setStatsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Estatísticas da API Key</DialogTitle>
        <DialogContent>
          {selectedKey && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nome</Typography>
                <Typography variant="body1">{selectedKey.key_name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total de Usos</Typography>
                <Typography variant="h4">{selectedKey.usage_count.toLocaleString('pt-BR')}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Último Uso</Typography>
                <Typography variant="body1">{formatDate(selectedKey.last_used_at)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Criada em</Typography>
                <Typography variant="body1">{formatDate(selectedKey.created_at)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Endpoints Permitidos</Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {selectedKey.allowed_endpoints.map((endpoint, idx) => (
                    <Chip key={idx} label={endpoint} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
