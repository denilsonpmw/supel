import React from 'react';
import { Box, useTheme } from '@mui/material';

interface SupelLogoSvgProps {
  size?: number | { xs: number; sm: number; md?: number };
  showShadow?: boolean;
  enableHover?: boolean;
}

const SupelLogoSvg: React.FC<SupelLogoSvgProps> = ({ 
  size = { xs: 100, sm: 120 }, 
  showShadow = true,
  enableHover = true 
}) => {
  const theme = useTheme();

  const sizeValue = typeof size === 'number' ? size : size.xs;

  return (
    <Box
      sx={{
        width: typeof size === 'number' ? size : size,
        height: typeof size === 'number' ? size : size,
        borderRadius: '50%',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
    >
      <svg
        width={sizeValue}
        height={sizeValue}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Círculo de fundo */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="url(#backgroundGradient)"
        />
        
        {/* Texto SUPEL */}
        <text
          x="100"
          y="85"
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill="#FFFFFF"
          fontFamily="Arial, sans-serif"
        >
          SUPEL
        </text>
        
        {/* Subtítulo */}
        <text
          x="100"
          y="105"
          textAnchor="middle"
          fontSize="10"
          fill="#E3F2FD"
          fontFamily="Arial, sans-serif"
        >
          Superintendência
        </text>
        <text
          x="100"
          y="118"
          textAnchor="middle"
          fontSize="10"
          fill="#E3F2FD"
          fontFamily="Arial, sans-serif"
        >
          de Licitações
        </text>
        
        {/* Ícone de engrenagem/processo */}
        <g transform="translate(100, 140)">
          <circle r="8" fill="#FFFFFF" opacity="0.8"/>
          <circle r="5" fill="none" stroke="#1976D2" strokeWidth="1"/>
          <circle r="2" fill="#1976D2"/>
        </g>
        
        {/* Gradiente de fundo */}
        <defs>
          <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1976D2" />
            <stop offset="50%" stopColor="#1565C0" />
            <stop offset="100%" stopColor="#0D47A1" />
          </linearGradient>
        </defs>
      </svg>
    </Box>
  );
};

export default SupelLogoSvg;
