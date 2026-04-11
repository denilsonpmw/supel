import React, { ReactNode } from 'react';
import { Box, Typography, Divider, useTheme } from '@mui/material';

interface PageHeaderProps {
  /** Título principal da página */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Elementos de ação posicionados à direita (botões, filtros, etc.) */
  actions?: ReactNode;
  /** Não renderizar o Divider inferior */
  noDivider?: boolean;
  /** Modo inline: sem mb externo, sem divider. Usar dentro de containers flex existentes. */
  inline?: boolean;
}

/**
 * PageHeader — Componente padronizado de cabeçalho de página.
 * Garante posicionamento, tamanho e aparência consistentes em todas as páginas.
 * Sem ícones no título (conforme design system v2).
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, noDivider = false, inline = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box mb={inline ? 0 : 3}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        mb={noDivider ? 0 : 1.5}
      >
        <Box>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.25rem', sm: '1.375rem' },
              letterSpacing: '-0.02em',
              color: isDark ? '#F1F5F9' : '#0F172A',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                mt: 0.25,
                color: isDark ? '#64748B' : '#6B7280',
                fontSize: '0.875rem',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {actions}
          </Box>
        )}
      </Box>
      {!noDivider && !inline && (
        <Divider
          sx={{
            borderColor: isDark ? '#1E2A3A' : '#E2E8F0',
          }}
        />
      )}
    </Box>
  );
};

export default PageHeader;
