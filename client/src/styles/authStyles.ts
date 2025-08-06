import { Theme } from '@mui/material/styles';

export const getAuthInputStyles = (theme: Theme) => ({
  '& .MuiOutlinedInput-root': {
    fontFamily: 'Raleway, sans-serif',
    fontWeight: 200, // Extra Light
    borderRadius: 3,
    backgroundColor: 'transparent', // Container transparente
    border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}`,
    transition: 'all 0.3s ease-in-out',
    overflow: 'hidden',
    
    '& fieldset': {
      border: 'none',
    },
    
    '&:hover': {
      border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}`,
    },
    
    '&.Mui-focused': {
      border: `2px solid ${theme.palette.mode === 'dark' ? '#ffffff' : '#000000'}`,
      boxShadow: 'none',
    },
    
    '& .MuiInputAdornment-root': {
      backgroundColor: 'transparent', // Área do ícone transparente
      margin: 0,
      marginRight: 0, // Remove a margem que causa o deslocamento
      padding: '0px 0px',
      width: 56,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    '& input': {
      fontFamily: 'Raleway, sans-serif',
      fontWeight: 300, // Extra Light
      fontSize: '1rem',
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
      padding: '14px 16px',
      backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e2e2e2ff', // Fundo cinza azulado claro
      
      '&::placeholder': {
        fontFamily: 'Raleway, sans-serif',
        fontWeight: 300, // Extra Light
        color: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.6)' 
          : 'rgba(0, 0, 0, 0.6)',
        opacity: 1,
      },
    },
  },
  
  '& .MuiInputLabel-root': {
    fontFamily: 'Open Sans, sans-serif',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
    transform: 'translate(16px, 16px) scale(1)',
    
    '&.Mui-focused': {
      color: '#3b82f6',
    },
    
    '&.MuiInputLabel-shrink': {
      transform: 'translate(16px, -6px) scale(0.85)',
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(17, 24, 39, 1)' 
        : '#ffffff',
      padding: '0 8px',
    },
  },
});

export const getAuthButtonStyles = (theme: Theme, variant: 'primary' | 'secondary' = 'primary') => {
  if (variant === 'primary') {
    return {
      fontFamily: 'Raleway, sans-serif',
      fontWeight: 300, // Light
      fontSize: '1.1rem',
      textTransform: 'none' as const,
      borderRadius: 3,
      padding: '14px 32px',
      backgroundColor: '#3b82f6', // Azul original
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
      transition: 'all 0.2s ease-in-out',
      
      '&:hover': {
        backgroundColor: '#2563eb', // Hover azul original
        boxShadow: '0 6px 20px rgba(59, 130, 246, 0.35)',
        transform: 'translateY(-1px)',
      },
      
      '&:active': {
        transform: 'translateY(0)',
      },
      
      '&:disabled': {
        backgroundColor: theme.palette.mode === 'dark' ? '#374151' : '#d1d5db',
        color: theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af',
        boxShadow: 'none',
        transform: 'none',
      },
    };
  }
  
  return {
    fontFamily: 'Open Sans, sans-serif',
    fontWeight: 500,
    fontSize: '0.9rem',
    textTransform: 'none' as const,
    borderRadius: 2,
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.8)'}`,
    transition: 'all 0.2s ease-in-out',
    
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(75, 85, 99, 0.2)' : 'rgba(249, 250, 251, 0.8)',
      borderColor: theme.palette.mode === 'dark' ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.3)',
      color: theme.palette.mode === 'dark' ? '#f3f4f6' : '#374151',
    },
  };
};
