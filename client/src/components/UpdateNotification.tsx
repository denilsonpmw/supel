import React, { useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  CircularProgress
} from '@mui/material';
import { 
  UpdateOutlined as UpdateIcon,
  CloudDownloadOutlined as DownloadIcon 
} from '@mui/icons-material';
import { useServiceWorkerUpdate } from '../hooks/useServiceWorkerUpdate';

export const UpdateNotification: React.FC = () => {
  const { updateAvailable, applyUpdate, isUpdating } = useServiceWorkerUpdate();

  // Log para debug (pode remover em produção)
  useEffect(() => {
    if (updateAvailable) {
      console.log('🔔 Notificação de atualização exibida');
    }
  }, [updateAvailable]);

  const handleUpdate = () => {
    console.log('🔄 Usuário solicitou atualização');
    applyUpdate();
  };

  return (
    <Snackbar
      open={updateAvailable}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{ 
        zIndex: 9999,
        mb: 2,
        mr: 2,
        '& .MuiSnackbarContent-root': {
          padding: 0
        }
      }}
    >
      <Alert
        severity="info"
        icon={<UpdateIcon />}
        sx={{
          minWidth: 280,
          alignItems: 'center',
          '& .MuiAlert-message': {
            flex: 1,
            fontSize: '0.875rem'
          }
        }}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isUpdating && (
              <CircularProgress size={16} color="inherit" />
            )}
            <Button 
              color="inherit" 
              size="small"
              onClick={handleUpdate}
              disabled={isUpdating}
              startIcon={isUpdating ? undefined : <DownloadIcon />}
              sx={{
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem'
              }}
            >
              {isUpdating ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </Box>
        }
      >
        Nova versão disponível
      </Alert>
    </Snackbar>
  );
};
