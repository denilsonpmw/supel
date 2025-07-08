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
import { Modalidade } from '../../types';

interface ModalidadeForm {
  sigla_modalidade: string;
  nome_modalidade: string;
  descricao_modalidade: string;
  cor_hex: string;
  ativo: boolean;
}

interface ModalidadeStats {
  sigla_modalidade: string;
  nome_modalidade: string;
  total_processos: number;
  processos_concluidos: number;
  processos_andamento: number;
  valor_total_estimado: number;
  valor_total_realizado: number;
  valor_medio_estimado: number;
}

const ModalidadesPage = () => {
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [editingModalidade, setEditingModalidade] = useState<Modalidade | null>(null);
  const [currentStats, setCurrentStats] = useState<ModalidadeStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const [formData, setFormData] = useState<ModalidadeForm>({
    sigla_modalidade: '',
    nome_modalidade: '',
    descricao_modalidade: '',
    cor_hex: '#3498db',
    ativo: true
  });

  // Cores predefinidas para seleção rápida
  const predefinedColors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#f1c40f', '#34495e', '#e67e22', '#95a5a6'
  ];

  useEffect(() => {
    loadModalidades();
  }, [searchTerm, showInactive]);

  const loadModalidades = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (!showInactive) params.append('ativo', 'true');

      const response = await api.get(`/modalidades?${params.toString()}`);
      setModalidades(response.data);
      setTotalCount(response.data?.length || 0);
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error);
      setError('Erro ao carregar modalidades');
    } finally {
      setLoading(false);
    }
  };

  const loadModalidadeStats = async (id: number) => {
    try {
      const response = await api.get(`/modalidades/${id}/stats`);
      setCurrentStats(response.data);
      setStatsDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setError('Erro ao carregar estatísticas da modalidade');
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (editingModalidade) {
        await api.put(`/modalidades/${editingModalidade.id}`, formData);
        setSuccess('Modalidade atualizada com sucesso!');
      } else {
        await api.post('/modalidades', formData);
        setSuccess('Modalidade criada com sucesso!');
      }
      
      handleCloseDialog();
      loadModalidades();
    } catch (error: any) {
      console.error('Erro ao salvar modalidade:', error);
      setError(error.response?.data?.error || 'Erro ao salvar modalidade');
    }
  };

  const handleDelete = async (modalidade: Modalidade) => {
    if (!window.confirm(`Tem certeza que deseja excluir a modalidade ${modalidade.sigla_modalidade}?`)) {
      return;
    }

    try {
      await api.delete(`/modalidades/${modalidade.id}`);
      setSuccess('Modalidade excluída com sucesso!');
      loadModalidades();
    } catch (error: any) {
      console.error('Erro ao excluir modalidade:', error);
      setError(error.response?.data?.error || 'Erro ao excluir modalidade');
    }
  };

  const handleEdit = (modalidade: Modalidade) => {
    setEditingModalidade(modalidade);
    setFormData({
      sigla_modalidade: modalidade.sigla_modalidade,
      nome_modalidade: modalidade.nome_modalidade,
      descricao_modalidade: modalidade.descricao_modalidade || '',
      cor_hex: modalidade.cor_hex || '#3498db',
      ativo: modalidade.ativo
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingModalidade(null);
    setFormData({
      sigla_modalidade: '',
      nome_modalidade: '',
      descricao_modalidade: '',
      cor_hex: '#3498db',
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

  const isFormValid = formData.sigla_modalidade.trim() && formData.nome_modalidade.trim();

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 4 }, pb: 4, mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          📑 Modalidades de Licitação {totalCount > 0 && `(${totalCount})`}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Adicionar Modalidade
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
              <TableCell><strong>Nome</strong></TableCell>
              <TableCell><strong>Descrição</strong></TableCell>
              <TableCell><strong>Cor</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : modalidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Nenhuma modalidade encontrada
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              modalidades.map((modalidade) => (
                <TableRow key={modalidade.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {modalidade.sigla_modalidade}
                    </Typography>
                  </TableCell>
                  <TableCell>{modalidade.nome_modalidade}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {modalidade.descricao_modalidade || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          backgroundColor: modalidade.cor_hex || '#3498db',
                          borderRadius: '50%',
                          border: '1px solid #ddd'
                        }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {modalidade.cor_hex || '#3498db'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={modalidade.ativo ? 'Ativa' : 'Inativa'}
                      color={modalidade.ativo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Ver estatísticas">
                        <IconButton
                          size="small"
                          onClick={() => loadModalidadeStats(modalidade.id)}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(modalidade)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(modalidade)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para criar/editar modalidade */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingModalidade ? 'Editar Modalidade' : 'Nova Modalidade'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Sigla *"
              value={formData.sigla_modalidade}
              onChange={(e) => setFormData({ ...formData, sigla_modalidade: e.target.value.toUpperCase() })}
              placeholder="Ex: PE, PP, CC"
              inputProps={{ maxLength: 20 }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Nome *"
              value={formData.nome_modalidade}
              onChange={(e) => setFormData({ ...formData, nome_modalidade: e.target.value })}
              placeholder="Ex: Pregão Eletrônico"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={3}
              value={formData.descricao_modalidade}
              onChange={(e) => setFormData({ ...formData, descricao_modalidade: e.target.value })}
              placeholder="Descrição opcional da modalidade"
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Cor de identificação
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {predefinedColors.map((color) => (
                  <Grid item key={color}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: color,
                        border: formData.cor_hex === color ? '3px solid #000' : '1px solid #ddd',
                        borderRadius: '50%',
                        cursor: 'pointer'
                      }}
                      onClick={() => setFormData({ ...formData, cor_hex: color })}
                    />
                  </Grid>
                ))}
              </Grid>
              
              <TextField
                fullWidth
                label="Cor personalizada"
                type="color"
                value={formData.cor_hex}
                onChange={(e) => setFormData({ ...formData, cor_hex: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          backgroundColor: formData.cor_hex,
                          borderRadius: '50%',
                          border: '1px solid #ddd'
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                />
              }
              label="Modalidade ativa"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained" color="primary">Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!isFormValid}
          >
            {editingModalidade ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de estatísticas */}
      <Dialog open={statsDialogOpen} onClose={handleCloseStatsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Estatísticas - {currentStats?.sigla_modalidade}
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
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Valores Financeiros
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

export default ModalidadesPage;