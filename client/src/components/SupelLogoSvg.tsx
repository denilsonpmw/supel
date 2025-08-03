import React from 'react';

/**
 * SupelLogoSvg - SVG logo recriado do zero baseado na logo-1024.png
 * - Fundo azul #3247C5
 * - Círculo central #D9D9D9
 * - Ferramenta de leiloeiro (cabo #E1E6E9, ponteira #D0A985)
 * - Nome SUPEL (Instrument Sans, bold)
 * - Superintendência de Licitações (Instrument Sans, medium)
 */

interface SupelLogoSvgProps {
  size?: number;
  className?: string;
}

const SupelLogoSvg: React.FC<SupelLogoSvgProps> = ({ 
  size = 320,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
        {/* Fundo azul */}
        <rect width="1024" height="1024" fill="#3247C5" />

        {/* Nome SUPEL - 220px */}
        <text
          x="512"
          y="450"
          textAnchor="middle"
          fontFamily="'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="bold"
          fontSize="220"
          fill="#FFFFFF"
          letterSpacing="0.1em"
          dominantBaseline="middle"
        >
          SUPEL
        </text>

        {/* Subtítulo - Linha 1 - 64px com peso menor */}
        <text
          x="512"
          y="620"
          textAnchor="middle"
          fontFamily="'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="400"
          fontSize="64"
          fill="#FFFFFF"
          letterSpacing="0.06em"
          dominantBaseline="middle"
        >
          SUPERINTENDÊNCIA DE
        </text>

        {/* Subtítulo - Linha 2 - 64px com peso menor */}
        <text
          x="512"
          y="700"
          textAnchor="middle"
          fontFamily="'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="400"
          fontSize="64"
          fill="#FFFFFF"
          letterSpacing="0.06em"
          dominantBaseline="middle"
        >
          LICITAÇÕES
        </text>
      </svg>
  );
};

export default SupelLogoSvg;
