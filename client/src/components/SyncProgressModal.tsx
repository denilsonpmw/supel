import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export interface SyncStatus {
  isSyncing: boolean;
  status: 'idle' | 'running' | 'completed' | 'error';
  totalUnits: number;
  currentUnitIndex: number;
  currentUnitName: string;
  totalProcesses: number;
  processedProcesses: number;
  syncedCount: number;
  skippedCount: number;
  unitTotalProcesses: number;
  unitProcessedProcesses: number;
  errors: string[];
  startTime: string | null;
  endTime: string | null;
  message: string;
}

interface SyncProgressModalProps {
  show: boolean;
  onClose: () => void;
  status: SyncStatus | null;
}

export const SyncProgressModal: React.FC<SyncProgressModalProps> = ({ show, onClose, status }) => {
  if (!status) return null;

  const unitWeight = 100 / (status.totalUnits || 1);
  const baseProgress = (Math.max(0, status.currentUnitIndex - 1)) * unitWeight;
  const internalProgress = status.unitTotalProcesses > 0 
    ? (status.unitProcessedProcesses / status.unitTotalProcesses) * unitWeight
    : 0;
    
  const rawProgress = status.status === 'completed' ? 100 : Math.min(99.99, baseProgress + internalProgress);
  const progress = Math.round(rawProgress * 100) / 100;
  const progressFormatted = progress.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Dialog open={show} onClose={onClose} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 'bold', color: 'text.primary' }}>
        Portal de Compras Públicas
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            {status.status === 'completed' ? (
              <CheckCircleIcon sx={{ fontSize: 44, color: 'success.main', mb: 1 }} />
            ) : (
              <CircularProgress size={40} color="inherit" sx={{ mb: 1, color: '#f9a825 !important' }} />
            )}
            <Typography variant="h6" display="block" sx={{ fontWeight: 600 }}>
              {status.status === 'completed' ? 'Concluída' : 'Sincronizando...'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              UG {status.currentUnitIndex} de {status.totalUnits}
            </Typography>
          </Box>
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight="bold">
              {status.message}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">
              {progressFormatted}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              backgroundColor: 'rgba(249, 168, 37, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#f9a825'
              }
            }} 
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {status.status === 'completed' ? `${status.syncedCount} novos` : `${status.unitProcessedProcesses}/${status.unitTotalProcesses} na unidade`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {status.skippedCount} já atualizados
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={onClose} disabled={status.isSyncing} variant="contained" color="primary">
          {status.isSyncing ? 'Sincronizando...' : 'Fechar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
