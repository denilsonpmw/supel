import React, { ReactNode } from 'react';
import { Box, BoxProps } from '@mui/material';

interface PageContainerProps extends BoxProps {
  children: ReactNode;
}

/**
 * PageContainer — Container padronizado de página.
 * Garante que todas as páginas tenham larguras e espaçamentos (paddings/margins) consistentes.
 */
const PageContainer: React.FC<PageContainerProps> = ({ children, sx, ...props }) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '1600px', // Limitar a largura em telas ultrawide
        mx: 'auto', // Centraliza o conteúdo se a tela for maior que 1600px
        px: { xs: 2, sm: 3, md: 4 }, // Padding igual em todos os lados (responsivo)
        pt: { xs: 2, sm: 3, md: 4 }, // Margin top da topbar consistente
        pb: 4,
        display: 'flex',
        flexDirection: 'column',
        ...sx, // Permite sobrescrever altura ou overflow caso necessário (ex: ProcessosPage)
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default PageContainer;
