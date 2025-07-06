import React from 'react';
import { Switch, Tooltip } from '@mui/material';
import { useCustomTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { mode, toggleTheme } = useCustomTheme();
  const isDarkMode = mode === 'dark';

  return (
    <Tooltip title={isDarkMode ? 'Modo claro' : 'Modo escuro'}>
      <Switch
        checked={isDarkMode}
        onChange={toggleTheme}
        size="small"
        sx={{
          width: 36,
          height: 20,
          p: 0.5,
          '& .MuiSwitch-switchBase': {
            p: 0.2,
          },
          '& .MuiSwitch-thumb': {
            width: 14,
            height: 14,
          },
          '& .MuiSwitch-track': {
            borderRadius: 10,
            backgroundColor: isDarkMode ? '#1976d2' : '#bdbdbd',
            opacity: 1,
          },
        }}
        inputProps={{ 'aria-label': 'Alternar tema' }}
      />
    </Tooltip>
  );
} 