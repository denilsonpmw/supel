import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';

interface LogAuditoria {
  id: number;
  usuario_id: number | null;
  usuario_email: string | null;
  usuario_nome: string | null;
  tabela_afetada: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  registro_id: number | null;
  dados_anteriores?: any;
  dados_novos?: any;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  processo_nup?: string; // Nova propriedade
}

interface EstatisticasAuditoria {
  total: number;
  operacoes: Array<{ operacao: string; quantidade: number }>;
  tabelas: Array<{ tabela_afetada: string; quantidade: number }>;
  topUsuarios: Array<{ nome: string; email: string; quantidade: number }>;
  operacoesPorDia: Array<{ data: string; quantidade: number }>;
}

// Função utilitária para comparar campos de dois objetos e retornar apenas os campos alterados
function getDiffFields(anteriores: any, novos: any) {
  if (!anteriores && !novos) return [];
  const campos = new Set([
    ...Object.keys(anteriores || {}),
    ...Object.keys(novos || {})
  ]);
  // Sempre incluir NUP e objeto se existirem
  if (campos.has('nup')) campos.add('nup');
  if (campos.has('objeto')) campos.add('objeto');
  const diffs: { campo: string; antes: any; depois: any }[] = [];
  campos.forEach(campo => {
    let antes = anteriores ? anteriores[campo] : undefined;
    let depois = novos ? novos[campo] : undefined;
    // Tratar null, undefined e '' como equivalentes para campos opcionais
    const isOptional = ['observacoes', 'descricao', 'descricao_modalidade', 'descricao_situacao'].includes(campo);
    if (isOptional) {
      if (antes === undefined) antes = null;
      if (depois === undefined) depois = null;
      if (antes === '') antes = null;
      if (depois === '') depois = null;
    }
    // Só marcar NUP como alterado se realmente mudou
    if (campo === 'nup') {
      if (antes !== depois) {
        diffs.push({ campo, antes, depois });
      }
      return;
    }
    if (campo === 'objeto') {
      if (antes !== depois) {
        diffs.push({ campo, antes, depois });
      }
      return;
    }
    if (antes !== depois) {
      diffs.push({ campo, antes, depois });
    }
  });
  return diffs;
}

// Função para substituir campos *_id por *_nome no objeto, retornando novo objeto
function substituirNomes(obj: any, getModalidadeNome: (id: any) => string, getSituacaoNome: (id: any) => string, getResponsavelNome: (id: any) => string, getUnidadeGestoraSigla: (id: any) => string) {
  if (!obj) return obj;
  const novo: any = { ...obj };
  // Modalidade
  if ('modalidade_id' in novo) {
    novo['modalidade_nome'] = getModalidadeNome(novo['modalidade_id']);
  }
  // Situação: manter o id e adicionar o nome logo abaixo
  if ('situacao_id' in novo) {
    novo['situacao_nome'] = getSituacaoNome(novo['situacao_id']);
  } else if ('situacao_nome' in novo && typeof novo['situacao_nome'] === 'number') {
    novo['situacao_nome'] = getSituacaoNome(novo['situacao_nome']);
  }
  // Responsável
  if ('responsavel_id' in novo) {
    novo['responsavel_nome'] = getResponsavelNome(novo['responsavel_id']);
  }
  // Unidade Gestora
  if ('ug_id' in novo) {
    novo['unidade_gestora_sigla'] = getUnidadeGestoraSigla(novo['ug_id']);
  }
  return novo;
}

// Função para renderizar JSON com destaque nos campos alterados
function renderJsonComDestaque(obj: any, camposAlterados: Set<string>) {
  if (!obj) return null;
  const json = JSON.stringify(obj, null, 2);
  return json.split('\n').map((linha, idx) => {
    // Detecta o nome do campo na linha (ex: "campo_nome": ...)
    const match = linha.match(/^\s*\"([^\"]+)\":/);
    const campo = match ? match[1] : null;
    const isDiff = campo && camposAlterados.has(campo);
    return (
      <div
        key={idx}
        style={isDiff ? {
          background: '#fff3cd', // warning.light
          fontWeight: 'bold',
          color: '#856404', // warning.dark
          borderRadius: 4,
          padding: '0 2px',
        } : {}}
      >
        {linha}
      </div>
    );
  });
}

// Função para obter apenas os campos realmente alterados (antes !== depois)
function getCamposAlterados(anteriores: any, novos: any) {
  if (!anteriores && !novos) return new Set<string>();
  const campos = new Set([
    ...Object.keys(anteriores || {}),
    ...Object.keys(novos || {})
  ]);
  const alterados = new Set<string>();
  campos.forEach(campo => {
    const antes = anteriores ? anteriores[campo] : undefined;
    const depois = novos ? novos[campo] : undefined;
    if (antes !== depois) {
      // Substituir nomes para campos de referência
      if (campo === 'modalidade_id') alterados.add('modalidade_nome');
      else if (campo === 'situacao_id') alterados.add('situacao_nome');
      else if (campo === 'responsavel_id') alterados.add('responsavel_nome');
      else alterados.add(campo);
    }
  });
  return alterados;
}

// Função para remover campos terminados com _id
function removerCamposId(obj: any) {
  if (!obj) return obj;
  const novo: any = {};
  Object.keys(obj).forEach(key => {
    if (!key.endsWith('_id')) {
      novo[key] = obj[key];
    }
  });
  return novo;
}

// Função para ordenar os campos conforme ordem desejada
function ordenarCampos(obj: any, ordem: string[]) {
  if (!obj) return obj;
  const novo: any = {};
  ordem.forEach(key => {
    if (key in obj) novo[key] = obj[key];
  });
  // Adiciona os campos restantes (não listados na ordem e não created_at)
  Object.keys(obj).forEach(key => {
    if (!ordem.includes(key) && key !== 'created_at') novo[key] = obj[key];
  });
  return novo;
}

const ordemCampos = [
  'nup',
  'objeto',
  'unidade_gestora_sigla',
  'data_entrada',
  'responsavel_nome',
  'modalidade_nome',
  'numero_ano',
  'data_sessao',
  'data_pncp',
  'data_tce_1',
  'valor_estimado',
  'valor_realizado',
  'situacao_nome',
  'data_situacao',
  'data_tce_2',
  'observacoes',
  'conclusao',
  'updated_at',
];

// Função utilitária para parse seguro de datas YYYY-MM-DD
function parseDateBr(dateStr: string) {
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

// Função para formatar NUP para exibição
function formatNupExibicao(nupCompleto: string): string {
  if (!nupCompleto) return '';
  
  // Extrai apenas o número e ano do NUP completo (formato: 00000.0.000001/2025)
  const match = nupCompleto.match(/^\d{5}\.0\.(\d{6})\/(\d{4})$/);
  if (match) {
    const numero = match[1]; // Mantém os zeros à esquerda
    const ano = match[2];
    return `${numero}/${ano}`;
  }
  
  // Se não for formato completo, tenta extrair número/ano de outros formatos
  const matchSimples = nupCompleto.match(/^(\d{1,6})\/(\d{4})$/);
  if (matchSimples) {
    const numero = matchSimples[1].padStart(6, '0'); // Adiciona zeros à esquerda
    const ano = matchSimples[2];
    return `${numero}/${ano}`;
  }
  
  return nupCompleto;
}

const AuditoriaPage: React.FC = () => {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasAuditoria | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    usuario_id: '',
    data_inicio: null as Date | null,
    data_fim: null as Date | null,
    tabela_afetada: '',
    operacao: '',
    registro_id: ''
  });
  
  // Modal de detalhes
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [logSelecionado, setLogSelecionado] = useState<LogAuditoria | null>(null);
  
  // Estados de UI
  const [showFiltros, setShowFiltros] = useState(false);

  const [modalidades, setModalidades] = useState<any[]>([]);
  const [situacoes, setSituacoes] = useState<any[]>([]);
  const [responsaveis, setResponsaveis] = useState<any[]>([]);
  const [unidadesGestoras, setUnidadesGestoras] = useState<any[]>([]);

  useEffect(() => {
    api.get('/modalidades').then(res => setModalidades(res.data?.data || res.data));
    api.get('/situacoes/todas').then(res => setSituacoes(res.data?.data || res.data));
    api.get('/responsaveis').then(res => setResponsaveis(res.data?.data || res.data));
    api.get('/unidades-gestoras').then(res => setUnidadesGestoras(res.data?.data || res.data));
  }, []);

  const getModalidadeNome = (id: any) => modalidades.find(m => m.id === id)?.nome_modalidade || id;
  const getSituacaoNome = (id: any) => {
    if (!id) return '';
    const situacao = situacoes.find(s => String(s.id) === String(id));
    return situacao ? situacao.nome_situacao : `Desconhecida (id: ${id})`;
  };
  const getResponsavelNome = (id: any) => responsaveis.find(r => r.id === id)?.nome_responsavel || id;
  const getUnidadeGestoraSigla = (id: any) => unidadesGestoras.find(u => String(u.id) === String(id))?.sigla || id;

  const renderValue = (campo: string, valor: any) => {
    if (campo === 'modalidade_id') return getModalidadeNome(valor);
    if (campo === 'situacao_id') return getSituacaoNome(valor);
    if (campo === 'responsavel_id') return getResponsavelNome(valor);
    return String(valor ?? '');
  };

  // Carregar logs de auditoria
  const carregarLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString()
      });

      if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio.toISOString());
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim.toISOString());
      if (filtros.tabela_afetada) params.append('tabela_afetada', filtros.tabela_afetada);
      if (filtros.operacao) params.append('operacao', filtros.operacao);
      if (filtros.registro_id) params.append('registro_id', filtros.registro_id);

      const response = await api.get(`/auditoria?${params}`);
      setLogs(response.data.logs);
      setTotal(response.data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas
  const carregarEstatisticas = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio.toISOString());
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim.toISOString());

      const response = await api.get(`/auditoria/estatisticas?${params}`);
      setEstatisticas(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    carregarLogs();
    carregarEstatisticas();
  }, [page, rowsPerPage]);

  // Aplicar filtros
  const aplicarFiltros = () => {
    setPage(0);
    carregarLogs();
    carregarEstatisticas();
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      usuario_id: '',
      data_inicio: null,
      data_fim: null,
      tabela_afetada: '',
      operacao: '',
      registro_id: ''
    });
    setPage(0);
  };

  // Exportar logs
  const exportarLogs = async () => {
    try {
      // Preparar dados para exportação
      const dadosExportacao = {
        ...filtros,
        formato: 'csv'
      };

      // Converter datas para string se existirem
      if (dadosExportacao.data_inicio) {
        dadosExportacao.data_inicio = dadosExportacao.data_inicio.toISOString();
      }
      if (dadosExportacao.data_fim) {
        dadosExportacao.data_fim = dadosExportacao.data_fim.toISOString();
      }

      const response = await api.post('/auditoria/export', dadosExportacao, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `auditoria_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Erro ao exportar logs:', err);
      setError('Erro ao exportar logs. Verifique se há dados para exportar.');
    }
  };

  // Abrir modal de detalhes
  const abrirDetalhes = (log: LogAuditoria) => {
    setLogSelecionado(log);
    setModalDetalhes(true);
  };

  // Obter cor do chip baseado na operação
  const getOperacaoColor = (operacao: string) => {
    switch (operacao) {
      case 'INSERT': return 'success';
      case 'UPDATE': return 'warning';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  // Obter cor do chip baseado na tabela
  const getTabelaColor = (tabela: string) => {
    const cores: { [key: string]: string } = {
      'processos': 'primary',
      'modalidades': 'secondary',
      'situacoes': 'info',
      'responsaveis': 'success',
      'unidades_gestoras': 'warning',
      'equipe_apoio': 'error',
      'users': 'default'
    };
    return cores[tabela] || 'default';
  };

  // Formatar timestamp
  const formatarTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon />
          Sistema de Auditoria
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Estatísticas */}
        {estatisticas && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Operações
                  </Typography>
                  <Typography variant="h4">
                    {estatisticas.total.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Operações Hoje
                  </Typography>
                  <Typography variant="h4">
                    {(() => {
                      const hoje = new Date();
                      const hojeStr = hoje.toLocaleDateString('sv-SE'); // 'YYYY-MM-DD'
                      // Contar logs exibidos na tabela com timestamp igual à data de hoje
                      return logs.filter(log => {
                        if (!log.timestamp) return false;
                        const dataLog = new Date(log.timestamp).toLocaleDateString('sv-SE');
                        return dataLog === hojeStr;
                      }).length;
                    })()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tabelas Afetadas
                  </Typography>
                  <Typography variant="h4">
                    {estatisticas.tabelas.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Usuários Ativos
                  </Typography>
                  <Typography variant="h4">
                    {estatisticas.topUsuarios.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Controles */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Logs de Auditoria</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFiltros(!showFiltros)}
              >
                Filtros
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  carregarLogs();
                  carregarEstatisticas();
                }}
                disabled={loading}
              >
                Atualizar
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={exportarLogs}
                disabled={loading}
              >
                Exportar
              </Button>
            </Box>
          </Box>

          {/* Filtros */}
          {showFiltros && (
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="ID do Usuário"
                    value={filtros.usuario_id}
                    onChange={(e) => setFiltros({ ...filtros, usuario_id: e.target.value })}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="Data Início"
                    value={filtros.data_inicio}
                    onChange={(date) => setFiltros({ ...filtros, data_inicio: date })}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="Data Fim"
                    value={filtros.data_fim}
                    onChange={(date) => setFiltros({ ...filtros, data_fim: date })}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tabela</InputLabel>
                    <Select
                      value={filtros.tabela_afetada}
                      onChange={(e) => setFiltros({ ...filtros, tabela_afetada: e.target.value })}
                      label="Tabela"
                    >
                      <MenuItem value="">Todas</MenuItem>
                      <MenuItem value="processos">Processos</MenuItem>
                      <MenuItem value="modalidades">Modalidades</MenuItem>
                      <MenuItem value="situacoes">Situações</MenuItem>
                      <MenuItem value="responsaveis">Responsáveis</MenuItem>
                      <MenuItem value="unidades_gestoras">Unidades Gestoras</MenuItem>
                      <MenuItem value="equipe_apoio">Equipe de Apoio</MenuItem>
                      <MenuItem value="users">Usuários</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Operação</InputLabel>
                    <Select
                      value={filtros.operacao}
                      onChange={(e) => setFiltros({ ...filtros, operacao: e.target.value })}
                      label="Operação"
                    >
                      <MenuItem value="">Todas</MenuItem>
                      <MenuItem value="INSERT">Inclusão</MenuItem>
                      <MenuItem value="UPDATE">Alteração</MenuItem>
                      <MenuItem value="DELETE">Exclusão</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="ID do Registro"
                    value={filtros.registro_id}
                    onChange={(e) => setFiltros({ ...filtros, registro_id: e.target.value })}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" onClick={aplicarFiltros}>
                      Aplicar Filtros
                    </Button>
                    <Button variant="outlined" onClick={limparFiltros}>
                      Limpar Filtros
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>

        {/* Tabela de Logs */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Usuário</TableCell>
                  <TableCell>Tabela</TableCell>
                  <TableCell>Operação</TableCell>
                  <TableCell>Registro ID</TableCell>
                  <TableCell>NUP</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>IP</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.id}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {log.usuario_nome || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {log.usuario_email || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.tabela_afetada}
                          color={getTabelaColor(log.tabela_afetada) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.operacao}
                          color={getOperacaoColor(log.operacao) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.registro_id || 'N/A'}</TableCell>
                      <TableCell>
                        {log.processo_nup ? (
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {formatNupExibicao(log.processo_nup)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{formatarTimestamp(log.timestamp)}</TableCell>
                      <TableCell>{log.ip_address || 'N/A'}</TableCell>
                      <TableCell>
                        <Tooltip title="Ver detalhes">
                          <IconButton
                            size="small"
                            onClick={() => abrirDetalhes(log)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </Paper>

        {/* Modal de Detalhes */}
        <Dialog
          open={modalDetalhes}
          onClose={() => setModalDetalhes(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Detalhes do Log de Auditoria
          </DialogTitle>
          <DialogContent>
            {situacoes.length === 0 ? (
              <Alert severity="info">Carregando situações...</Alert>
            ) : logSelecionado && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      ID do Log
                    </Typography>
                    <Typography variant="body1">{logSelecionado.id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Timestamp
                    </Typography>
                    <Typography variant="body1">
                      {formatarTimestamp(logSelecionado.timestamp)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Usuário
                    </Typography>
                    <Typography variant="body1">
                      {logSelecionado.usuario_nome || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {logSelecionado.usuario_email || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      IP Address
                    </Typography>
                    <Typography variant="body1">
                      {logSelecionado.ip_address || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Tabela Afetada
                    </Typography>
                    <Chip
                      label={logSelecionado.tabela_afetada}
                      color={getTabelaColor(logSelecionado.tabela_afetada) as any}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Operação
                    </Typography>
                    <Chip
                      label={logSelecionado.operacao}
                      color={getOperacaoColor(logSelecionado.operacao) as any}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Registro ID
                    </Typography>
                    <Typography variant="body1">
                      {logSelecionado.registro_id || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Dados Anteriores */}
                {logSelecionado.dados_anteriores && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Dados Anteriores
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : 'grey.50', color: (theme) => theme.palette.text.primary, fontFamily: 'monospace', fontSize: 14, overflowX: 'auto' }}>
                      <pre style={{ margin: 0 }}>
                        {renderJsonComDestaque(
                          ordenarCampos(removerCamposId(substituirNomes(logSelecionado.dados_anteriores, getModalidadeNome, getSituacaoNome, getResponsavelNome, getUnidadeGestoraSigla)), ordemCampos),
                          getCamposAlterados(logSelecionado.dados_anteriores, logSelecionado.dados_novos)
                        )}
                      </pre>
                    </Paper>
                  </Box>
                )}

                {/* Dados Novos */}
                {logSelecionado.dados_novos && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Dados Novos
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : 'grey.50', color: (theme) => theme.palette.text.primary, fontFamily: 'monospace', fontSize: 14, overflowX: 'auto' }}>
                      <pre style={{ margin: 0 }}>
                        {renderJsonComDestaque(
                          ordenarCampos(removerCamposId(substituirNomes(logSelecionado.dados_novos, getModalidadeNome, getSituacaoNome, getResponsavelNome, getUnidadeGestoraSigla)), ordemCampos),
                          getCamposAlterados(logSelecionado.dados_anteriores, logSelecionado.dados_novos)
                        )}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalDetalhes(false)} variant="contained" color="primary">
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditoriaPage; 