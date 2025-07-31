import { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  GetApp as ExportIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { UnidadeGestora } from '../../types';
import { formatServerDateBR } from '../../utils/dateUtils';

interface UnidadeGestoraForm {
  sigla: string;
  nome_completo_unidade: string;
  ativo: boolean;
}

interface UnidadeGestoraStats {
  sigla: string;
  nome_completo_unidade: string;
  total_processos: number;
  processos_concluidos: number;
  processos_andamento: number;
  valor_total_estimado: number;
  valor_total_realizado: number;
  valor_medio_estimado: number;
  modalidades_utilizadas: number;
  responsaveis_envolvidos: number;
}

// Função utilitária para parse seguro de datas YYYY-MM-DD
function parseDateBr(dateStr: string | undefined) {
  if (!dateStr) return null;
  
  // Se já é uma data válida no formato YYYY-MM-DD, usar diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Tentar converter outras strings de data
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}

const UnidadesGestorasPage = () => {
  const [unidadesGestoras, setUnidadesGestoras] = useState<UnidadeGestora[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<UnidadeGestora | null>(null);
  const [currentStats, setCurrentStats] = useState<UnidadeGestoraStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const [formData, setFormData] = useState<UnidadeGestoraForm>({
    sigla: '',
    nome_completo_unidade: '',
    ativo: true
  });

  useEffect(() => {
    loadUnidadesGestoras();
  }, [searchTerm, showInactive]);

  const loadUnidadesGestoras = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (!showInactive) params.append('ativo', 'true');

      const response = await api.get(`/unidades-gestoras?${params.toString()}`);
      setUnidadesGestoras(response.data);
      setTotalCount(response.data.length);
    } catch (error) {
      console.error('Erro ao carregar unidades gestoras:', error);
      setError('Erro ao carregar unidades gestoras');
    } finally {
      setLoading(false);
    }
  };

  const loadUnidadeGestoraStats = async (id: number) => {
    try {
      const response = await api.get(`/unidades-gestoras/${id}/stats`);
      setCurrentStats(response.data);
      setStatsDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setError('Erro ao carregar estatísticas da unidade gestora');
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (editingUnidade) {
        await api.put(`/unidades-gestoras/${editingUnidade.id}`, formData);
        setSuccess('Unidade gestora atualizada com sucesso!');
      } else {
        await api.post('/unidades-gestoras', formData);
        setSuccess('Unidade gestora criada com sucesso!');
      }
      
      handleCloseDialog();
      loadUnidadesGestoras();
    } catch (error: any) {
      console.error('Erro ao salvar unidade gestora:', error);
      setError(error.response?.data?.error || 'Erro ao salvar unidade gestora');
    }
  };

  const handleDelete = async (unidade: UnidadeGestora) => {
    if (!window.confirm(`Tem certeza que deseja excluir a unidade gestora ${unidade.sigla}?`)) {
      return;
    }

    try {
      await api.delete(`/unidades-gestoras/${unidade.id}`);
      setSuccess('Unidade gestora excluída com sucesso!');
      loadUnidadesGestoras();
    } catch (error: any) {
      console.error('Erro ao excluir unidade gestora:', error);
      setError(error.response?.data?.error || 'Erro ao excluir unidade gestora');
    }
  };

  const handleEdit = (unidade: UnidadeGestora) => {
    setEditingUnidade(unidade);
    setFormData({
      sigla: unidade.sigla,
      nome_completo_unidade: unidade.nome_completo_unidade,
      ativo: unidade.ativo
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUnidade(null);
    setFormData({
      sigla: '',
      nome_completo_unidade: '',
      ativo: true
    });
  };

  const handleCloseStatsDialog = () => {
    setStatsDialogOpen(false);
    setCurrentStats(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isFormValid = formData.sigla.trim() && formData.nome_completo_unidade.trim();

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 4 }, pb: 4, mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          🏢 Unidades Gestoras {totalCount > 0 && `(${totalCount})`}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Adicionar Unidade Gestora
        </Button>
      </Box>

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

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar por sigla ou nome..."
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
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => {/* TODO: Implementar exportação */}}
              fullWidth
            >
              Exportar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Sigla</strong></TableCell>
              <TableCell><strong>Nome Completo</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Criado em</strong></TableCell>
              <TableCell align="center"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : unidadesGestoras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Nenhuma unidade gestora encontrada
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              unidadesGestoras.map((unidade) => (
                <TableRow key={unidade.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {unidade.sigla}
                    </Typography>
                  </TableCell>
                  <TableCell>{unidade.nome_completo_unidade}</TableCell>
                  <TableCell>
                    <Chip
                      label={unidade.ativo ? 'Ativa' : 'Inativa'}
                      color={unidade.ativo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {formatServerDateBR(unidade.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver estatísticas">
                      <IconButton
                        size="small"
                        onClick={() => loadUnidadeGestoraStats(unidade.id)}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(unidade)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(unidade)}
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

      {/* Dialog para criar/editar unidade gestora */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUnidade ? 'Editar Unidade Gestora' : 'Nova Unidade Gestora'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Sigla *"
              value={formData.sigla}
              onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
              placeholder="Ex: SUPEL, SEDUC, SESAU"
              inputProps={{ maxLength: 20 }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Nome Completo *"
              value={formData.nome_completo_unidade}
              onChange={(e) => setFormData({ ...formData, nome_completo_unidade: e.target.value })}
              placeholder="Ex: Superintendência de Licitações"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                />
              }
              label="Unidade gestora ativa"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!isFormValid}
          >
            {editingUnidade ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de estatísticas */}
      <Dialog open={statsDialogOpen} onClose={handleCloseStatsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Estatísticas - {currentStats?.sigla}
        </DialogTitle>
        <DialogContent>
          {currentStats && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {currentStats.total_processos}
                  </Typography>
                  <Typography variant="body2">Total de Processos</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">
                    {currentStats.processos_concluidos}
                  </Typography>
                  <Typography variant="body2">Processos Concluídos</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main">
                    {currentStats.processos_andamento}
                  </Typography>
                  <Typography variant="body2">Em Andamento</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="info.main">
                    {formatCurrency(currentStats.valor_medio_estimado)}
                  </Typography>
                  <Typography variant="body2">Valor Médio</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="secondary.main">
                    {currentStats.modalidades_utilizadas}
                  </Typography>
                  <Typography variant="body2">Modalidades Utilizadas</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.dark">
                    {currentStats.responsaveis_envolvidos}
                  </Typography>
                  <Typography variant="body2">Responsáveis Envolvidos</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {currentStats.nome_completo_unidade}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total Estimado:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(currentStats.valor_total_estimado)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Realizado:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(currentStats.valor_total_realizado)}
                    </Typography>
                  </Box>
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

export default UnidadesGestorasPage; 