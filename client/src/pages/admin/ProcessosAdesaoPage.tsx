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
  Search as SearchIcon,
  UploadFile as UploadFileIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  processosAdesaoService, 
  unidadesGestorasService, 
  situacoesService 
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

import PageHeader from '../../components/PageHeader';
import PageContainer from '../../components/PageContainer';
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
  const [filterUg, setFilterUg] = useState<number | ''>('');
  const [filterSituacao, setFilterSituacao] = useState<number | ''>('');
  const [filterDataEntradaInicio, setFilterDataEntradaInicio] = useState('');
  const [filterDataEntradaFim, setFilterDataEntradaFim] = useState('');
  const [filterDataSituacaoInicio, setFilterDataSituacaoInicio] = useState('');
  const [filterDataSituacaoFim, setFilterDataSituacaoFim] = useState('');

  const canEdit = user?.perfil === 'admin' || user?.acoes_permitidas?.includes('editar');
  const canDelete = user?.perfil === 'admin' || user?.acoes_permitidas?.includes('excluir');
  
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
      const response = await processosAdesaoService.list({
        search: searchTerm,
        ...(filterUg ? { ug_id: filterUg } : {}),
        ...(filterSituacao ? { situacao_id: filterSituacao } : {}),
        ...(filterDataEntradaInicio ? { data_entrada_inicio: filterDataEntradaInicio } : {}),
        ...(filterDataEntradaFim ? { data_entrada_fim: filterDataEntradaFim } : {}),
        ...(filterDataSituacaoInicio ? { data_situacao_inicio: filterDataSituacaoInicio } : {}),
        ...(filterDataSituacaoFim ? { data_situacao_fim: filterDataSituacaoFim } : {})
      });
      const adesoesOrdenadas = (response.data || []).sort((a: any, b: any) => {
        const dateA = new Date(a.data_entrada).getTime();
        const dateB = new Date(b.data_entrada).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return b.id - a.id; // Desempate pelo ID (mais recente primeiro)
      });
      setAdesoes(adesoesOrdenadas);
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

  // Debounce para busca por texto
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Recarregar imediatamente ao mudar filtros
  useEffect(() => {
    carregarDados();
  }, [filterUg, filterSituacao, filterDataEntradaInicio, filterDataEntradaFim, filterDataSituacaoInicio, filterDataSituacaoFim]);

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

  // ── CSV Import ──────────────────────────────────────────────
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResultDialog, setCsvResultDialog] = useState(false);
  const [csvResult, setCsvResult] = useState<any>(null);
  const csvInputRef = React.useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const header = 'nup;objeto;sigla_unidade_gestora;data_entrada;valor;fornecedor;nome_situacao;data_situacao;observacoes';
    const example = '0000001/2026;Aquisição de materiais de escritório;SEPLAN;2026-01-15;15000.00;Empresa Exemplo LTDA;Em análise;2026-01-15;Observação opcional';
    const csv = `\uFEFF${header}\n${example}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_adesoes_arp.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true);
    try {
      const result = await processosAdesaoService.importCSV(file);
      setCsvResult(result);
      setCsvResultDialog(true);
      carregarDados();
    } catch (err: any) {
      showSnackbar(err.response?.data?.error || 'Erro ao importar CSV', 'error');
    } finally {
      setCsvLoading(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };
  // ────────────────────────────────────────────────────────────

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeader
          title={adesoes.length > 0 ? `Adesões ARP (${adesoes.length})` : 'Adesões ARP'}
          subtitle="Adesões às Atas de Registro de Preços"
          inline
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Input oculto para seleção de arquivo */}
          <input
            type="file"
            accept=".csv"
            ref={csvInputRef}
            style={{ display: 'none' }}
            onChange={handleImportCSV}
          />
          <Tooltip title="Baixar template CSV para importação">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadTemplate}
              size="small"
            >
              Template CSV
            </Button>
          </Tooltip>
          <Tooltip title="Importar processos via arquivo CSV">
            <span>
              <Button
                variant="outlined"
                startIcon={csvLoading ? <CircularProgress size={16} /> : <UploadFileIcon />}
                onClick={() => csvInputRef.current?.click()}
                disabled={csvLoading || !canEdit}
                size="small"
                sx={{ display: canEdit ? 'inline-flex' : 'none' }}
              >
                {csvLoading ? 'Importando...' : 'Importar CSV'}
              </Button>
            </span>
          </Tooltip>
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Novo Cadastro
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                sx={{ flex: 2, minWidth: 220 }}
                variant="outlined"
                placeholder="Buscar por NUP, Objeto ou Fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                size="small"
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Unidade Gestora</InputLabel>
                <Select
                  value={filterUg}
                  label="Unidade Gestora"
                  onChange={(e) => setFilterUg(e.target.value as number | '')}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {unidadesGestoras
                    .slice()
                    .sort((a, b) => (a.sigla || '').localeCompare(b.sigla || ''))
                    .map((ug: any) => (
                      <MenuItem key={ug.id} value={ug.id}>{ug.sigla}</MenuItem>
                    ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Situação</InputLabel>
                <Select
                  value={filterSituacao}
                  label="Situação"
                  onChange={(e) => setFilterSituacao(e.target.value as number | '')}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {situacoes.map((sit: any) => (
                    <MenuItem key={sit.id} value={sit.id}>{sit.nome_situacao}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                onClick={() => { 
                  setSearchTerm(''); 
                  setFilterUg(''); 
                  setFilterSituacao(''); 
                  setFilterDataEntradaInicio('');
                  setFilterDataEntradaFim('');
                  setFilterDataSituacaoInicio('');
                  setFilterDataSituacaoFim('');
                }}
              >
                Limpar
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', mr: 1 }}>
                Entrada:
              </Typography>
              <TextField
                type="date"
                size="small"
                label="De"
                InputLabelProps={{ shrink: true }}
                value={filterDataEntradaInicio}
                onChange={(e) => setFilterDataEntradaInicio(e.target.value)}
                sx={{ width: 150 }}
              />
              <TextField
                type="date"
                size="small"
                label="Até"
                InputLabelProps={{ shrink: true }}
                value={filterDataEntradaFim}
                onChange={(e) => setFilterDataEntradaFim(e.target.value)}
                sx={{ width: 150 }}
              />

              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', ml: 2, mr: 1 }}>
                Situação:
              </Typography>
              <TextField
                type="date"
                size="small"
                label="De"
                InputLabelProps={{ shrink: true }}
                value={filterDataSituacaoInicio}
                onChange={(e) => setFilterDataSituacaoInicio(e.target.value)}
                sx={{ width: 150 }}
              />
              <TextField
                type="date"
                size="small"
                label="Até"
                InputLabelProps={{ shrink: true }}
                value={filterDataSituacaoFim}
                onChange={(e) => setFilterDataSituacaoFim(e.target.value)}
                sx={{ width: 150 }}
              />
            </Box>
          </Box>
      </Paper>

      <Paper 
        sx={{ 
          mb: 3, 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          boxShadow: 3
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total de Processos</Typography>
          <Typography variant="h5" fontWeight="bold">
            {adesoes.length}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Valor Total</Typography>
          <Typography variant="h5" fontWeight="bold">
            {formatCurrency(adesoes.reduce((sum, row) => sum + Number(row.valor || 0), 0))}
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small" sx={{ width: '100%' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ width: 110, minWidth: 110 }}>NUP</TableCell>
                <TableCell sx={{ width: '30%', minWidth: 220 }}>Objeto</TableCell>
                <TableCell sx={{ width: 70, minWidth: 70 }}>U.G.</TableCell>
                <TableCell align="center" sx={{ width: 100, minWidth: 100, fontWeight: 'bold' }}>
                  Data de Entrada ↓
                </TableCell>
                <TableCell align="right" sx={{ width: 120, minWidth: 120 }}>Valor</TableCell>
                <TableCell sx={{ width: '14%', minWidth: 120 }}>Fornecedor</TableCell>
                <TableCell sx={{ width: 130, minWidth: 130 }}>Situação</TableCell>
                <TableCell align="center" sx={{ width: 100, minWidth: 100 }}>Data da Situação</TableCell>
                {(canEdit || canDelete) && (
                  <TableCell align="center" sx={{ width: 100, minWidth: 100 }}>Ações</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {adesoes.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{row.nup}</TableCell>
                  <TableCell sx={{ py: 1.5, minWidth: 250 }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                      {row.objeto}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.unidade_gestora_sigla}</TableCell>
                  <TableCell align="center">{formatDate(row.data_entrada)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatCurrency(Number(row.valor))}
                  </TableCell>
                  <TableCell sx={{ py: 1.5, minWidth: 150 }}>
                    <Typography variant="caption" sx={{ lineHeight: 1.4, fontWeight: 500 }}>
                      {row.fornecedor}
                    </Typography>
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
                  {(canEdit || canDelete) && (
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      {canEdit && (
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleOpenDialog(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Excluir">
                          <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {adesoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit || canDelete ? 9 : 8} align="center" sx={{ py: 3 }}>
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
                onChange={(e) => setForm({...form, fornecedor: e.target.value.toUpperCase()})}
                inputProps={{ style: { textTransform: 'uppercase' } }}
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
                onChange={(e) => setForm({...form, objeto: e.target.value.toUpperCase()})}
                inputProps={{ style: { textTransform: 'uppercase' } }}
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

      {/* Modal de resultado da importação CSV */}
      <Dialog open={csvResultDialog} onClose={() => setCsvResultDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resultado da Importação CSV</DialogTitle>
        <DialogContent>
          {csvResult && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">{csvResult.importados}</Typography>
                    <Typography variant="caption" color="text.secondary">Importados</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff8e1', borderRadius: 2 }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">{csvResult.atualizados}</Typography>
                    <Typography variant="caption" color="text.secondary">Atualizados</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: csvResult.total_erros > 0 ? '#ffebee' : '#e8f5e9', borderRadius: 2 }}>
                    <Typography variant="h4" color={csvResult.total_erros > 0 ? 'error.main' : 'success.main'} fontWeight="bold">{csvResult.total_erros}</Typography>
                    <Typography variant="caption" color="text.secondary">Erros</Typography>
                  </Box>
                </Grid>
              </Grid>

              {csvResult.erros?.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>Linhas com erro:</Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto', bgcolor: '#ffebee', borderRadius: 1, p: 1 }}>
                    {csvResult.erros.map((e: any, i: number) => (
                      <Typography key={i} variant="caption" display="block" sx={{ mb: 0.5 }}>
                        <strong>Linha {e.linha}:</strong> {e.motivo}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCsvResultDialog(false)} variant="contained">Fechar</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
