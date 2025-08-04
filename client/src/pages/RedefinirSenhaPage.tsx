import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  useTheme,
  Snackbar
} from '@mui/material';
import { LockReset, Lock, LockOpen, Visibility, VisibilityOff, VpnKey } from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomTheme } from '../contexts/ThemeContext';
import { authService } from '../services/api';
import AuthFormContainer from '../components/AuthFormContainer';
import { getAuthInputStyles, getAuthButtonStyles } from '../styles/authStyles';

const RedefinirSenhaPage: React.FC = () => {
  const { mode, toggleTheme } = useCustomTheme();
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ 
    token: '', 
    novaSenha: '', 
    confirmarSenha: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    // Pegar token da URL se existir
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setFormData(prev => ({ ...prev, token: tokenFromUrl }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.token) {
      setSnackbarMessage('Token de redefinição é obrigatório.');
      setSnackbarOpen(true);
      return;
    }
    
    if (!formData.novaSenha || formData.novaSenha.length < 6) {
      setSnackbarMessage('A senha deve ter pelo menos 6 caracteres.');
      setSnackbarOpen(true);
      return;
    }
    
    if (formData.novaSenha !== formData.confirmarSenha) {
      setSnackbarMessage('As senhas não coincidem.');
      setSnackbarOpen(true);
      return;
    }
    
    setLoading(true);
    try {
      await authService.redefinirSenha(formData.token, formData.novaSenha);
      setSuccess('Senha redefinida com sucesso! Redirecionando para o login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setSnackbarMessage(err.response?.data?.error || 'Erro ao redefinir senha. Verifique se o token é válido.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !loading && formData.token && formData.novaSenha && formData.confirmarSenha) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <>
      {/* Manter background atual */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700;800&display=swap');
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          
          @keyframes floatReverse {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(20px) rotate(-180deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
          }
          
          .floating-element {
            position: absolute;
            opacity: 0.1;
            pointer-events: none;
          }
          
          .floating-1 {
            top: 10%;
            left: 10%;
            animation: float 6s ease-in-out infinite;
          }
          
          .floating-2 {
            top: 20%;
            right: 15%;
            animation: floatReverse 8s ease-in-out infinite;
          }
          
          .floating-3 {
            bottom: 20%;
            left: 20%;
            animation: float 10s ease-in-out infinite;
          }
          
          .floating-4 {
            bottom: 30%;
            right: 10%;
            animation: floatReverse 7s ease-in-out infinite;
          }
          
          .floating-5 {
            top: 50%;
            left: 5%;
            animation: pulse 4s ease-in-out infinite;
          }
          
          .floating-6 {
            top: 60%;
            right: 5%;
            animation: pulse 5s ease-in-out infinite;
          }
        `}
      </style>

      {/* Background com elementos flutuantes */}
      <Box
        sx={{
          minHeight: '100vh',
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #0c1b2e 0%, #1e3c72 50%, #2a5298 100%)'
            : 'linear-gradient(135deg, #0c1b2e 0%, #1e3c72 50%, #2a5298 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Toggle do tema */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 20,
          }}
        >
          <Button
            onClick={toggleTheme}
            sx={{
              minWidth: 50,
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              border: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.3)',
              color: mode === 'dark' ? '#f1f5f9' : '#1e293b',
              fontSize: '1.5rem',
              '&:hover': {
                background: mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </Button>
        </Box>

        {/* Elementos flutuantes do background atual */}
        <Box className="floating-element floating-1">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 100%)',
            }}
          />
        </Box>
        
        <Box className="floating-element floating-2">
          <Box
            sx={{
              width: 60,
              height: 60,
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
              background: 'linear-gradient(45deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.35) 100%)',
            }}
          />
        </Box>
        
        <Box className="floating-element floating-3">
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '30px',
              background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.15) 100%)',
            }}
          />
        </Box>
        
        <Box className="floating-element floating-4">
          <Box
            sx={{
              width: 70,
              height: 70,
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.25) 100%)',
            }}
          />
        </Box>
        
        <Box className="floating-element floating-5">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
            }}
          />
        </Box>
        
        <Box className="floating-element floating-6">
          <Box
            sx={{
              width: 50,
              height: 50,
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              background: 'rgba(255,255,255,0.15)',
            }}
          />
        </Box>

        {/* Novo formulário de redefinir senha */}
        <AuthFormContainer title="REDEFINIR SENHA" subtitle="Solicite o token de redefinição">
          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                fontFamily: 'Open Sans, sans-serif',
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(220, 252, 231, 0.8)',
                color: theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a',
                border: `1px solid ${theme.palette.mode === 'dark' 
                  ? 'rgba(34, 197, 94, 0.2)' 
                  : 'rgba(34, 197, 94, 0.3)'}`,
                '& .MuiAlert-icon': {
                  color: theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a',
                },
              }}
            >
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                name="token"
                placeholder="Token de Redefinição"
                value={formData.token}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKey sx={{ color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }} />
                    </InputAdornment>
                  ),
                }}
                sx={getAuthInputStyles(theme)}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                name="novaSenha"
                placeholder="Nova Senha"
                type={showPassword ? 'text' : 'password'}
                value={formData.novaSenha}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={getAuthInputStyles(theme)}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                name="confirmarSenha"
                placeholder="Confirmar Nova Senha"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmarSenha}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOpen sx={{ color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={getAuthInputStyles(theme)}
              />
            </Box>

            <Button
              fullWidth
              type="submit"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} sx={{ color: 'inherit' }} />}
              sx={getAuthButtonStyles(theme, 'primary')}
            >
              {loading ? 'Redefinindo senha...' : 'Redefinir Senha'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '0.9rem',
                color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
              }}
            >
              Lembrou da senha?{' '}
              <Typography
                component={RouterLink}
                to="/login"
                sx={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Voltar ao login
              </Typography>
            </Typography>
          </Box>
        </AuthFormContainer>

        {/* Snackbar para mensagens de erro */}
        <Snackbar
          open={snackbarOpen}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            '& .MuiSnackbarContent-root': {
              backgroundColor: theme.palette.mode === 'dark' ? '#dc2626' : '#ef4444',
              color: 'white',
              fontFamily: 'Open Sans, sans-serif',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }
          }}
          message={snackbarMessage}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setSnackbarOpen(false)}
              sx={{ 
                padding: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              ✕
            </IconButton>
          }
        />
      </Box>
    </>
  );
};

export default RedefinirSenhaPage;
