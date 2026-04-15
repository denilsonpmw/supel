import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import logoSupel from '../assets/logo-supel.png';

interface AuthFormContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AuthFormContainer: React.FC<AuthFormContainerProps> = ({ title, subtitle, children }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 2,
        padding: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '92vh', // Não ultrapassa a altura da tela
          overflowY: 'auto', // Mantém funcionalidade de scroll
          overflowX: 'hidden', // Evita deslocamentos laterais
          padding: { xs: 3, sm: 'clamp(24px, 4.5vh, 48px)', md: 'clamp(32px, 6vh, 56px)' },
          borderRadius: 3,
          // Oculta a barra de rolagem visualmente em todos os navegadores
          msOverflowStyle: 'none', // IE e Edge
          scrollbarWidth: 'none', // Firefox
          '&::-webkit-scrollbar': { 
            display: 'none' // Chrome, Safari e Opera
          },
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(13, 24, 34, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: 'none', // Removida qualquer borda em ambos os temas para limpeza total
          outline: 'none',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 25px 50px rgba(0, 0, 0, 0.5)'
            : '0 25px 50px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box 
              component="img" 
              src={logoSupel} 
              alt="Logo SUPEL" 
              sx={{ 
                // Como a imagem é quadrada, largura e altura devem escalar juntas
                width: 'clamp(100px, 20vh, 180px)', 
                height: 'clamp(100px, 20vh, 180px)',
                objectFit: 'contain',
                clipPath: 'inset(4px)',
                mixBlendMode: theme.palette.mode === 'dark' ? 'normal' : 'multiply',
                filter: theme.palette.mode === 'dark' ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' : 'none'
              }} 
            />
        </Box>

        {/* Título */}
        {title && (
          <Typography
            variant="h4"
            sx={{
              textAlign: 'center',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#1e293b',
              mb: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Typography>
        )}

        {/* Subtítulo */}
        {subtitle && (
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              fontFamily: 'Open Sans, sans-serif',
              fontWeight: 400,
              color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
              mb: 3, // Reduzido de 4 para 3
            }}
          >
            {subtitle}
          </Typography>
        )}

        {/* Conteúdo do formulário */}
        {children}
      </Paper>
    </Box>
  );
};

export default AuthFormContainer;
