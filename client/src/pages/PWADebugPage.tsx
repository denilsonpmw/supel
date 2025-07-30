import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  Error,
  Warning,
  Info,
  BugReport,
  Smartphone,
  Web,
  Cached
} from '@mui/icons-material';
import { useServiceWorkerUpdate } from '../hooks/useServiceWorkerUpdate';

interface PWAInfo {
  isInstalled: boolean;
  isStandalone: boolean;
  serviceWorkerSupported: boolean;
  serviceWorkerRegistered: boolean;
  serviceWorkerActive: boolean;
  serviceWorkerWaiting: boolean;
  cacheNames: string[];
  userAgent: string;
  displayMode: string;
}

const PWADebugPage: React.FC = () => {
  const [pwaInfo, setPwaInfo] = useState<PWAInfo>({
    isInstalled: false,
    isStandalone: false,
    serviceWorkerSupported: false,
    serviceWorkerRegistered: false,
    serviceWorkerActive: false,
    serviceWorkerWaiting: false,
    cacheNames: [],
    userAgent: '',
    displayMode: 'browser'
  });
  const [logs, setLogs] = useState<string[]>([]);
  const { updateAvailable, applyUpdate, isUpdating } = useServiceWorkerUpdate();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const loadPWAInfo = async () => {
    addLog('Carregando informações do PWA...');
    
    const info: PWAInfo = {
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      isStandalone: window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      serviceWorkerRegistered: false,
      serviceWorkerActive: false,
      serviceWorkerWaiting: false,
      cacheNames: [],
      userAgent: navigator.userAgent,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          info.serviceWorkerRegistered = true;
          info.serviceWorkerActive = !!registration.active;
          info.serviceWorkerWaiting = !!registration.waiting;
          addLog(`SW Registration encontrada. Active: ${!!registration.active}, Waiting: ${!!registration.waiting}`);
        }
      } catch (error) {
        addLog(`Erro ao verificar SW: ${error}`);
      }

      try {
        const cacheNames = await caches.keys();
        info.cacheNames = cacheNames;
        addLog(`Caches encontrados: ${cacheNames.join(', ')}`);
      } catch (error) {
        addLog(`Erro ao listar caches: ${error}`);
      }
    }

    setPwaInfo(info);
  };

  const clearCaches = async () => {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      addLog(`${cacheNames.length} caches removidos`);
      loadPWAInfo();
    } catch (error) {
      addLog(`Erro ao limpar caches: ${error}`);
    }
  };

  const unregisterServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          addLog('Service Worker desregistrado');
          loadPWAInfo();
        }
      } catch (error) {
        addLog(`Erro ao desregistrar SW: ${error}`);
      }
    }
  };

  const forceUpdate = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          addLog('Verificação de atualização forçada');
          loadPWAInfo();
        }
      } catch (error) {
        addLog(`Erro ao forçar atualização: ${error}`);
      }
    }
  };

  useEffect(() => {
    loadPWAInfo();
  }, []);

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle color="success" /> : <Error color="error" />;
  };

  const getDisplayModeColor = (mode: string) => {
    switch (mode) {
      case 'standalone': return 'success';
      case 'fullscreen': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <BugReport sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            PWA Debug Console
          </Typography>
        </Box>

        {/* Status Cards */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <Card variant="outlined" sx={{ minWidth: 200 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Smartphone sx={{ mr: 1 }} />
                <Typography variant="h6">Instalação</Typography>
              </Box>
              <Chip 
                label={pwaInfo.isStandalone ? 'Instalado' : 'Navegador'} 
                color={pwaInfo.isStandalone ? 'success' : 'default'}
                icon={pwaInfo.isStandalone ? <CheckCircle /> : <Web />}
              />
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ minWidth: 200 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Cached sx={{ mr: 1 }} />
                <Typography variant="h6">Service Worker</Typography>
              </Box>
              <Chip 
                label={pwaInfo.serviceWorkerActive ? 'Ativo' : 'Inativo'} 
                color={pwaInfo.serviceWorkerActive ? 'success' : 'error'}
                icon={getStatusIcon(pwaInfo.serviceWorkerActive)}
              />
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ minWidth: 200 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Info sx={{ mr: 1 }} />
                <Typography variant="h6">Modo de Exibição</Typography>
              </Box>
              <Chip 
                label={pwaInfo.displayMode} 
                color={getDisplayModeColor(pwaInfo.displayMode)}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Update Status */}
        {updateAvailable && (
          <Alert severity="info" sx={{ mb: 3 }} action={
            <Button color="inherit" size="small" onClick={applyUpdate} disabled={isUpdating}>
              {isUpdating ? 'Atualizando...' : 'Atualizar Agora'}
            </Button>
          }>
            Nova atualização disponível!
          </Alert>
        )}

        {/* PWA Info */}
        <Typography variant="h6" gutterBottom>Informações do PWA</Typography>
        <List>
          <ListItem>
            <ListItemIcon>{getStatusIcon(pwaInfo.serviceWorkerSupported)}</ListItemIcon>
            <ListItemText primary="Service Worker Suportado" secondary={pwaInfo.serviceWorkerSupported ? 'Sim' : 'Não'} />
          </ListItem>
          <ListItem>
            <ListItemIcon>{getStatusIcon(pwaInfo.serviceWorkerRegistered)}</ListItemIcon>
            <ListItemText primary="Service Worker Registrado" secondary={pwaInfo.serviceWorkerRegistered ? 'Sim' : 'Não'} />
          </ListItem>
          <ListItem>
            <ListItemIcon>{getStatusIcon(pwaInfo.serviceWorkerActive)}</ListItemIcon>
            <ListItemText primary="Service Worker Ativo" secondary={pwaInfo.serviceWorkerActive ? 'Sim' : 'Não'} />
          </ListItem>
          {pwaInfo.serviceWorkerWaiting && (
            <ListItem>
              <ListItemIcon><Warning color="warning" /></ListItemIcon>
              <ListItemText primary="Service Worker Aguardando" secondary="Há uma nova versão esperando para ser ativada" />
            </ListItem>
          )}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Cache Info */}
        <Typography variant="h6" gutterBottom>Caches ({pwaInfo.cacheNames.length})</Typography>
        {pwaInfo.cacheNames.length > 0 ? (
          <List dense>
            {pwaInfo.cacheNames.map((cacheName, index) => (
              <ListItem key={index}>
                <ListItemText primary={cacheName} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">Nenhum cache encontrado</Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Actions */}
        <Typography variant="h6" gutterBottom>Ações de Debug</Typography>
        <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
          <Button variant="outlined" onClick={loadPWAInfo} startIcon={<Refresh />}>
            Recarregar Info
          </Button>
          <Button variant="outlined" onClick={forceUpdate} startIcon={<Cached />}>
            Forçar Update SW
          </Button>
          <Button variant="outlined" onClick={clearCaches} color="warning">
            Limpar Caches
          </Button>
          <Button variant="outlined" onClick={unregisterServiceWorker} color="error">
            Desregistrar SW
          </Button>
        </Box>

        {/* Logs */}
        <Typography variant="h6" gutterBottom>
          Logs 
          <IconButton size="small" onClick={() => setLogs([])} sx={{ ml: 1 }}>
            <Refresh />
          </IconButton>
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <Typography key={index} variant="body2" component="div" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                {log}
              </Typography>
            ))
          ) : (
            <Typography color="text.secondary">Nenhum log ainda...</Typography>
          )}
        </Paper>

        {/* User Agent */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>User Agent</Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {pwaInfo.userAgent}
        </Typography>
      </Paper>
    </Container>
  );
};

export default PWADebugPage;
