import React, { useState } from 'react';
import { useNavigate, Link, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  TextField,
  IconButton,
  InputAdornment
} from '@mui/material';
import { LockOutlined, Login, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { useCustomTheme } from '../contexts/ThemeContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useCustomTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      // Fazer login com email/senha
      const response = await authService.emailLogin(formData.email, formData.senha);
      
      if (!response.token) {
        throw new Error('Token não retornado pelo servidor');
      }
      
      // Salvar o e-mail no localStorage em caso de sucesso
      localStorage.setItem('last_login_email', formData.email);

      // Login no contexto com o token
      await login(response.token);
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError(error.response?.data?.error || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
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
          
          .glass-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .gradient-avatar {
            background: ${mode === 'dark' 
              ? 'linear-gradient(135deg, #1e3c72 0%, #5a8cd6 100%)' 
              : 'linear-gradient(135deg, #1e3c72 0%, #5a8cd6 100%)'
            };
          }
          
          .hover-button {
            transition: all 0.3s ease;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          }
          
          .hover-button:hover {
            background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(30, 60, 114, 0.3);
          }
        `}
      </style>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: mode === 'dark' ? 'linear-gradient(135deg, #232526 0%, #414345 100%)' : 'linear-gradient(135deg, #1e3c72 0%, #5a8cd6 100%)',
          p: 2,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Toggle tema no topo */}
        <Box sx={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
          <Button size="small" onClick={toggleTheme} sx={{ textTransform: 'none' }}>
            Alternar tema {mode === 'dark' ? '🌙' : '☀️'}
          </Button>
        </Box>
        
        {/* Elementos decorativos flutuantes */}
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
              borderRadius: '20px',
              background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 100%)',
              transform: 'rotate(45deg)',
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

        {/* Ondas decorativas SVG */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '200px',
            opacity: 0.1,
            pointerEvents: 'none',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,100 C300,200 900,0 1200,100 L1200,200 L0,200 Z"
              fill="rgba(255,255,255,0.3)"
            />
            <path
              d="M0,150 C400,50 800,250 1200,150 L1200,200 L0,200 Z"
              fill="rgba(255,255,255,0.2)"
            />
          </svg>
        </Box>

        <Paper
          elevation={0}
          className="glass-card"
          sx={{
            p: 4,
            borderRadius: 4,
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Avatar
            className="gradient-avatar"
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 3,
              boxShadow: '0 8px 32px rgba(30, 60, 114, 0.3)',
            }}
          >
            <LockOutlined sx={{ fontSize: 32 }} />
          </Avatar>

          <Typography 
            variant="h3" 
            className="gradient-text"
            gutterBottom 
            fontWeight="bold"
            sx={{ mb: 1 }}
          >
            SUPEL
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: mode === 'dark' ? '#e2e8f0' : 'rgba(30, 60, 114, 0.8)', 
              fontWeight: 500,
              mb: 1 
            }}
          >
            Sistema de Controle de Processos
          </Typography>

          <Typography 
            variant="body2" 
            sx={{ 
              color: mode === 'dark' ? '#cbd5e1' : 'rgba(30, 60, 114, 0.6)', 
              mb: 4,
              fontStyle: 'italic'
            }}
          >
            Prefeitura Municipal de Palmas
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                background: mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                backdropFilter: 'blur(10px)',
                border: mode === 'dark' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(244, 67, 54, 0.2)',
                '& .MuiAlert-message': {
                  color: mode === 'dark' ? '#fca5a5' : '#d32f2f'
                }
              }}
            >
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={loading}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: mode === 'dark' ? 'rgba(13, 24, 34, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: mode === 'dark' ? '#e2e8f0' : '#26324d',
                  '& input': {
                    color: mode === 'dark' ? '#e2e8f0' : '#26324d',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: mode === 'dark' ? 'rgba(226, 232, 240, 0.5)' : 'rgba(38,50,77,0.5)',
                  },
                  '&:hover': {
                    background: mode === 'dark' ? 'rgba(13, 24, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  },
                  '&.Mui-focused': {
                    background: mode === 'dark' ? 'rgba(13, 24, 34, 1)' : 'rgba(255, 255, 255, 1)',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: mode === 'dark' ? '#cbd5e1' : 'rgba(30, 60, 114, 0.8)',
                }
              }}
            />

            <TextField
              fullWidth
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={formData.senha}
              onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
              disabled={loading}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  background: mode === 'dark' ? 'rgba(13, 24, 34, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: mode === 'dark' ? '#e2e8f0' : '#26324d',
                  '& input': {
                    color: mode === 'dark' ? '#e2e8f0' : '#26324d',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: mode === 'dark' ? 'rgba(226, 232, 240, 0.5)' : 'rgba(18,24,38,0.5)',
                  },
                  '&:hover': {
                    background: mode === 'dark' ? 'rgba(13, 24, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  },
                  '&.Mui-focused': {
                    background: mode === 'dark' ? 'rgba(13, 24, 34, 1)' : 'rgba(255, 255, 255, 1)',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: mode === 'dark' ? '#cbd5e1' : 'rgba(30, 60, 114, 0.8)',
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEmailLogin();
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{
                        color: mode === 'dark' ? '#cbd5e1' : 'rgba(30, 60, 114, 0.8)',
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              className="hover-button"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Login />}
              onClick={handleEmailLogin}
              disabled={loading}
              sx={{
                py: 1.8,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(30, 60, 114, 0.25)',
                border: 'none',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </Button>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography 
              variant="body2" 
              sx={{ color: mode === 'dark' ? '#cbd5e1' : 'rgba(30, 60, 114, 0.7)' }}
            >
              Não tem acesso?{' '}
              <RouterLink 
                to="/request-access" 
                style={{ 
                  color: mode === 'dark' ? '#60a5fa' : '#1e3c72', 
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  fontSize: 14
                }}
              >
                Solicitar cadastro
              </RouterLink>
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ color: mode === 'dark' ? '#cbd5e1' : 'rgba(30, 60, 114, 0.7)' }}
              >
                Primeiro acesso?{' '}
                <RouterLink
                  to="/primeiro-acesso"
                  style={{
                    color: mode === 'dark' ? '#60a5fa' : '#1e3c72',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    fontSize: 14,
                  }}
                >
                  Defina sua senha
                </RouterLink>
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ color: mode === 'dark' ? '#cbd5e1' : 'rgba(30, 60, 114, 0.7)' }}
              >
                Já tem um token?{' '}
                <RouterLink
                  to="/redefinir-senha"
                  style={{
                    color: mode === 'dark' ? '#60a5fa' : '#1e3c72',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    fontSize: 14,
                  }}
                >
                  Redefina sua senha
                </RouterLink>
              </Typography>
              {/* Link temporário para debug PWA */}
              <Typography 
                variant="body2" 
                sx={{ color: mode === 'dark' ? '#cbd5e1' : 'rgba(30, 60, 114, 0.7)' }}
              >
                Debug PWA:{' '}
                <RouterLink
                  to="/debug/pwa"
                  style={{
                    color: mode === 'dark' ? '#f59e0b' : '#d97706',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    fontSize: 14,
                  }}
                >
                  Diagnóstico Técnico
                </RouterLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default LoginPage; 