import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Link,
  Avatar
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { authService } from '../services/api';
import { useCustomTheme } from '../contexts/ThemeContext';

const RequestAccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useCustomTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    justificativa: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setEmailError('');

    if (!validateEmail(formData.email)) {
      setEmailError('Digite um e-mail válido.');
      setLoading(false);
      return;
    }

    try {
      await authService.requestAccess(formData);
      setSuccess('Solicitação enviada com sucesso! Aguarde a aprovação do administrador.');
      setFormData({ email: '', nome: '', justificativa: '' });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email') {
      setEmailError('');
    }
  };

  const validateEmail = (email: string) => {
    // Regex simples para validação de e-mail
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
            maxWidth: 520,
            width: '100%',
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
            <PersonAdd sx={{ fontSize: 32 }} />
          </Avatar>

          <Typography 
            variant="h4" 
            className="gradient-text"
            gutterBottom 
            textAlign="center" 
            fontWeight="bold"
            sx={{ mb: 1 }}
          >
            Solicitar Acesso
          </Typography>

          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(30, 60, 114, 0.8)', 
              fontWeight: 500,
              textAlign: 'center',
              mb: 1 
            }}
          >
            Sistema SUPEL
          </Typography>

          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(30, 60, 114, 0.6)', 
              textAlign: 'center',
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
              label="Nome Completo"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
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
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              error={!!emailError}
              helperText={emailError}
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
              label="Justificativa para Acesso"
              name="justificativa"
              value={formData.justificativa}
              onChange={handleChange}
              multiline
              rows={4}
              placeholder="Descreva sua função e motivos para solicitar acesso ao sistema..."
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
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              className="hover-button"
              disabled={loading}
              sx={{
                mb: 3,
                py: 1.8,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(30, 60, 114, 0.25)',
                border: 'none',
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Enviando Solicitação...
                </>
              ) : (
                'Enviar Solicitação de Acesso'
              )}
            </Button>

            <Box textAlign="center">
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/login')}
                sx={{ 
                  color: '#1e3c72', 
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  borderBottom: '1px solid transparent',
                  transition: 'border-bottom 0.3s ease',
                  '&:hover': {
                    borderBottom: '1px solid #1e3c72',
                  }
                }}
              >
                ← Voltar para o Login
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default RequestAccessPage; 