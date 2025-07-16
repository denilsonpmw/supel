import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress, Avatar, IconButton, InputAdornment } from '@mui/material';
import { LockReset, LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomTheme } from '../contexts/ThemeContext';
import { authService } from '../services/api';

const RedefinirSenhaPage: React.FC = () => {
  const { mode, toggleTheme } = useCustomTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ 
    token: '', 
    novaSenha: '', 
    confirmarSenha: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setError('Token de redefinição é obrigatório.');
      return;
    }
    
    if (!formData.novaSenha || formData.novaSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    if (formData.novaSenha !== formData.confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    
    setLoading(true);
    
    try {
      await authService.redefinirSenha(formData.token, formData.novaSenha);
      setSuccess('Senha redefinida com sucesso! Redirecionando para o login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao redefinir senha.');
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
              ? 'linear-gradient(135deg, #ff5d14 0%, #ff7a3d 100%)' 
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
              color: 'rgba(30, 60, 114, 0.8)', 
              fontWeight: 500,
              mb: 1 
            }}
          >
            Sistema de Controle de Processos
          </Typography>

          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(30, 60, 114, 0.6)', 
              mb: 4,
              fontStyle: 'italic'
            }}
          >
            Prefeitura Municipal de Palmas
          </Typography>

          <Typography 
            variant="h5" 
            sx={{ 
              color: 'rgba(30, 60, 114, 0.9)', 
              fontWeight: 600,
              mb: 1 
            }}
          >
            Redefinir Senha
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(30, 60, 114, 0.7)', 
              mb: 3 
            }}
          >
            Digite o token recebido e sua nova senha
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                background: 'rgba(244, 67, 54, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(244, 67, 54, 0.2)',
                '& .MuiAlert-message': {
                  color: '#d32f2f'
                }
              }}
            >
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                background: 'rgba(76, 175, 80, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                '& .MuiAlert-message': {
                  color: '#2e7d32'
                }
              }}
            >
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Token de Redefinição"
              name="token"
              value={formData.token}
              onChange={handleChange}
              disabled={loading}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: '#26324d',
                  '& input': {
                    color: '#26324d',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(38,50,77,0.5)',
                  },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                  }
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Nova Senha"
              name="novaSenha"
              type={showPassword ? 'text' : 'password'}
              value={formData.novaSenha}
              onChange={handleChange}
              disabled={loading}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: '#26324d',
                  '& input': {
                    color: '#26324d',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(38,50,77,0.5)',
                  },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                  }
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Confirmar Nova Senha"
              name="confirmarSenha"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmarSenha}
              onChange={handleChange}
              disabled={loading}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: '#26324d',
                  '& input': {
                    color: '#26324d',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(38,50,77,0.5)',
                  },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                  }
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
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
              type="submit"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockReset />}
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
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </form>

          <Box sx={{ mt: 3 }}>
            <RouterLink
              to="/login"
              style={{
                color: '#1e3c72',
                fontWeight: 'bold',
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              Voltar para o Login
            </RouterLink>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default RedefinirSenhaPage; 