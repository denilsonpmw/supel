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

  const handleUpdate = () => {
    applyUpdate();
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-pending-update', 'true');
    setDismissed(true);
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
        icon={<DownloadIcon sx={{ color: isDark ? '#fff' : theme.palette.info.contrastText }} />}
        sx={{
          minWidth: 400,
          backgroundColor: isDark ? '#1976d2' : theme.palette.info.main,
          color: isDark ? '#fff' : theme.palette.info.contrastText,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          '& .MuiAlert-message': {
            width: '100%',
            fontSize: '0.9rem',
            fontWeight: 500
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
                backgroundColor: isDark ? '#fff' : theme.palette.common.white,
                color: theme.palette.primary.main,
                minWidth: 150,
                '&:hover': { 
                  backgroundColor: '#f5f5f5'
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  color: isDark ? '#fff' : theme.palette.info.contrastText
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
                  color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.9)',
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
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {isUpdating ? '🚀 Aplicando atualizações...' : `✨ Nova versão disponível! ${currentVersion ? `(v${currentVersion})` : ''}`}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
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
