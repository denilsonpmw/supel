import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Fade,
  IconButton,
  Paper,
  Snackbar,
  Typography,
  useTheme,
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Refresh as UpdateIcon,
  Close as CloseIcon,
  CloudOff as OfflineIcon,
  CloudDone as OnlineIcon,
} from '@mui/icons-material';
import { usePWA } from '../hooks/usePWA';

interface PWAPromptProps {
  showOfflineIndicator?: boolean;
}

export const PWAPrompt: React.FC<PWAPromptProps> = ({ 
  showOfflineIndicator = true 
}) => {
  const theme = useTheme();
  const {
    isInstallable,
    isUpdateAvailable,
    isOnline,
    installPWA,
    updatePWA,
  } = usePWA();

  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = React.useState(false);
  const [wasOffline, setWasOffline] = React.useState(false);

  // Mostrar prompt de instalação após delay
  React.useEffect(() => {
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000); // Aguarda 3 segundos antes de mostrar

      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  // Mostrar prompt de atualização
  React.useEffect(() => {
    if (isUpdateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [isUpdateAvailable]);

  // Controlar alerta de volta online
  React.useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowOnlineAlert(false);
    } else if (isOnline && wasOffline) {
      setShowOnlineAlert(true);
      setWasOffline(false);
      // Auto esconder após 3 segundos
      const timer = setTimeout(() => {
        setShowOnlineAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await installPWA();
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = () => {
    updatePWA();
    setShowUpdatePrompt(false);
  };

  return (
    <>
      {/* Prompt de Instalação */}
      <Snackbar
        open={showInstallPrompt && isInstallable}
        autoHideDuration={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                startIcon={<InstallIcon />}
                onClick={handleInstall}
                disabled={isInstalling}
              >
                {isInstalling ? 'Instalando...' : 'Instalar'}
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setShowInstallPrompt(false)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
          sx={{
            width: '100%',
            maxWidth: 400,
          }}
        >
          <AlertTitle>Instalar SUPEL</AlertTitle>
          Instale o SUPEL como um aplicativo para acesso rápido e uso offline!
        </Alert>
      </Snackbar>

      {/* Prompt de Atualização */}
      <Snackbar
        open={showUpdatePrompt && isUpdateAvailable}
        autoHideDuration={null}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                startIcon={<UpdateIcon />}
                onClick={handleUpdate}
              >
                Atualizar
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setShowUpdatePrompt(false)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
          sx={{
            width: '100%',
            maxWidth: 400,
          }}
        >
          <AlertTitle>Atualização Disponível</AlertTitle>
          Uma nova versão do SUPEL está disponível!
        </Alert>
      </Snackbar>

      {/* Indicador de Status Offline/Online */}
      {showOfflineIndicator && (
        <Fade in={!isOnline}>
          <Paper
            elevation={4}
            sx={{
              position: 'fixed',
              top: 80,
              right: 16,
              zIndex: theme.zIndex.snackbar,
              backgroundColor: theme.palette.warning.main,
              color: theme.palette.warning.contrastText,
              px: 2,
              py: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <OfflineIcon fontSize="small" />
            <Typography variant="body2" fontWeight="medium">
              Modo Offline
            </Typography>
          </Paper>
        </Fade>
      )}

      {/* Indicador quando volta online */}
      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={() => setShowOnlineAlert(false)}
      >
        <Alert
          severity="success"
          icon={<OnlineIcon />}
          sx={{ minWidth: 200 }}
        >
          Conectado!
        </Alert>
      </Snackbar>
    </>
  );
};

// Componente para botão manual de instalação (para usar na interface)
export const InstallButton: React.FC = () => {
  const { isInstallable, isInstalled, installPWA } = usePWA();
  const [isInstalling, setIsInstalling] = React.useState(false);

  if (!isInstallable || isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await installPWA();
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Button
      variant="outlined"
      startIcon={<InstallIcon />}
      onClick={handleInstall}
      disabled={isInstalling}
      size="small"
    >
      {isInstalling ? 'Instalando...' : 'Instalar App'}
    </Button>
  );
};

// Componente para indicador de status PWA
export const PWAStatus: React.FC = () => {
  const { isInstalled, isOnline } = usePWA();

  if (!isInstalled) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        color: 'text.secondary',
        fontSize: '0.75rem',
      }}
    >
      {isOnline ? (
        <OnlineIcon fontSize="inherit" color="success" />
      ) : (
        <OfflineIcon fontSize="inherit" color="warning" />
      )}
      <Typography variant="caption">
        {isOnline ? 'Online' : 'Offline'}
      </Typography>
    </Box>
  );
}; 