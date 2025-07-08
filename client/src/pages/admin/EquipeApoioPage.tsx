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
  Support as SupportIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { EquipeApoio } from '../../types';

interface EquipeApoioForm {
  primeiro_nome: string;
  nome_apoio: string;
  email: string;
  telefone: string;
  ativo: boolean;
}

interface EquipeApoioStats {
  id: number;
  primeiro_nome: string;
  nome_apoio: string;
  email: string;
  ativo: boolean;
  total_processos_apoiados: number;
  valor_medio_processos: number;
  valor_total_processos: number;
  dias_desde_cadastro?: number;
}

const EquipeApoioPage = () => {
  const [membros, setMembros] = useState<EquipeApoio[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [editingMembro, setEditingMembro] = useState<EquipeApoio | null>(null);
  const [currentStats, setCurrentStats] = useState<EquipeApoioStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Total de registros
  const [totalCount, setTotalCount] = useState(0);

  const [formData, setFormData] = useState<EquipeApoioForm>({
    primeiro_nome: '',
    nome_apoio: '',
    email: '',
    telefone: '',
    ativo: true
  });

  useEffect(() => {
    loadMembros();
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

  const loadMembros = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (!showInactive) params.append('ativo', 'true');
      params.append('page', '1');
      params.append('limit', '9999'); // Carregar todos os registros

      const response = await api.get(`/equipe-apoio?${params.toString()}`);
      
      if (response.data.data) {
        setMembros(response.data.data);
        setTotalCount(response.data.pagination?.total || 0);
      } else {
        setMembros(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar equipe de apoio:', error);
      setError('Erro ao carregar equipe de apoio');
    } finally {
      setLoading(false);
    }
  };

  const loadMembroStats = async (id: number) => {
    try {
      const response = await api.get(`/equipe-apoio/${id}/stats`);
      setCurrentStats(response.data.data);
      setStatsDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setError('Erro ao carregar estatísticas do membro');
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      // Validações
      if (!formData.primeiro_nome.trim()) {
        setError('Primeiro nome é obrigatório');
        return;
      }
      
      if (!formData.nome_apoio.trim()) {
        setError('Nome completo é obrigatório');
        return;
      }
      
      if (editingMembro) {
        await api.put(`/equipe-apoio/${editingMembro.id}`, formData);
        setSuccess('Membro da equipe atualizado com sucesso!');
      } else {
        await api.post('/equipe-apoio', formData);
        setSuccess('Membro da equipe criado com sucesso!');
      }
      
      handleCloseDialog();
      loadMembros();
    } catch (error: any) {
      console.error('Erro ao salvar membro:', error);
      setError(error.response?.data?.message || 'Erro ao salvar membro da equipe');
    }
  };

  const handleDelete = async (membro: EquipeApoio) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${membro.primeiro_nome}" da equipe?`)) {
      return;
    }

    try {
      await api.delete(`/equipe-apoio/${membro.id}`);
      setSuccess('Membro da equipe excluído com sucesso!');
      loadMembros();
    } catch (error: any) {
      console.error('Erro ao excluir membro:', error);
      setError(error.response?.data?.message || 'Erro ao excluir membro da equipe');
    }
  };

  const handleEdit = (membro: EquipeApoio) => {
    setEditingMembro(membro);
    setFormData({
      primeiro_nome: membro.primeiro_nome,
      nome_apoio: membro.nome_apoio,
      email: membro.email || '',
      telefone: membro.telefone || '',
      ativo: membro.ativo
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMembro(null);
    setFormData({
      primeiro_nome: '',
      nome_apoio: '',
      email: '',
      telefone: '',
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

  const getInitials = (nome: string) => {
    return nome.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isFormValid = formData.primeiro_nome.trim() && formData.nome_apoio.trim();

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 4 }, pb: 4, mt: 4 }}>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          👨‍💼 Equipe de Apoio {totalCount > 0 && `(${totalCount})`}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Adicionar Membro
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
          <Grid item xs={12} md={3}>
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
                <TableCell>Membro</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : membros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Nenhum membro da equipe encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                membros.map((membro) => (
                  <TableRow key={membro.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(membro.nome_apoio)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {membro.nome_apoio}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {membro.primeiro_nome}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {membro.email && (
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {membro.email}
                            </Typography>
                          </Box>
                        )}
                        {membro.telefone && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {membro.telefone}
                            </Typography>
                          </Box>
                        )}
                        {!membro.email && !membro.telefone && (
                          <Typography variant="body2" color="textSecondary">
                            Sem contato
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={membro.ativo ? 'Ativo' : 'Inativo'}
                        color={membro.ativo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver estatísticas">
                        <IconButton
                          size="small"
                          onClick={() => loadMembroStats(membro.id)}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(membro)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(membro)}
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
          {editingMembro ? 'Editar' : 'Novo'} Membro da Equipe
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
                value={formData.nome_apoio}
                onChange={(e) => setFormData({ ...formData, nome_apoio: e.target.value })}
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
                placeholder="joao.silva@supel.gov.br"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
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
                label="Membro ativo"
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
          📊 Estatísticas - {currentStats?.nome_apoio}
        </DialogTitle>
        <DialogContent>
          {currentStats && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {currentStats.total_processos_apoiados || 0}
                  </Typography>
                  <Typography variant="body2">Processos Apoiados</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {currentStats.dias_desde_cadastro || 0}
                  </Typography>
                  <Typography variant="body2">Dias na Equipe</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Chip
                    label={currentStats.ativo ? 'Ativo' : 'Inativo'}
                    color={currentStats.ativo ? 'success' : 'default'}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>Status</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(currentStats.valor_total_processos || 0)}
                  </Typography>
                  <Typography variant="body2">Valor Total dos Processos</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="info.main">
                    {formatCurrency(currentStats.valor_medio_processos || 0)}
                  </Typography>
                  <Typography variant="body2">Valor Médio por Processo</Typography>
                </Paper>
              </Grid>
              {currentStats.email && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon color="action" />
                      <Typography variant="body1">{currentStats.email}</Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}
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

export default EquipeApoioPage; 