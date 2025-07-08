import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Chip,
  Tooltip,
  Alert,
  Grid,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Flag as FlagIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { Situacao } from '../../types';

interface SituacaoForm {
  nome_situacao: string;
  descricao_situacao: string;
  eh_finalizadora: boolean;
  cor_hex: string;
  ativo: boolean;
}

interface SituacaoStats {
  id: number;
  nome_situacao: string;
  eh_finalizadora: boolean;
  cor_hex: string;
  total_processos: number;
  valor_total_estimado: number;
  valor_total_realizado: number;
  valor_medio_estimado: number;
  tempo_medio_dias: number;
}

const SituacoesPage = () => {
  const [situacoes, setSituacoes] = useState<Situacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [editingSituacao, setEditingSituacao] = useState<Situacao | null>(null);
  const [currentStats, setCurrentStats] = useState<SituacaoStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [filterFinalizadora, setFilterFinalizadora] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Total de registros
  const [totalCount, setTotalCount] = useState(0);

  const [formData, setFormData] = useState<SituacaoForm>({
    nome_situacao: '',
    descricao_situacao: '',
    eh_finalizadora: false,
    cor_hex: '#3498db',
    ativo: true
  });

  // Cores predefinidas para seleção rápida
  const predefinedColors = [
    { color: '#3498db', name: 'Azul' },
    { color: '#e74c3c', name: 'Vermelho' },
    { color: '#2ecc71', name: 'Verde' },
    { color: '#f39c12', name: 'Laranja' },
    { color: '#9b59b6', name: 'Roxo' },
    { color: '#1abc9c', name: 'Turquesa' },
    { color: '#f1c40f', name: 'Amarelo' },
    { color: '#34495e', name: 'Cinza Escuro' },
    { color: '#e67e22', name: 'Laranja Escuro' },
    { color: '#95a5a6', name: 'Cinza Claro' }
  ];

  useEffect(() => {
    loadSituacoes();
  }, [searchTerm, showInactive, filterFinalizadora]);

  // Auto-clear de mensagens
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadSituacoes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (!showInactive) params.append('ativo', 'true');
      if (filterFinalizadora !== 'all') params.append('finalizadora', filterFinalizadora);
      params.append('page', '1');
      params.append('limit', '9999'); // Carregar todos os registros

      const response = await api.get(`/situacoes?${params.toString()}`);
      
      if (response.data.data) {
        setSituacoes(response.data.data);
        setTotalCount(response.data.pagination?.total || 0);
      } else {
        setSituacoes(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar situações:', error);
      setError('Erro ao carregar situações');
    } finally {
      setLoading(false);
    }
  };

  const loadSituacaoStats = async (id: number) => {
    try {
      const response = await api.get(`/situacoes/${id}/stats`);
      setCurrentStats(response.data.data);
      setStatsDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setError('Erro ao carregar estatísticas da situação');
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      // Validações
      if (!formData.nome_situacao.trim()) {
        setError('Nome da situação é obrigatório');
        return;
      }
      
      if (editingSituacao) {
        await api.put(`/situacoes/${editingSituacao.id}`, formData);
        setSuccess('Situação atualizada com sucesso!');
      } else {
        await api.post('/situacoes', formData);
        setSuccess('Situação criada com sucesso!');
      }
      
      handleCloseDialog();
      loadSituacoes();
    } catch (error: any) {
      console.error('Erro ao salvar situação:', error);
      setError(error.response?.data?.message || 'Erro ao salvar situação');
    }
  };

  const handleDelete = async (situacao: Situacao) => {
    if (!window.confirm(`Tem certeza que deseja excluir a situação "${situacao.nome_situacao}"?`)) {
      return;
    }

    try {
      await api.delete(`/situacoes/${situacao.id}`);
      setSuccess('Situação excluída com sucesso!');
      loadSituacoes();
    } catch (error: any) {
      console.error('Erro ao excluir situação:', error);
      setError(error.response?.data?.message || 'Erro ao excluir situação');
    }
  };

  const handleEdit = (situacao: Situacao) => {
    setEditingSituacao(situacao);
    setFormData({
      nome_situacao: situacao.nome_situacao,
      descricao_situacao: situacao.descricao_situacao || '',
      eh_finalizadora: situacao.eh_finalizadora,
      cor_hex: situacao.cor_hex || '#3498db',
      ativo: situacao.ativo
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSituacao(null);
    setFormData({
      nome_situacao: '',
      descricao_situacao: '',
      eh_finalizadora: false,
      cor_hex: '#3498db',
      ativo: true
    });
  };

  const handleCloseStatsDialog = () => {
    setStatsDialogOpen(false);
    setCurrentStats(null);
  };

  // Funções de paginação removidas - mostrando todos os registros

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const isFormValid = formData.nome_situacao.trim();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          🏷️ Situações dos Processos {totalCount > 0 && `(${totalCount})`}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Adicionar Situação
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Situação</InputLabel>
              <Select
                value={filterFinalizadora}
                onChange={(e) => setFilterFinalizadora(e.target.value)}
                label="Tipo de Situação"
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="true">Finalizadoras</MenuItem>
                <MenuItem value="false">Intermediárias</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
              }
              label="Mostrar inativas"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Mensagens */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabela */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Situação</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Cor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : situacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Nenhuma situação encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                situacoes.map((situacao) => (
                  <TableRow key={situacao.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {situacao.nome_situacao}
                        </Typography>
                        {situacao.descricao_situacao && (
                          <Typography variant="caption" color="textSecondary">
                            {situacao.descricao_situacao}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {situacao.eh_finalizadora ? (
                          <CheckCircleIcon fontSize="small" color="success" />
                        ) : (
                          <RadioButtonUncheckedIcon fontSize="small" color="action" />
                        )}
                        <Typography variant="body2">
                          {situacao.eh_finalizadora ? 'Finalizadora' : 'Intermediária'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: situacao.cor_hex || '#3498db',
                            border: '1px solid #ccc'
                          }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          {situacao.cor_hex || '#3498db'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={situacao.ativo ? 'Ativo' : 'Inativo'}
                        color={situacao.ativo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver estatísticas">
                        <IconButton
                          size="small"
                          onClick={() => loadSituacaoStats(situacao.id)}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(situacao)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(situacao)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Paginação removida - mostrando todos os registros */}
      </Paper>

      {/* Modal de Edição */}
      <Dialog open={dialogOpen} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSituacao ? 'Editar' : 'Nova'} Situação
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da Situação *"
                value={formData.nome_situacao}
                onChange={(e) => setFormData({ ...formData, nome_situacao: e.target.value })}
                placeholder="Ex: Em Análise"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={formData.descricao_situacao}
                onChange={(e) => setFormData({ ...formData, descricao_situacao: e.target.value })}
                placeholder="Descrição detalhada da situação..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.eh_finalizadora}
                    onChange={(e) => setFormData({ ...formData, eh_finalizadora: e.target.checked })}
                  />
                }
                label="Situação finalizadora"
                sx={{ mb: 2 }}
              />
              <Typography variant="caption" color="textSecondary">
                Situações finalizadoras indicam que o processo foi concluído
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                }
                label="Situação ativa"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Cor da Situação
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                {predefinedColors.map(({ color, name }) => (
                  <Tooltip key={color} title={name}>
                    <Box
                      onClick={() => setFormData({ ...formData, cor_hex: color })}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: formData.cor_hex === color ? '3px solid #000' : '1px solid #ccc',
                        '&:hover': {
                          transform: 'scale(1.1)'
                        }
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
              <TextField
                fullWidth
                label="Cor personalizada (hex)"
                value={formData.cor_hex}
                onChange={(e) => setFormData({ ...formData, cor_hex: e.target.value })}
                placeholder="#3498db"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: formData.cor_hex,
                          border: '1px solid #ccc'
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained" color="primary">Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!isFormValid}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Estatísticas */}
      <Dialog open={statsDialogOpen} maxWidth="md" fullWidth>
        <DialogTitle>
          📊 Estatísticas - {currentStats?.nome_situacao}
        </DialogTitle>
        <DialogContent>
          {currentStats && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {currentStats.total_processos}
                  </Typography>
                  <Typography variant="body2">Total de Processos</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" style={{ color: currentStats.cor_hex }}>
                    {Math.round(currentStats.tempo_medio_dias)}
                  </Typography>
                  <Typography variant="body2">Dias Médios na Situação</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Chip
                    label={currentStats.eh_finalizadora ? 'Finalizadora' : 'Intermediária'}
                    color={currentStats.eh_finalizadora ? 'success' : 'warning'}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>Tipo de Situação</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(currentStats.valor_total_estimado)}
                  </Typography>
                  <Typography variant="body2">Valor Total Estimado</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(currentStats.valor_total_realizado)}
                  </Typography>
                  <Typography variant="body2">Valor Total Realizado</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatsDialog} variant="contained" color="primary">Fechar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SituacoesPage; 