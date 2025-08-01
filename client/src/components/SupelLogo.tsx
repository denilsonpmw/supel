import React from 'react';
import { Box } from '@mui/material';

interface SupelLogoProps {
  size?: number;
  color?: string;
}

const SupelLogo: React.FC<SupelLogoProps> = ({ size = 120, color = '#3b82f6' }) => {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        border: '3px solid',
        borderColor: color,
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
      }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Martelo do Juiz */}
        <g transform="translate(20, 25)">
          {/* Cabo do martelo */}
          <rect
            x="25"
            y="30"
            width="4"
            height="35"
            fill={color}
            rx="2"
          />
          
          {/* Cabeça do martelo */}
          <rect
            x="15"
            y="15"
            width="24"
            height="12"
            fill={color}
            rx="6"
          />
          
          {/* Base/Suporte */}
          <ellipse
            cx="27"
            cy="70"
            rx="12"
            ry="4"
            fill={color}
            opacity="0.7"
          />
          
          {/* Decoração - linhas de movimento */}
          <g opacity="0.4">
            <line x1="45" y1="20" x2="55" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
            <line x1="45" y1="25" x2="52" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          </g>
        </g>
      </svg>
    </Box>
  );
};

export default SupelLogo;
