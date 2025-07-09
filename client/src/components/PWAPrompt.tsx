import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  Card,
  CardContent,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { usePWA } from '../hooks/usePWA';

interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAPrompt = () => {
  const [showDebug, setShowDebug] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const { isInstalled, isStandalone, isFullscreen, isOnline } = usePWA();

  useEffect(() => {
    // Capturar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PWAInstallPrompt);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Coletar informações de debug
    const collectDebugInfo = () => {
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        onLine: navigator.onLine,
        serviceWorker: 'serviceWorker' in navigator,
        standalone: (window.navigator as any).standalone,
        displayMode: {
          standalone: window.matchMedia('(display-mode: standalone)').matches,
          fullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
          minimalUI: window.matchMedia('(display-mode: minimal-ui)').matches,
          browser: window.matchMedia('(display-mode: browser)').matches
        },
        manifest: null as any,
        swRegistration: null as any
      };

      // Verificar se o manifest está carregado
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        info.manifest = {
          href: manifestLink.getAttribute('href'),
          exists: true
        };
      }

      // Verificar service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          info.swRegistration = registration ? {
            active: !!registration.active,
            waiting: !!registration.waiting,
            installing: !!registration.installing,
            scope: registration.scope
          } : null;
          setDebugInfo(info);
        });
      }

      setDebugInfo(info);
    };

    collectDebugInfo();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.error('PWA não está disponível para instalação');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA instalada pelo usuário');
      } else {
        console.log('ℹ️ Usuário recusou instalar o PWA');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('❌ Erro ao instalar PWA:', error);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Não mostrar se já estiver instalado
  if (isInstalled) {
    return (
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <Card sx={{ minWidth: 300, bgcolor: 'success.light', color: 'success.contrastText' }}>
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <InfoIcon />
              <Typography variant="h6">PWA Instalada</Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              O SUPEL está rodando como aplicativo instalado
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip 
                label={isStandalone ? 'Standalone' : 'Fullscreen'} 
                size="small" 
                color="success" 
                variant="outlined"
              />
              <Chip 
                label={isOnline ? 'Online' : 'Offline'} 
                size="small" 
                color={isOnline ? 'success' : 'error'} 
                variant="outlined"
              />
            </Box>
            <Button
              size="small"
              onClick={() => setShowDebug(!showDebug)}
              endIcon={showDebug ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mt: 1 }}
            >
              Debug Info
            </Button>
            <Collapse in={showDebug}>
              <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                <Typography variant="caption" component="pre" sx={{ fontSize: 10 }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </Typography>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Mostrar prompt de instalação se disponível
  if (isInstallable && deferredPrompt) {
    return (
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <Card sx={{ minWidth: 300, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <DownloadIcon />
              <Typography variant="h6">Instalar SUPEL</Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Instale o SUPEL como aplicativo para uma melhor experiência
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                size="small"
                onClick={handleInstall}
                startIcon={<DownloadIcon />}
              >
                Instalar
              </Button>
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Box>
            <Button
              size="small"
              onClick={() => setShowDebug(!showDebug)}
              endIcon={showDebug ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mt: 1 }}
            >
              Debug Info
            </Button>
            <Collapse in={showDebug}>
              <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                <Typography variant="caption" component="pre" sx={{ fontSize: 10 }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </Typography>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Mostrar informações de debug se solicitado
  if (showDebug) {
    return (
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <Card sx={{ minWidth: 300, maxWidth: 400, bgcolor: 'background.paper' }}>
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <InfoIcon />
              <Typography variant="h6">Debug PWA</Typography>
            </Box>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              <Typography variant="caption" component="pre" sx={{ fontSize: 10 }}>
                {JSON.stringify(debugInfo, null, 2)}
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => setShowDebug(false)}
              sx={{ mt: 1 }}
            >
              Fechar
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return null;
}; 