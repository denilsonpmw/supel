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
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ 
        zIndex: 9999,
        '& .MuiSnackbarContent-root': {
          padding: 0
        }
      }}
    >
      <Alert
        severity="info"
        icon={<UpdateIcon />}
        sx={{
          width: '100%',
          minWidth: 300,
          alignItems: 'center',
          '& .MuiAlert-message': {
            flex: 1
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
                textTransform: 'none'
              }}
            >
              {isUpdating ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </Box>
        }
      >
        <Box component="span" sx={{ fontWeight: 500 }}>
          ✨ Nova versão disponível!
        </Box>
        <Box component="span" sx={{ fontSize: '0.875rem', opacity: 0.8, display: 'block' }}>
          Clique para atualizar e obter as melhorias mais recentes.
        </Box>
      </Alert>
    </Snackbar>
  );
};
