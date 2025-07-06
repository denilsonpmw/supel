import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  VpnKey as VpnKeyIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { userService } from '../../services/api';

interface User {
  id: number;
  email: string;
  nome: string;
  perfil: 'admin' | 'usuario';
  paginas_permitidas: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface UserFormData {
  email: string;
  nome: string;
  perfil: 'admin' | 'usuario';
  paginas_permitidas: string[];
  ativo: boolean;
}

const PAGINAS_DISPONIVEIS = [
  { id: 'dashboard', nome: 'Dashboard', descricao: 'Visualizar métricas e gráficos' },
  { id: 'processos', nome: 'Processos', descricao: 'Gerenciar processos licitatórios' },
  { id: 'relatorios', nome: 'Relatórios', descricao: 'Gerar e visualizar relatórios' },
  { id: 'modalidades', nome: 'Modalidades', descricao: 'Gerenciar modalidades de licitação' },
  { id: 'unidades-gestoras', nome: 'Unidades Gestoras', descricao: 'Gerenciar unidades gestoras' },
  { id: 'responsaveis', nome: 'Responsáveis', descricao: 'Gerenciar responsáveis' },
  { id: 'situacoes', nome: 'Situações', descricao: 'Gerenciar situações dos processos' },
  { id: 'equipe-apoio', nome: 'Equipe de Apoio', descricao: 'Gerenciar equipe de apoio' },
  { id: 'usuarios', nome: 'Usuários', descricao: 'Gerenciar usuários do sistema' },
  { id: 'contador-responsaveis', nome: 'Contador de Responsáveis', descricao: 'Análise de processos por responsável' },
  { id: 'auditoria', nome: 'Auditoria', descricao: 'Sistema de auditoria e logs' }
];

const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados do formulário
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    nome: '',
    perfil: 'usuario',
    paginas_permitidas: ['dashboard', 'processos', 'relatorios'],
    ativo: true
  });

  // Estados do modal de token
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState<number | null>(null); // Armazena o ID do usuário

  // Carregar usuários
  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.listarUsuarios();
      setUsuarios(response || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  // Limpar mensagens após 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Abrir dialog para novo usuário
  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      nome: '',
      perfil: 'usuario',
      paginas_permitidas: ['dashboard', 'processos', 'relatorios'],
      ativo: true
    });
    setDialogOpen(true);
  };

  // Abrir dialog para editar usuário
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      nome: user.nome,
      perfil: user.perfil,
      paginas_permitidas: user.paginas_permitidas || [],
      ativo: user.ativo
    });
    setDialogOpen(true);
  };

  // Fechar dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      nome: '',
      perfil: 'usuario',
      paginas_permitidas: ['dashboard', 'processos', 'relatorios'],
      ativo: true
    });
  };

  // Salvar usuário
  const handleSaveUser = async () => {
    try {
      setError(null);

      if (!formData.email || !formData.nome) {
        setError('Email e nome são obrigatórios');
        return;
      }

      if (editingUser) {
        // Atualizar usuário existente
        await userService.atualizarUsuario(editingUser.id, formData);
        setSuccess('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        await userService.criarUsuario(formData);
        setSuccess('Usuário criado com sucesso!');
      }

      handleCloseDialog();
      loadUsuarios();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setError(err.response?.data?.error || 'Erro ao salvar usuário');
    }
  };

  // Excluir usuário
  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${user.nome}"?`)) {
      return;
    }

    try {
      setError(null);
      await userService.excluirUsuario(user.id);
      setSuccess('Usuário excluído com sucesso!');
      loadUsuarios();
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      setError(err.response?.data?.error || 'Erro ao excluir usuário');
    }
  };

  // Alterar status do usuário
  const handleToggleStatus = async (user: User) => {
    try {
      setError(null);
      const { id, created_at, updated_at, ...userData } = user;
      const updatedData = { ...userData, paginas_permitidas: user.paginas_permitidas || [], ativo: !user.ativo };
      await userService.atualizarUsuario(user.id, updatedData);
      setSuccess(`Usuário ${!user.ativo ? 'ativado' : 'desativado'} com sucesso!`);
      loadUsuarios();
    } catch (err: any) {
      console.error('Erro ao alterar status do usuário:', err);
      setError(err.response?.data?.error || 'Erro ao alterar status do usuário');
    }
  };

  // Gerar token de redefinição
  const handleGenerateToken = async (user: User) => {
    try {
      setTokenLoading(user.id);
      setError(null);
      const response = await userService.gerarTokenResetAdmin(user.id);
      setGeneratedToken(response.data.token);
      setTokenModalOpen(true);
    } catch (err: any) {
      console.error('Erro ao gerar token:', err);
      setError(err.response?.data?.error || 'Erro ao gerar token de redefinição');
    } finally {
      setTokenLoading(null);
    }
  };

  // Copiar token para a área de transferência
  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setSuccess('Token copiado para a área de transferência!');
    }
  };

  // Gerar iniciais do nome
  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Cor do avatar baseada no perfil
  const getAvatarColor = (perfil: string) => {
    return perfil === 'admin' ? '#f44336' : '#2196f3';
  };

  // Formatear data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 4 }, pb: 4, mt: 4 }}>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          👥 Gerenciamento de Usuários
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Novo Usuário
        </Button>
      </Box>

      {/* Alertas */}
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

      {/* Estatísticas */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Usuários
              </Typography>
              <Typography variant="h4">
                {usuarios.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Administradores
              </Typography>
              <Typography variant="h4" color="error">
                {usuarios.filter(u => u.perfil === 'admin').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Usuários Comuns
              </Typography>
              <Typography variant="h4" color="primary">
                {usuarios.filter(u => u.perfil === 'usuario').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Usuários Ativos
              </Typography>
              <Typography variant="h4" color="success.main">
                {usuarios.filter(u => u.ativo).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de usuários */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuário</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Perfil</TableCell>
                  <TableCell>Páginas Permitidas</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Criado em</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            bgcolor: getAvatarColor(user.perfil),
                            width: 40,
                            height: 40
                          }}
                        >
                          {user.perfil === 'admin' ? <AdminIcon /> : getInitials(user.nome)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.nome}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {user.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.perfil}
                        color={user.perfil === 'admin' ? 'error' : 'primary'}
                        size="small"
                        icon={user.perfil === 'admin' ? <AdminIcon /> : <PersonIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {user.paginas_permitidas?.slice(0, 3).map((pagina) => (
                          <Chip
                            key={pagina}
                            label={PAGINAS_DISPONIVEIS.find(p => p.id === pagina)?.nome || pagina}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {user.paginas_permitidas?.length > 3 && (
                          <Chip
                            label={`+${user.paginas_permitidas.length - 3}`}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.ativo}
                        onChange={() => handleToggleStatus(user)}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(user.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar usuário">
                        <IconButton
                          size="small"
                          onClick={() => handleEditUser(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Gerar token de redefinição de senha">
                        <span>
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleGenerateToken(user)}
                            disabled={tokenLoading === user.id}
                          >
                            {tokenLoading === user.id ? <CircularProgress size={20} /> : <VpnKeyIcon />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Excluir usuário">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {usuarios.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                Nenhum usuário encontrado
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Clique em "Novo Usuário" para adicionar o primeiro usuário
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de formulário */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
              disabled={!!editingUser} // Email não pode ser editado
            />

            <TextField
              label="Nome Completo"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Perfil</InputLabel>
              <Select
                value={formData.perfil}
                onChange={(e) => setFormData({ ...formData, perfil: e.target.value as 'admin' | 'usuario' })}
                label="Perfil"
              >
                <MenuItem value="usuario">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon />
                    Usuário Comum
                  </Box>
                </MenuItem>
                <MenuItem value="admin">
                  <Box display="flex" alignItems="center" gap={1}>
                    <AdminIcon />
                    Administrador
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Páginas Permitidas</InputLabel>
              <Select
                multiple
                value={formData.paginas_permitidas}
                onChange={(e: SelectChangeEvent<string[]>) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    paginas_permitidas: typeof value === 'string' ? value.split(',') : value
                  });
                }}
                input={<OutlinedInput label="Páginas Permitidas" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={PAGINAS_DISPONIVEIS.find(p => p.id === value)?.nome || value}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
                disabled={formData.perfil === 'admin'} // Admin tem acesso total
              >
                {PAGINAS_DISPONIVEIS.map((pagina) => (
                  <MenuItem key={pagina.id} value={pagina.id}>
                    <Box>
                      <Typography variant="subtitle2">
                        {pagina.nome}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {pagina.descricao}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.perfil === 'admin' && (
              <Alert severity="info">
                Administradores têm acesso total a todas as páginas do sistema.
              </Alert>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                />
              }
              label="Usuário ativo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
          >
            {editingUser ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog do Token Gerado */}
      <Dialog
        open={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Token de Redefinição Gerado</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            O token abaixo foi gerado para o usuário. Entregue-o de forma segura.
            O token é válido por 1 hora.
          </Typography>
          <Box
            sx={{
              p: 2,
              my: 2,
              backgroundColor: 'grey.200',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'monospace',
              fontSize: '1.2rem'
            }}
          >
            {generatedToken}
            <Tooltip title="Copiar Token">
              <IconButton onClick={handleCopyToken}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTokenModalOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsuariosPage; 