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
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { Responsavel } from '../../types';

interface ResponsavelForm {
  primeiro_nome: string;
  nome_responsavel: string;
  email: string;
  telefone: string;
  ativo: boolean;
}

interface ResponsavelStats {
  id: number;
  primeiro_nome: string;
  nome_responsavel: string;
  total_processos: number;
  processos_concluidos: number;
  processos_andamento: number;
  valor_total_estimado: number;
  valor_total_realizado: number;
  valor_medio_estimado: number;
}

const ResponsaveisPage = () => {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [editingResponsavel, setEditingResponsavel] = useState<Responsavel | null>(null);
  const [currentStats, setCurrentStats] = useState<ResponsavelStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Paginação
  const [page, setPage] = useState(0);
  // Removida paginação - mostrar todos os dados
  const [totalCount, setTotalCount] = useState(0);

  const [formData, setFormData] = useState<ResponsavelForm>({
    primeiro_nome: '',
    nome_responsavel: '',
    email: '',
    telefone: '',
    ativo: true
  });

  useEffect(() => {
    loadResponsaveis();
  }, [searchTerm, showInactive]);

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

  const loadResponsaveis = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (!showInactive) params.append('ativo', 'true');
      params.append('page', '1');
      params.append('limit', '1000'); // Mostrar todos

      const response = await api.get(`/responsaveis?${params.toString()}`);
      
      if (response.data.data) {
        setResponsaveis(response.data.data);
        setTotalCount(response.data.pagination?.total || 0);
      } else {
        setResponsaveis(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error);
      setError('Erro ao carregar responsáveis');
    } finally {
      setLoading(false);
    }
  };

  const loadResponsavelStats = async (id: number) => {
    try {
      const response = await api.get(`/responsaveis/${id}/stats`);
      setCurrentStats(response.data.data);
      setStatsDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setError('Erro ao carregar estatísticas do responsável');
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      // Validações
      if (!formData.primeiro_nome.trim() || !formData.nome_responsavel.trim()) {
        setError('Primeiro nome e nome completo são obrigatórios');
        return;
      }

      if (formData.email && !formData.email.includes('@')) {
        setError('Email deve ter formato válido');
        return;
      }
      
      if (editingResponsavel) {
        await api.put(`/responsaveis/${editingResponsavel.id}`, formData);
        setSuccess('Responsável atualizado com sucesso!');
      } else {
        await api.post('/responsaveis', formData);
        setSuccess('Responsável criado com sucesso!');
      }
      
      handleCloseDialog();
      loadResponsaveis();
    } catch (error: any) {
      console.error('Erro ao salvar responsável:', error);
      setError(error.response?.data?.message || 'Erro ao salvar responsável');
    }
  };

  const handleDelete = async (responsavel: Responsavel) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${responsavel.primeiro_nome}?`)) {
      return;
    }

    try {
      await api.delete(`/responsaveis/${responsavel.id}`);
      setSuccess('Responsável excluído com sucesso!');
      loadResponsaveis();
    } catch (error: any) {
      console.error('Erro ao excluir responsável:', error);
      setError(error.response?.data?.message || 'Erro ao excluir responsável');
    }
  };

  const handleEdit = (responsavel: Responsavel) => {
    setEditingResponsavel(responsavel);
    setFormData({
      primeiro_nome: responsavel.primeiro_nome,
      nome_responsavel: responsavel.nome_responsavel,
      email: responsavel.email || '',
      telefone: responsavel.telefone || '',
      ativo: responsavel.ativo
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingResponsavel(null);
    setFormData({
      primeiro_nome: '',
      nome_responsavel: '',
      email: '',
      telefone: '',
      ativo: true
    });
  };

  const handleCloseStatsDialog = () => {
    setStatsDialogOpen(false);
    setCurrentStats(null);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Função removida devido à remoção da paginação

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const isFormValid = formData.primeiro_nome.trim() && formData.nome_responsavel.trim();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <PersonIcon fontSize="large" color="primary" />
          <Typography variant="h4" component="h1">
            👥 Responsáveis
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Adicionar Responsável
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar por nome ou email..."
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
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
              }
              label="Mostrar inativos"
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
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Telefone</TableCell>
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
              ) : responsaveis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Nenhum responsável encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                responsaveis.map((responsavel) => (
                  <TableRow key={responsavel.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            width: 40,
                            height: 40,
                            fontSize: '0.875rem'
                          }}
                        >
                          {responsavel.primeiro_nome.charAt(0).toUpperCase()}
                          {responsavel.nome_responsavel.split(' ').pop()?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {responsavel.nome_responsavel}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {responsavel.primeiro_nome}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {responsavel.email && <EmailIcon fontSize="small" />}
                        <Typography variant="body2">
                          {responsavel.email || '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {responsavel.telefone && <PhoneIcon fontSize="small" />}
                        <Typography variant="body2">
                          {responsavel.telefone || '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={responsavel.ativo ? 'Ativo' : 'Inativo'}
                        color={responsavel.ativo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver estatísticas">
                        <IconButton
                          size="small"
                          onClick={() => loadResponsavelStats(responsavel.id)}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(responsavel)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(responsavel)}
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

      </Paper>

      {/* Modal de Edição */}
      <Dialog open={dialogOpen} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingResponsavel ? 'Editar' : 'Novo'} Responsável
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primeiro Nome *"
                value={formData.primeiro_nome}
                onChange={(e) => setFormData({ ...formData, primeiro_nome: e.target.value })}
                placeholder="Ex: João"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Completo *"
                value={formData.nome_responsavel}
                onChange={(e) => setFormData({ ...formData, nome_responsavel: e.target.value })}
                placeholder="Ex: João Silva Santos"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ex: joao.silva@supel.gov.br"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="Ex: (65) 99999-9999"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                }
                label="Responsável ativo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
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
          📊 Estatísticas - {currentStats?.nome_responsavel}
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
                  <Typography variant="h4" color="success.main">
                    {currentStats.processos_concluidos}
                  </Typography>
                  <Typography variant="body2">Concluídos</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {currentStats.processos_andamento}
                  </Typography>
                  <Typography variant="body2">Em Andamento</Typography>
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
          <Button onClick={handleCloseStatsDialog}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ResponsaveisPage; 