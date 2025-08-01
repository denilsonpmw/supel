import { Theme } from '@mui/material/styles';

export const getAuthInputStyles = (theme: Theme) => ({
  '& .MuiOutlinedInput-root': {
    fontFamily: 'Open Sans, sans-serif',
    borderRadius: 2,
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(17, 24, 39, 0.8)' 
      : 'rgba(249, 250, 251, 0.9)',
    border: `1px solid ${theme.palette.mode === 'dark' 
      ? 'rgba(75, 85, 99, 0.3)' 
      : 'rgba(209, 213, 219, 0.8)'}`,
    transition: 'all 0.2s ease-in-out',
    
    '& fieldset': {
      border: 'none',
    },
    
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(17, 24, 39, 0.9)' 
        : 'rgba(249, 250, 251, 1)',
      borderColor: theme.palette.mode === 'dark' 
        ? 'rgba(96, 165, 250, 0.5)' 
        : 'rgba(59, 130, 246, 0.5)',
    },
    
    '&.Mui-focused': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(17, 24, 39, 1)' 
        : '#ffffff',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
    
    '& input': {
      fontFamily: 'Open Sans, sans-serif',
      fontSize: '0.95rem',
      color: theme.palette.mode === 'dark' ? '#f9fafb' : '#1f2937',
      padding: '14px 16px',
      
      '&::placeholder': {
        color: theme.palette.mode === 'dark' 
          ? 'rgba(156, 163, 175, 0.8)' 
          : 'rgba(107, 114, 128, 0.8)',
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
      fontFamily: 'Open Sans, sans-serif',
      fontWeight: 600,
      fontSize: '0.95rem',
      textTransform: 'none' as const,
      borderRadius: 2,
      padding: '12px 24px',
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
      transition: 'all 0.2s ease-in-out',
      
      '&:hover': {
        backgroundColor: '#2563eb',
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
