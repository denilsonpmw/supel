import React from 'react';
import { Box, useTheme } from '@mui/material';

interface SupelLogoImageProps {
  size?: number | { xs: number; sm: number; md?: number };
  showShadow?: boolean;
  enableHover?: boolean;
}

const SupelLogoImage: React.FC<SupelLogoImageProps> = ({ 
  size = { xs: 100, sm: 120 }, 
  showShadow = true,
  enableHover = true 
}) => {
  const theme = useTheme();

  const sizeProps = typeof size === 'number' 
    ? { width: size, height: size }
    : { width: size, height: size };

  return (
    <Box
      component="img"
      src="/logo-1024.png"
      alt="SUPEL - Superintendência de Licitações"
      sx={{
        ...sizeProps,
        borderRadius: '50%',
        filter: theme.palette.mode === 'dark' ? 'none' : 'brightness(1)',
        transition: 'all 0.3s ease',
        ...(showShadow && {
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.1)',
        }),
        ...(enableHover && {
          '&:hover': {
            transform: 'scale(1.05)',
            ...(showShadow && {
              boxShadow: theme.palette.mode === 'dark'
                ? '0 6px 25px rgba(0, 0, 0, 0.4)'
                : '0 6px 25px rgba(0, 0, 0, 0.15)',
            }),
          }
        })
      }}
    />
  );
};

export default SupelLogoImage;
