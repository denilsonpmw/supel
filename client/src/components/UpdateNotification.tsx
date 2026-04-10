import React from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  UpdateOutlined as UpdateIcon,
  CloudDownloadOutlined as DownloadIcon 
} from '@mui/icons-material';
import { useServiceWorkerUpdate } from '../hooks/useServiceWorkerUpdate';

export const UpdateNotification: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { updateAvailable, applyUpdate, isUpdating, currentVersion } = useServiceWorkerUpdate();
  const [dismissed, setDismissed] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  // Timer de 10 segundos antes de forçar atualização
  React.useEffect(() => {
    if (isUpdating && !dismissed) {
      setCountdown(10);
      const timer = setInterval(() => {
        setCountdown((prev: number) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isUpdating, dismissed]);

  // Verificar atualizações pendentes ao abrir a sessão
  React.useEffect(() => {
    if (updateAvailable && localStorage.getItem('pwa-pending-update') === 'true' && !isUpdating) {
      localStorage.removeItem('pwa-pending-update');
      applyUpdate();
    }
  }, [updateAvailable, applyUpdate, isUpdating]);

  const handleUpdate = () => {
    localStorage.removeItem('pwa-pending-update');
    applyUpdate();
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-pending-update', 'true');
    setDismissed(true);
    
    // Agendar atualização automática para daqui a 10 minutos (600.000ms)
    setTimeout(() => {
      // Verifica se a atualização ainda está disponível e se o usuário não mudou de ideia/já atualizou
      if (localStorage.getItem('pwa-pending-update') === 'true') {
        localStorage.removeItem('pwa-pending-update');
        applyUpdate();
      }
    }, 10 * 60 * 1000);
  };

  return (
    <Snackbar
      open={(updateAvailable && !dismissed) || isUpdating}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={null}
      sx={{ 
        mb: 2,
        mr: 2,
        zIndex: 9999,
        '& .MuiSnackbarContent-root': {
          minWidth: 'auto',
          padding: 0
        }
      }}
    >
      <Alert
        severity="info"
        variant="filled"
        icon={<DownloadIcon sx={{ color: '#ffffff' }} />}
        sx={{
          minWidth: 400,
          backgroundColor: '#1976d2', // Azul consistente para garantir legibilidade com texto branco
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          '& .MuiAlert-message': {
            width: '100%',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#ffffff'
          },
          '& .MuiAlert-action': {
            padding: 0,
            marginRight: 0,
            alignItems: 'center'
          }
        }}
        action={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
            <Button
              color="inherit"
              size="small"
              onClick={handleUpdate}
              disabled={isUpdating}
              startIcon={isUpdating ? <CircularProgress size={16} color="inherit" /> : <UpdateIcon />}
              variant="contained"
              sx={{ 
                fontWeight: 700,
                textTransform: 'none',
                backgroundColor: '#ffffff',
                color: '#1976d2',
                minWidth: 150,
                '&:hover': { 
                  backgroundColor: '#f5f5f5'
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  color: '#ffffff'
                }
              }}
            >
              {isUpdating 
                ? countdown > 0 
                  ? `Reiniciando em ${countdown}s` 
                  : 'Reiniciando...'
                : 'Atualizar Agora'
              }
            </Button>
            {!isUpdating && (
              <Button
                color="inherit"
                size="small"
                onClick={handleDismiss}
                variant="text"
                sx={{ 
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  color: '#ffffff',
                  textDecoration: 'underline',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Lembrar depois
              </Button>
            )}
          </Box>
        }
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#ffffff' }}>
            {isUpdating ? '🚀 Aplicando atualizações...' : `✨ Nova versão disponível! ${currentVersion ? `(v${currentVersion})` : ''}`}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, color: '#ffffff' }}>
            {isUpdating 
              ? 'Por favor, aguarde enquanto o sistema é atualizado com as melhorias mais recentes.'
              : 'Uma nova versão com melhorias e correções gerais está disponível.'
            }
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};
