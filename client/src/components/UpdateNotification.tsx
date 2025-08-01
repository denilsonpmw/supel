import React from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { 
  UpdateOutlined as UpdateIcon,
  CloudDownloadOutlined as DownloadIcon 
} from '@mui/icons-material';
import { useServiceWorkerUpdate } from '../hooks/useServiceWorkerUpdate';

export const UpdateNotification: React.FC = () => {
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
    console.log('� Usuário solicitou atualização');
    applyUpdate();
  };

  const handleDismiss = () => {
    // Marca que o usuário viu a notificação mas escolheu não atualizar agora
    localStorage.setItem('pwa-pending-update', 'true');
    console.log('� Usuário adiou atualização - será aplicada na próxima sessão');
    setDismissed(true);
  };

  return (
    <Snackbar
      open={(updateAvailable && !dismissed) || (isUpdating && countdown > 0)}
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
        variant="outlined"
        icon={<DownloadIcon />}
        sx={{
          minWidth: 380,
          backgroundColor: 'transparent',
          borderColor: '#9e9e9e',
          color: '#fff',
          '& .MuiAlert-message': {
            width: '100%',
            fontSize: '0.875rem',
            fontWeight: 500
          },
          '& .MuiAlert-action': {
            padding: 0,
            marginRight: 0,
            alignItems: 'flex-start',
            paddingTop: '6px'
          },
          '& .MuiAlert-icon': {
            color: '#1976d2'
          }
        }}
        action={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {isUpdating && (
              <CircularProgress size={16} sx={{ color: '#1976d2', mb: 1 }} />
            )}
            <Button
              color="inherit"
              size="small"
              onClick={handleUpdate}
              disabled={isUpdating}
              startIcon={isUpdating ? undefined : <UpdateIcon />}
              variant="contained"
              sx={{ 
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
                backgroundColor: '#1976d2',
                color: 'white',
                minWidth: 140,
                px: 2,
                '&:hover': { 
                  backgroundColor: '#1565c0'
                }
              }}
            >
              {isUpdating 
                ? countdown > 0 
                  ? `Atualizando em ${countdown}s...` 
                  : 'Atualizando...'
                : 'Atualizar'
              }
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={handleDismiss}
              disabled={isUpdating}
              variant="outlined"
              sx={{ 
                fontWeight: 400,
                textTransform: 'none',
                fontSize: '0.75rem',
                //borderColor: '#9e9e9e',
                backgroundColor: '#9e9e9e',
                color: 'white',
                minWidth: 140,
                px: 2,
                '&:hover': { 
                  //borderColor: '#757575',
                  backgroundColor: '#757575' //'rgba(158, 158, 158, 0.1)'
                }
              }}
            >
              Depois
            </Button>
          </Box>
        }
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#fff' }}>
            ✨ Nova versão disponível! {currentVersion && `(v${currentVersion})`}
          </Typography>
          <Typography variant="caption" sx={{ color: '#fff', display: 'block' }}>
            {isUpdating && countdown > 0 
              ? `Aplicando em ${countdown} segundos...`
              : 'Atualize agora ou será aplicada automaticamente na próxima abertura.'
            }
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};
