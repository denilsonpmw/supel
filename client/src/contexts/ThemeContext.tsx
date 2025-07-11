import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Cores modernas e minimalistas para ambos os temas
export const MODERN_COLORS = {
  light: [
    '#3B82F6', // Blue-500
    '#10B981', // Emerald-500
    '#F59E0B', // Amber-500
    '#EF4444', // Red-500
    '#8B5CF6', // Violet-500
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
  // Verificar preferência salva ou detectar preferência do sistema
  const getInitialTheme = (): ThemeMode => {
    const savedTheme = localStorage.getItem('supel_theme') as ThemeMode;
    if (savedTheme) {
      return savedTheme;
    }
    // Detectar preferência do sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [mode, setMode] = useState<ThemeMode>(getInitialTheme);

  // Salvar preferência no localStorage e atualizar theme-color
  useEffect(() => {
    localStorage.setItem('supel_theme', mode);
    
    // Atualizar meta tag theme-color baseada no tema
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const themeColor = mode === 'dark' ? '#12171C' : '#ffffff';
      metaThemeColor.setAttribute('content', themeColor);
    }
    
    // Atualizar meta tag apple-mobile-web-app-status-bar-style
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (metaStatusBar) {
      const statusBarStyle = mode === 'dark' ? 'black-translucent' : 'default';
      metaStatusBar.setAttribute('content', statusBarStyle);
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  // Tema Light - Paleta moderna e elegante inspirada em Tailwind CSS
  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#0061C2', // Azul principal
        light: '#3384D6',
        dark: '#004A96',
      },
      secondary: {
        main: '#7c3aed', // Violet-600
        light: '#ede9fe', // Violet-50
        dark: '#6d28d9', // Violet-700
      },
      background: {
        default: '#f8f9fa', // Cinza muito claro
        paper: '#ffffff',
      },
      text: {
        primary: '#1a1a1a', // Preto suave
        secondary: '#6c757d', // Cinza médio
      },
      success: {
        main: '#10b981', // Emerald-500
        light: '#d1fae5', // Emerald-50
        dark: '#059669', // Emerald-600
      },
      warning: {
        main: '#f59e0b', // Amber-500
        light: '#fef3c7', // Amber-50
        dark: '#d97706', // Amber-600
      },
      error: {
        main: '#ef4444', // Red-500
        light: '#fef2f2', // Red-50
        dark: '#dc2626', // Red-600
      },
      info: {
        main: '#06b6d4', // Cyan-500
        light: '#ecfeff', // Cyan-50
        dark: '#0891b2', // Cyan-600
      },
      divider: '#e9ecef', // Cinza claro
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
        color: '#1a1a1a',
      },
      h6: {
        fontWeight: 600,
        color: '#1a1a1a',
      },
      body1: {
        color: '#495057',
      },
      body2: {
        color: '#6c757d',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#000000',
            color: '#ffffff',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderRadius: 12,
            border: '1px solid #e9ecef',
            backgroundColor: '#ffffff',
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
            '&:hover': {
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
          },
          containedPrimary: {
            backgroundColor: '#0061C2',
            '&:hover': {
              backgroundColor: '#004A96',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            fontSize: '0.875rem',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#fff',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
  });

  // Tema Dark - Paleta moderna e elegante
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#0061C2', // Azul dos botões
        light: '#3384D6',
        dark: '#004A96',
      },
      secondary: {
        main: '#8b5cf6', // Violet-500
        light: '#a78bfa', // Violet-400
        dark: '#7c3aed', // Violet-600
      },
      background: {
        default: '#0F1214', // Fundo principal
        paper: '#12171C', // Fundo dos cards
      },
      text: {
        primary: '#f8fafc', // Slate-50
        secondary: '#94a3b8', // Slate-400
      },
      success: {
        main: '#10b981', // Emerald-500
        light: '#34d399', // Emerald-400
        dark: '#059669', // Emerald-600
      },
      warning: {
        main: '#f59e0b', // Amber-500
        light: '#fbbf24', // Amber-400
        dark: '#d97706', // Amber-600
      },
      error: {
        main: '#ef4444', // Red-500
        light: '#f87171', // Red-400
        dark: '#dc2626', // Red-600
      },
      info: {
        main: '#06b6d4', // Cyan-500
        light: '#22d3ee', // Cyan-400
        dark: '#0891b2', // Cyan-600
      },
      divider: '#1E2328', // Divisor
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
        color: '#f8fafc', // Slate-50
      },
      h6: {
        fontWeight: 600,
        color: '#f1f5f9', // Slate-100
      },
      body1: {
        color: '#e2e8f0', // Slate-200
      },
      body2: {
        color: '#cbd5e1', // Slate-300
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#000000',
            color: '#ffffff',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: '#12171C', // Fundo dos cards
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)',
            borderRadius: 12,
            border: '1px solid #1E2328',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: '#12171C',
            color: '#f8fafc',
            borderColor: '#1E2328',
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
            '&:hover': {
              boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.3)',
            },
          },
          containedPrimary: {
            backgroundColor: '#0061C2',
            '&:hover': {
              backgroundColor: '#004A96',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundColor: '#1E2328',
            color: '#f8fafc',
            fontWeight: 500,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            backgroundColor: '#12171C',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: '#1E2328',
            color: '#f8fafc',
          },
          head: {
            backgroundColor: '#0D1822',
            color: '#f8fafc',
            fontWeight: 600,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: '#12171C',
            color: '#f8fafc',
            borderRadius: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#0D1822',
              color: '#f8fafc',
              borderRadius: 8,
              '& fieldset': {
                borderColor: '#1E2328',
              },
              '&:hover fieldset': {
                borderColor: '#334155',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#0061C2',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#94a3b8',
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: '#0D1822',
            color: '#f8fafc',
            borderRadius: 8,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            backgroundColor: '#12171C',
            color: '#f8fafc',
            '&:hover': {
              backgroundColor: '#1E2328',
            },
            '&.Mui-selected': {
              backgroundColor: '#1E2328',
              '&:hover': {
                backgroundColor: '#252B33',
              },
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: '#1E2328',
            color: '#f8fafc',
            fontSize: '0.875rem',
            border: '1px solid #252B33',
          },
          arrow: {
            color: '#1E2328',
            '&::before': {
              border: '1px solid #252B33',
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#121212',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          },
        },
      },
    },
  });

  // Selecionar tema atual
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