import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  Avatar,
  IconButton,
  Zoom,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Celebration as CelebrationIcon,
  Business as BusinessIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onClose, userName }) => {
  const theme = useTheme();
  const [currentDateTime, setCurrentDateTime] = useState(dayjs().format('DD/MM/YYYY | HH:mm'));

  useEffect(() => {
    if (open) {
      const timer = setInterval(() => {
        setCurrentDateTime(dayjs().format('DD/MM/YYYY | HH:mm'));
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [open]);

  const handleCloseModal = async (event?: any, reason?: string) => {
    try {
      // Verifica se está rodando como um aplicativo PWA autônomo (instalado)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      
      // Se não for standalone (está rodando no browser comum) e a API de tela cheia for suportada, tenta abrir em tela cheia
      if (!isStandalone && document.documentElement.requestFullscreen) {
        // Ignora erros que ocorrem se o usuário rejeitar a permissão ou o browser bloquear
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (err) {
      console.log('API de fullscreen não suportada ou bloqueada.');
    } finally {
      // Fecha o modal de qualquer forma
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseModal}
      TransitionComponent={Zoom}
      transitionDuration={500}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1A1F2E 0%, #0F1117 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          position: 'relative'
        }
      }}
    >
      {/* Botão de Fechar */}
      <IconButton
        onClick={(e) => handleCloseModal(e)}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: theme.palette.text.secondary,
          '&:hover': {
            color: theme.palette.error.main,
            bgcolor: alpha(theme.palette.error.main, 0.1)
          }
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: 4, pt: 5, textAlign: 'center' }}>
        {/* Ícone ou Avatar */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
              animation: 'pulse 2s infinite ease-in-out',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)', boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}` },
                '50%': { transform: 'scale(1.05)', boxShadow: `0 0 35px ${alpha(theme.palette.primary.main, 0.6)}` },
                '100%': { transform: 'scale(1)', boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}` },
              }
            }}
          >
            <CelebrationIcon sx={{ fontSize: 45, color: '#fff' }} />
          </Avatar>
        </Box>

        {/* Linha 1 */}
        <Typography 
          variant="overline" 
          sx={{ 
            color: 'primary.main', 
            fontWeight: 700, 
            letterSpacing: 2,
            display: 'block',
            mb: 1
          }}
        >
          Bem-vindo de volta!
        </Typography>

        {/* Linha 2 - Nome do Usuário */}
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            mb: 1,
            color: theme.palette.mode === 'dark' ? 'transparent' : '#64748b',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(to right, #F1F5F9, #94A3B8)'
              : 'none',
            WebkitBackgroundClip: theme.palette.mode === 'dark' ? 'text' : 'unset',
            WebkitTextFillColor: theme.palette.mode === 'dark' ? 'transparent' : 'inherit',
          }}
        >
          {userName}
        </Typography>

        {/* Linha 3 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 4 }}>
          <BusinessIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500
            }}
          >
            Superintendência de Licitações
          </Typography>
        </Box>

        {/* Botão de Ação */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<LoginIcon />}
          onClick={(e) => handleCloseModal(e)}
          sx={{
            py: 1.5,
            borderRadius: 3,
            fontWeight: 700,
            fontSize: '1rem',
            textTransform: 'none',
            boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              boxShadow: `0 12px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.2s'
          }}
        >
          Entrar no Sistema
        </Button>

        {/* Rodapé - Data e Hora */}
        <Box sx={{ mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              fontWeight: 600,
              letterSpacing: 0.5
            }}
          >
            {currentDateTime}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
