import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Divider, Switch, FormControlLabel, Select, MenuItem, TextField, Button, Tooltip, Slider, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import UpdateIcon from '@mui/icons-material/Update';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import SpeedIcon from '@mui/icons-material/Speed';
import LockClockIcon from '@mui/icons-material/LockClock';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';

import { useConfig } from '../../contexts/ConfigContext';

export default function ConfiguracoesPage() {
  const { config, updateConfig, forceServiceWorkerUpdate, clearPWACache } = useConfig();
  const [saved, setSaved] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [saved]);

  function persist(next: any) { updateConfig(next); }
  function handleSave() { setSaved(true); }

  async function handleClearCache() { await clearPWACache(); setCacheCleared(true); setTimeout(()=>setCacheCleared(false),2500); }
  async function handleForceSWUpdate() { await forceServiceWorkerUpdate(); setSaved(true); }

  const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box display="flex" alignItems="center" gap={1.2}>
        {icon}
        <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600 }}>{title}</Typography>
      </Box>
      <Divider />
      {children}
    </Paper>
  );

  return (
    <Box p={3} display="flex" flexDirection="column" gap={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" sx={{ fontSize: 28, fontWeight: 600 }}>Configurações</Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Salvar Preferências">
            <Button variant="contained" color="primary" onClick={handleSave}>Salvar</Button>
          </Tooltip>
          <Tooltip title="Forçar atualização do Service Worker">
            <Button variant="outlined" startIcon={<UpdateIcon />} onClick={handleForceSWUpdate}>Forçar SW</Button>
          </Tooltip>
          <Tooltip title="Limpar todos os caches (PWA)">
            <Button variant="outlined" color="warning" startIcon={<DeleteSweepIcon />} onClick={handleClearCache}>Limpar Cache</Button>
          </Tooltip>
        </Box>
      </Box>
      {saved && <Alert severity="success" variant="outlined">Preferências salvas/atualizadas.</Alert>}
      {cacheCleared && <Alert severity="info" variant="outlined">Cache limpo e SW atualizado.</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Section title="Interface" icon={<ColorLensIcon color="primary" />}> 
            <FormControlLabel control={<Switch checked={config.tema === 'dark'} onChange={e => persist({ tema: e.target.checked ? 'dark' : 'light' })} />} label="Tema Escuro" />
            <FormControlLabel control={<Switch checked={config.densidade === 'compact'} onChange={e => persist({ densidade: e.target.checked ? 'compact' : 'default' })} />} label="Layout Compacto" />
            <Typography variant="body2" sx={{ mt: 1 }}>Tamanho da Fonte ({config.fonteBase}px)</Typography>
            <Slider min={12} max={20} value={config.fonteBase} onChange={(_, v) => persist({ fonteBase: v as number })} />
          </Section>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Section title="Dashboard" icon={<DashboardIcon color="primary" />}> 
            <TextField label="Itens por Página" type="number" size="small" value={config.dashboardItensPagina} onChange={e => persist({ dashboardItensPagina: parseInt(e.target.value)||1 })} />
            <TextField label="Auto-refresh (segundos)" type="number" size="small" value={config.dashboardAutoRefreshSeg} onChange={e => persist({ dashboardAutoRefreshSeg: parseInt(e.target.value)||30 })} sx={{ mt: 2 }} />
          </Section>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Section title="Notificações" icon={<NotificationsActiveIcon color="primary" />}> 
            <FormControlLabel control={<Switch checked={config.notificacoesGlobais} onChange={e => persist({ notificacoesGlobais: e.target.checked })} />} label="Ativar Globais" />
            <FormControlLabel control={<Switch checked={config.notificacoesPush} onChange={e => persist({ notificacoesPush: e.target.checked })} />} label="Push" />
            <FormControlLabel control={<Switch checked={config.notificacoesEmail} onChange={e => persist({ notificacoesEmail: e.target.checked })} />} label="Email" />
            <FormControlLabel control={<Switch checked={config.notificacoesSom} onChange={e => persist({ notificacoesSom: e.target.checked })} />} label="Som" />
          </Section>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Section title="Segurança & Sessão" icon={<SecurityIcon color="primary" />}> 
            <TextField label="Timeout Sessão (min)" type="number" size="small" value={config.sessaoTimeoutMin} onChange={e => persist({ sessaoTimeoutMin: parseInt(e.target.value)||5 })} />
            <FormControlLabel control={<Switch checked={config.inatividadeLogout} onChange={e => persist({ inatividadeLogout: e.target.checked })} />} label="Logout por Inatividade" />
            <Typography variant="body2" sx={{ mt: 1 }}>Detalhe Auditoria</Typography>
            <Select size="small" value={config.segurancaDetalheAuditoria} onChange={e => persist({ segurancaDetalheAuditoria: e.target.value as any })}>
              <MenuItem value="baixo">Baixo</MenuItem>
              <MenuItem value="medio">Médio</MenuItem>
              <MenuItem value="alto">Alto</MenuItem>
            </Select>
          </Section>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Section title="PWA" icon={<OfflineBoltIcon color="primary" />}> 
            <FormControlLabel control={<Switch checked={config.pwaAutoUpdate} onChange={e => persist({ pwaAutoUpdate: e.target.checked })} />} label="Auto Update SW" />
            <FormControlLabel control={<Switch checked={config.pwaLimparCache} onChange={e => persist({ pwaLimparCache: e.target.checked })} />} label="Limpar Cache Próximo Load" />
            <Typography variant="caption" color="text.secondary">Use os botões superiores para ações imediatas.</Typography>
          </Section>
        </Grid>

      </Grid>
    </Box>
  );
}
