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
        maxWidth: '1920px', // Limite de largura (ajuste aqui caso queira maior ou menor, ex: '100%', 'none', '1600px')
        mx: 'auto', // Centraliza o conteúdo se a tela for maior que o maxWidth
        px: { xs: 1, sm: 1.5, md: 2 }, // Margens pequenas nas laterais
        pt: { xs: 2, sm: 2.5, md: 3 }, // Margin top da topbar consistente
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
