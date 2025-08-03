import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  TextField,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  useTheme,
  Snackbar
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Lock } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { useCustomTheme } from '../contexts/ThemeContext';
import AuthFormContainer from '../components/AuthFormContainer';
import { getAuthInputStyles, getAuthButtonStyles } from '../styles/authStyles';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useCustomTheme();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('last_login_email'));
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [formData, setFormData] = useState({
    email: localStorage.getItem('last_login_email') || '',
    senha: ''
  });

  const handleEmailLogin = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.email || !formData.senha) {
        setError('Email e senha são obrigatórios');
        return;
      }

      // Fazer login com email/senha (incluindo flag de primeiro acesso)
      const response = await authService.emailLogin(formData.email, formData.senha, primeiroAcesso);
      
      if (!response.token) {
        throw new Error('Token não retornado pelo servidor');
      }
      
      // Salvar o e-mail no localStorage se lembrar login estiver marcado
      if (rememberMe) {
        localStorage.setItem('last_login_email', formData.email);
      } else {
        localStorage.removeItem('last_login_email');
      }

      // Fazer login
      await login(response.token);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Mensagens amigáveis para o usuário
      let userMessage = 'Erro ao fazer login. Verifique suas credenciais e tente novamente.';
      
      // Se for primeiro acesso, mensagem específica
      if (primeiroAcesso) {
        userMessage = 'Não foi possível definir a senha. Verifique se este é realmente seu primeiro acesso.';
      }
      
      // Para erros específicos conhecidos, usar mensagens mais amigáveis
      const errorMessage = error.response?.data?.error || error.message || '';
      if (errorMessage.includes('não encontrado') || errorMessage.includes('não existe')) {
        userMessage = 'Usuário não encontrado. Verifique o email digitado.';
      } else if (errorMessage.includes('senha') && !primeiroAcesso) {
        userMessage = 'Email ou senha incorretos. Tente novamente.';
      } else if (errorMessage.includes('inativo')) {
        userMessage = 'Sua conta está inativa. Entre em contato com o administrador.';
      } else if (errorMessage.includes('possui senha definida')) {
        userMessage = 'Você já possui uma senha. Use o login normal.';
      }
      
      setSnackbarMessage(userMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !loading && formData.email && formData.senha) {
      handleEmailLogin();
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
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

        {/* Novo formulário de login */}
        <AuthFormContainer title="LOGIN" subtitle="Acesse sua conta">
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              onKeyPress={handleKeyPress}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }} />
                  </InputAdornment>
                ),
              }}
              sx={getAuthInputStyles(theme)}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Senha"
              type={showPassword ? 'text' : 'password'}
              value={formData.senha}
              onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                    '&.Mui-checked': {
                      color: '#3b82f6',
                    },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontFamily: 'Open Sans, sans-serif',
                    fontSize: '0.9rem',
                    color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                  }}
                >
                  Lembrar
                </Typography>
              }
            />
            
            <Typography
              component={RouterLink}
              to="/esqueci-senha"
              sx={{
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '0.9rem',
                color: '#3b82f6',
                textDecoration: 'none',
                fontStyle: 'italic',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Esqueceu a senha?
            </Typography>
          </Box>

          <Button
            fullWidth
            onClick={handleEmailLogin}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} sx={{ color: 'inherit' }} />}
            sx={getAuthButtonStyles(theme, 'primary')}
          >
            {loading ? 'Entrando...' : 'LOGIN'}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '0.9rem',
                color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
              }}
            >
              Precisa de acesso?{' '}
              <Typography
                component={RouterLink}
                to="/solicitar-acesso"
                sx={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Solicitar aqui
              </Typography>
            </Typography>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={primeiroAcesso}
                    onChange={(e) => setPrimeiroAcesso(e.target.checked)}
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                      '&.Mui-checked': {
                        color: '#10b981',
                      },
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontFamily: 'Open Sans, sans-serif',
                      fontSize: '0.9rem',
                      color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                    }}
                  >
                    Primeiro acesso (definir senha)
                  </Typography>
                }
              />
            </Box>
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

export default LoginPage;
