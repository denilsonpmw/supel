import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Cores modernas e coesas para ambos os temas
export const MODERN_COLORS = {
  light: [
    '#2563EB', // Blue-600
    '#10B981', // Emerald-500
    '#F59E0B', // Amber-500
    '#EF4444', // Red-500
    '#7C3AED', // Violet-600
    '#06B6D4', // Cyan-500
    '#84CC16', // Lime-500
    '#F97316', // Orange-500
  ],
  dark: [
    '#60A5FA', // Blue-400
    '#34D399', // Emerald-400
    '#FBBF24', // Amber-400
    '#F87171', // Red-400
    '#A78BFA', // Violet-400
    '#22D3EE', // Cyan-400
    '#A3E635', // Lime-400
    '#FB923C', // Orange-400
  ]
};

export const useCustomTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useCustomTheme must be used within a ThemeContextProvider');
  }
  return context;
};

interface ThemeContextProviderProps {
  children: ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const getInitialTheme = (): ThemeMode => {
    const savedTheme = localStorage.getItem('supel_theme') as ThemeMode;
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [mode, setMode] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    localStorage.setItem('supel_theme', mode);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', mode === 'dark' ? '#0F1117' : '#1E3A8A');
    }
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (metaStatusBar) {
      metaStatusBar.setAttribute('content', mode === 'dark' ? 'black-translucent' : 'default');
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  // ---------------------------------------------------------------------------
  // LIGHT THEME  — Paleta refinada e moderna
  // ---------------------------------------------------------------------------
  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#2563EB',       // Blue-600 — mais vibrante
        light: '#3B82F6',      // Blue-500
        dark: '#1D4ED8',       // Blue-700
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#7C3AED',       // Violet-600
        light: '#8B5CF6',      // Violet-500
        dark: '#6D28D9',       // Violet-700
        contrastText: '#ffffff',
      },
      background: {
        default: '#F1F5F9',    // Slate-100 — fundo mais sofisticado
        paper: '#FFFFFF',
      },
      text: {
        primary: '#0F172A',    // Slate-900
        secondary: '#64748B',  // Slate-500
      },
      success: {
        main: '#10B981',
        light: '#D1FAE5',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#F59E0B',
        light: '#FEF3C7',
        dark: '#D97706',
        contrastText: '#ffffff',
      },
      error: {
        main: '#EF4444',
        light: '#FEE2E2',
        dark: '#DC2626',
        contrastText: '#ffffff',
      },
      info: {
        main: '#0EA5E9',       // Sky-500
        light: '#E0F2FE',      // Sky-100
        dark: '#0284C7',       // Sky-600
        contrastText: '#ffffff',
      },
      divider: '#E2E8F0',      // Slate-200
      action: {
        hover: 'rgba(37, 99, 235, 0.05)',
        selected: 'rgba(37, 99, 235, 0.10)',
        disabled: '#94A3B8',
        disabledBackground: '#E2E8F0',
      },
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 600, letterSpacing: '-0.015em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      button: { fontWeight: 600, letterSpacing: '0.01em' },
      caption: { fontSize: '0.75rem', color: '#64748B' },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#1E3A8A',  // Blue-900 — topbar luz elegante
            color: '#ffffff',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: { backgroundColor: 'transparent' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            transition: 'box-shadow 0.2s ease',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { backgroundColor: '#FFFFFF' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            lineHeight: 1.5,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 1px 3px rgba(0,0,0,0.12)' },
          },
          outlined: {
            borderColor: '#CBD5E1',
            '&:hover': { borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.04)' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 500, fontSize: '0.8125rem' },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            fontSize: '0.8125rem',
            borderRadius: 6,
            padding: '6px 10px',
          },
          arrow: { color: '#0F172A' },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            borderTop: '1px solid #E2E8F0',
          },
          toolbar: { color: '#0F172A' },
          selectLabel: { color: '#64748B' },
          displayedRows: { color: '#0F172A' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            fontSize: '0.8125rem',
            color: '#475569',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          },
          root: {
            borderColor: '#E2E8F0',
            fontSize: '0.875rem',
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: { backgroundColor: '#2563EB', fontWeight: 600 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 8 },
          standardInfo: { backgroundColor: '#EFF6FF', color: '#1E40AF' },
          standardSuccess: { backgroundColor: '#ECFDF5', color: '#065F46' },
          standardWarning: { backgroundColor: '#FFFBEB', color: '#92400E' },
          standardError: { backgroundColor: '#FEF2F2', color: '#991B1B' },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: '#E2E8F0' },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            borderRadius: '8px !important',
            fontSize: '0.875rem',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& fieldset': { borderColor: '#CBD5E1' },
            '&:hover fieldset': { borderColor: '#94A3B8' },
            '&.Mui-focused fieldset': { borderColor: '#2563EB' },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 12, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
        },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // DARK THEME — Paleta azul-escura sofisticada
  // ---------------------------------------------------------------------------
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#3B82F6',       // Blue-500
        light: '#60A5FA',      // Blue-400
        dark: '#2563EB',       // Blue-600
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#8B5CF6',       // Violet-500
        light: '#A78BFA',      // Violet-400
        dark: '#7C3AED',       // Violet-600
        contrastText: '#ffffff',
      },
      background: {
        default: '#0F1117',    // Preto azulado profundo
        paper: '#1A1F2E',      // Azul-escuro refinado
      },
      text: {
        primary: '#F1F5F9',    // Slate-100
        secondary: '#94A3B8',  // Slate-400
      },
      success: {
        main: '#10B981',
        light: '#34D399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#F59E0B',
        light: '#FBBF24',
        dark: '#D97706',
        contrastText: '#ffffff',
      },
      error: {
        main: '#EF4444',
        light: '#F87171',
        dark: '#DC2626',
        contrastText: '#ffffff',
      },
      info: {
        main: '#0EA5E9',
        light: '#38BDF8',
        dark: '#0284C7',
        contrastText: '#ffffff',
      },
      divider: '#1E2A3A',
      action: {
        hover: 'rgba(241,245,249,0.06)',
        selected: 'rgba(241,245,249,0.10)',
        disabled: '#475569',
        disabledBackground: '#1E293B',
      },
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.02em', color: '#F1F5F9' },
      h5: { fontWeight: 600, letterSpacing: '-0.015em', color: '#E2E8F0' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em', color: '#E2E8F0' },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6, color: '#CBD5E1' },
      body2: { fontSize: '0.875rem', lineHeight: 1.5, color: '#94A3B8' },
      button: { fontWeight: 600, letterSpacing: '0.01em' },
      caption: { fontSize: '0.75rem', color: '#64748B' },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#060B14 !important',  // Preto profundo para topbar dark
            color: '#ffffff',
            boxShadow: 'none !important',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: { backgroundColor: '#060B14 !important' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: '#1A1F2E !important',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.3)',
            borderRadius: 10,
            border: '1px solid #1E2A3A',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { backgroundColor: '#1A1F2E !important' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: '#1A1F2E !important',
            backgroundImage: 'none',
            color: '#F1F5F9',
            borderColor: '#1E2A3A',
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: { backgroundColor: '#FF5D14 !important', fontWeight: 600 },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            backgroundColor: '#1A1F2E !important',
            color: '#94A3B8',
            borderColor: '#1E2A3A',
            '&.Mui-selected': {
              backgroundColor: '#2563EB !important',
              color: '#ffffff',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.4)' },
          },
          outlined: {
            borderColor: '#1E2A3A',
            '&:hover': { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundColor: '#1E2A3A',
            color: '#CBD5E1',
            fontWeight: 500,
            fontSize: '0.8125rem',
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: { backgroundColor: '#1A1F2E !important' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: '#1E2A3A',
            color: '#CBD5E1',
            backgroundColor: 'inherit',
            fontSize: '0.875rem',
          },
          head: {
            backgroundColor: '#131929',
            color: '#94A3B8',
            fontWeight: 600,
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: '#1A1F2E',
            color: '#F1F5F9',
            borderRadius: 12,
            border: '1px solid #1E2A3A',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#131929 !important',
              color: '#F1F5F9',
              borderRadius: 8,
              '& fieldset': { borderColor: '#1E2A3A' },
              '&:hover fieldset': { borderColor: '#334155' },
              '&.Mui-focused fieldset': { borderColor: '#3B82F6' },
            },
            '& .MuiInputLabel-root': { color: '#64748B' },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: '#131929 !important',
            color: '#F1F5F9',
            borderRadius: 8,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            backgroundColor: '#1A1F2E !important',
            color: '#CBD5E1',
            fontSize: '0.875rem',
            '&:hover': { backgroundColor: '#1E2A3A !important' },
            '&.Mui-selected': {
              backgroundColor: '#1E2A3A !important',
              '&:hover': { backgroundColor: '#253347 !important' },
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: '#1E2A3A',
            color: '#F1F5F9',
            fontSize: '0.8125rem',
            borderRadius: 6,
            border: '1px solid #253347',
          },
          arrow: { color: '#1E2A3A' },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: '#131929 !important',
            color: '#CBD5E1',
          },
          icon: { '&.MuiAlert-icon': { color: '#94A3B8' } },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: { color: '#3B82F6 !important' },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { backgroundColor: '#1E2A3A !important' },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            backgroundColor: '#1A1F2E !important',
            '&:hover': { backgroundColor: '#1E2A3A !important' },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: '#1A1F2E !important',
            color: '#CBD5E1',
            border: '1px solid #1E2A3A',
            borderRadius: 8,
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: { backgroundColor: 'inherit' },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: { color: '#475569 !important' },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#131929',
            borderRight: '1px solid #1E2A3A',
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            backgroundColor: '#1A1F2E !important',
            color: '#CBD5E1',
            borderTop: '1px solid #1E2A3A',
          },
          toolbar: { color: '#CBD5E1' },
          selectLabel: { color: '#64748B' },
          displayedRows: { color: '#CBD5E1' },
          actions: {
            '& .MuiIconButton-root': {
              color: '#64748B',
              '&:hover': { backgroundColor: '#1E2A3A' },
              '&.Mui-disabled': { color: '#334155' },
            },
          },
        },
      },
    },
  });

  const theme = mode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};