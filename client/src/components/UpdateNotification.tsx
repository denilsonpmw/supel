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
  const { updateAvailable, applyUpdate, isUpdating } = useServiceWorkerUpdate();
  const [dismissed, setDismissed] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  // Timer de 5 segundos antes de forçar atualização
  React.useEffect(() => {
    if (isUpdating && !dismissed) {
      setCountdown(5);
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
      open={updateAvailable && !dismissed}
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
        icon={<DownloadIcon />}
        sx={{
          minWidth: 380,
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
          }
        }}
        action={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {isUpdating && (
              <CircularProgress size={16} sx={{ color: 'white', mb: 1 }} />
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
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: 'primary.main',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,1)',
                  color: 'primary.dark'
                }
              }}
            >
              {isUpdating 
                ? countdown > 0 
                  ? `Atualizando em ${countdown}s...` 
                  : 'Atualizando...'
                : 'Atualizar Agora'
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
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'rgba(255,255,255,0.8)',
                '&:hover': { 
                  borderColor: 'rgba(255,255,255,0.8)',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Depois
            </Button>
          </Box>
        }
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>
            ✨ Nova versão disponível!
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', display: 'block' }}>
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
