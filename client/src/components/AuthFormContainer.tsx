import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import SupelLogoImage from './SupelLogoImage';

interface AuthFormContainerProps {
  title: string;
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
          padding: 6,
          borderRadius: 3,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(13, 24, 34, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(255, 255, 255, 0.2)'}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 25px 50px rgba(0, 0, 0, 0.5)'
            : '0 25px 50px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <SupelLogoImage size={{ xs: 100, sm: 120 }} />
        </Box>

        {/* Título */}
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#6b7280',
            mb: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Typography>

        {/* Subtítulo */}
        {subtitle && (
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              fontFamily: 'Open Sans, sans-serif',
              fontWeight: 400,
              color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
              mb: 4,
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
