import React from 'react';
import { Chip, useTheme } from '@mui/material';

interface StatusBadgeProps {
  label: string;
  color?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'default';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, color = 'default', className }) => {
  const theme = useTheme();
  
  const getColorValue = () => {
    switch (color) {
      case 'success': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      case 'info': return theme.palette.info.main;
      case 'primary': return theme.palette.primary.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getBgValue = () => {
    switch (color) {
      case 'success': return theme.palette.success.light;
      case 'warning': return theme.palette.warning.light;
      case 'error': return theme.palette.error.light;
      case 'info': return theme.palette.info.light;
      case 'primary': return theme.palette.primary.light;
      default: return theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    }
  };

  // Melhor contraste para background translúcido
  const colorHex = getColorValue();
  
  return (
    <Chip
      label={label}
      size="small"
      className={className}
      sx={{
        fontWeight: 600,
        backgroundColor: color === 'default' 
          ? getBgValue() 
          : `${colorHex}15`, // 15% opacity na cor base
        color: colorHex,
        border: `1px solid ${colorHex}30`,
        borderRadius: 1, // Forma mais quadrada (estilo "card chip")
        px: 0.5
      }}
    />
  );
};

export default StatusBadge;
