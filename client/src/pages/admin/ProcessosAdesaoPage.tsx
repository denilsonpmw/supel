import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  processosAdesaoService, 
  unidadesGestorasService, 
  situacoesService 
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ProcessoAdesao {
  id: number;
  nup: string;
  objeto: string;
  ug_id: number;
  valor: number;
  fornecedor: string;
  situacao_id: number;
  data_entrada: string;
  data_situacao: string;
  observacoes?: string;
  unidade_gestora_sigla?: string;
  nome_situacao?: string;
  situacao_cor_hex?: string;
}

interface ProcessoAdesaoForm {
  nup: string;
  objeto: string;
  ug_id: number | '';
  valor: number | '';
  fornecedor: string;
  situacao_id: number | '';
  data_entrada: string;
  data_situacao: string;
  observacoes: string;
}

export default function ProcessosAdesaoPage() {
  const { user } = useAuth();
  const [adesoes, setAdesoes] = useState<ProcessoAdesao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAdesao, setEditingAdesao] = useState<ProcessoAdesao | null>(null);
  
  const [form, setForm] = useState<ProcessoAdesaoForm>({
    nup: '',
    objeto: '',
    ug_id: '',
    valor: '',
    fornecedor: '',
    situacao_id: '',
    data_entrada: new Date().toISOString().split('T')[0],
    data_situacao: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  const [unidadesGestoras, setUnidadesGestoras] = useState<any[]>([]);
  const [situacoes, setSituacoes] = useState<any[]>([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    carregarDados();
    carregarDadosDeApoio();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const response = await processosAdesaoService.list({ search: searchTerm });
      setAdesoes(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar adesões:', error);
      showSnackbar('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosDeApoio = async () => {
    try {
      const [ugRes, sitRes] = await Promise.all([
        unidadesGestorasService.list({ ativo: true, limit: 100 }),
        situacoesService.list({ ativo: true, limit: 100 })
      ]);
      setUnidadesGestoras(ugRes);
      setSituacoes(sitRes.data || sitRes);
    } catch (error) {
      console.error('Erro ao carregar UGs e Situações', error);
    }
  };

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString.split('T')[0]);
      // Retain timezoneless formatting logic to avoid shift
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  // Máscara para NUP: 6 dígitos + "/" + 4 dígitos de ano
  const aplicarMascaraNup = (valor: string): string => {
    const digitos = valor.replace(/\D/g, '');
    if (digitos.length <= 6) return digitos; 
    const numero = digitos.slice(0, 6);
    const ano = digitos.slice(6, 10);
    return `${numero}/${ano}`;
  };

  const handleNupChange = (value: string) => {
    setForm(prev => ({ ...prev, nup: aplicarMascaraNup(value) }));
  };

  // Utilitário para formatar moeda brasileira em tempo real
  const formatarMoedaBR = (valorDigitado: string) => {
    const somenteDigitos = valorDigitado.toString().replace(/\D/g, '');
    const numero = parseInt(somenteDigitos || '0', 10);
    const valor = numero / 100;
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleValorChange = (value: string) => {
    const valorFormatado = formatarMoedaBR(value);
    const numero = parseFloat(valorFormatado.replace(/\./g, '').replace(',', '.'));
    setForm(prev => ({ 
      ...prev, 
      valor: isNaN(numero) ? '' : Number(numero.toFixed(2)) 
    }));
  };

  const getValorFormatadoParaInput = () => {
    if (form.valor === '' || form.valor === null || form.valor === undefined) return '';
    const num = typeof form.valor === 'string' ? parseFloat(form.valor) : form.valor;
    if (isNaN(num)) return '';
    return formatarMoedaBR(num.toFixed(2));
  };

  const handleOpenDialog = (adesao?: ProcessoAdesao) => {
    if (adesao) {
      setEditingAdesao(adesao);
      setForm({
         nup: adesao.nup,
         objeto: adesao.objeto,
         ug_id: adesao.ug_id,
         valor: adesao.valor,
         fornecedor: adesao.fornecedor,
         situacao_id: adesao.situacao_id,
         data_entrada: adesao.data_entrada?.split('T')[0] || '',
         data_situacao: adesao.data_situacao?.split('T')[0] || '',
         observacoes: adesao.observacoes || ''
      });
    } else {
      setEditingAdesao(null);
      setForm({
        nup: '',
        objeto: '',
        ug_id: '',
        valor: '',
        fornecedor: '',
        situacao_id: '',
        data_entrada: new Date().toISOString().split('T')[0],
        data_situacao: new Date().toISOString().split('T')[0],
        observacoes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...form,
        valor: typeof form.valor === 'string' ? parseFloat(form.valor.replace(',', '.')) : form.valor
      };
      
      if (editingAdesao) {
        await processosAdesaoService.update(editingAdesao.id, dataToSave);
        showSnackbar('Adesão atualizada com sucesso', 'success');
      } else {
        await processosAdesaoService.create(dataToSave);
        showSnackbar('Adesão criada com sucesso', 'success');
      }
      setOpenDialog(false);
      carregarDados();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao salvar';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleDelete = async (adesao: ProcessoAdesao) => {
    if (window.confirm('Tem certeza que deseja excluir o NUP ' + adesao.nup + '?')) {
      try {
        await processosAdesaoService.delete(adesao.id);
        showSnackbar('Excluído com sucesso', 'success');
        carregarDados();
      } catch (error) {
        showSnackbar('Erro ao excluir', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 500 }}>
          Processos de Adesões a Ata (ARP)
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()}
        >
          Novo Cadastro
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
           fullWidth
           variant="outlined"
           placeholder="Buscar por NUP, Objeto ou Fornecedor..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           InputProps={{
             startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
           }}
           size="small"
        />
      </Paper>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ width: 110, minWidth: 110 }}>NUP</TableCell>
                <TableCell sx={{ width: '30%', minWidth: 220 }}>Objeto</TableCell>
                <TableCell sx={{ width: 70, minWidth: 70 }}>U.G.</TableCell>
                <TableCell align="center" sx={{ width: 100, minWidth: 100 }}>Data de Entrada</TableCell>
                <TableCell align="right" sx={{ width: 120, minWidth: 120 }}>Valor</TableCell>
                <TableCell sx={{ width: '14%', minWidth: 120 }}>Fornecedor</TableCell>
                <TableCell sx={{ width: 130, minWidth: 130 }}>Situação</TableCell>
                <TableCell align="center" sx={{ width: 100, minWidth: 100 }}>Data da Situação</TableCell>
                <TableCell align="center" sx={{ width: 80, minWidth: 80 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {adesoes.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{row.nup}</TableCell>
                  <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.objeto}>
                    {row.objeto}
                  </TableCell>
                  <TableCell>{row.unidade_gestora_sigla}</TableCell>
                  <TableCell align="center">{formatDate(row.data_entrada)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatCurrency(Number(row.valor))}
                  </TableCell>
                  <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.fornecedor}>
                    {row.fornecedor}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={row.nome_situacao} 
                      size="small" 
                      sx={{ 
                        backgroundColor: `${row.situacao_cor_hex || '#3498db'}20`,
                        color: row.situacao_cor_hex || '#3498db',
                        border: `1px solid ${row.situacao_cor_hex || '#3498db'}`,
                        fontWeight: 500
                      }} 
                    />
                  </TableCell>
                  <TableCell align="center">{formatDate(row.data_situacao)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpenDialog(row)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {adesoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    Nenhuma adesão encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAdesao ? 'Editar Processo de Adesão' : 'Novo Processo de Adesão'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField 
                required 
                fullWidth 
                label="NUP" 
                value={form.nup} 
                onChange={(e) => handleNupChange(e.target.value)}
                placeholder="000000/0000"
                inputProps={{ maxLength: 11 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                required 
                fullWidth 
                label="Fornecedor" 
                value={form.fornecedor} 
                onChange={(e) => setForm({...form, fornecedor: e.target.value})} 
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                required 
                fullWidth 
                multiline 
                rows={2} 
                label="Objeto" 
                value={form.objeto} 
                onChange={(e) => setForm({...form, objeto: e.target.value})} 
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Unidade Gestora (U.G.)</InputLabel>
                <Select
                  value={form.ug_id}
                  label="Unidade Gestora (U.G.)"
                  onChange={(e) => setForm({...form, ug_id: e.target.value as number})}
                >
                  {unidadesGestoras.map(ug => (
                    <MenuItem key={ug.id} value={ug.id}>{ug.sigla} - {ug.nome_completo_unidade}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField 
                fullWidth 
                label="Valor (R$)" 
                value={getValorFormatadoParaInput()} 
                onChange={(e) => handleValorChange(e.target.value)} 
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Situação</InputLabel>
                <Select
                  value={form.situacao_id}
                  label="Situação"
                  onChange={(e) => setForm({...form, situacao_id: e.target.value as number})}
                >
                  {situacoes.map(sit => (
                    <MenuItem key={sit.id} value={sit.id}>{sit.nome_situacao}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField 
                required 
                fullWidth 
                label="Data de Entrada" 
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.data_entrada} 
                onChange={(e) => setForm({...form, data_entrada: e.target.value})} 
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField 
                required 
                fullWidth 
                label="Data da Situação" 
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.data_situacao} 
                onChange={(e) => setForm({...form, data_situacao: e.target.value})} 
              />
            </Grid>

            <Grid item xs={12}>
              <TextField 
                fullWidth 
                multiline 
                rows={3} 
                label="Observações" 
                value={form.observacoes} 
                onChange={(e) => setForm({...form, observacoes: e.target.value})} 
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
