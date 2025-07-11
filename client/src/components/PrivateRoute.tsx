import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Função para extrair a permissão necessária da rota
  const getRequiredPermission = (pathname: string): string | null => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname.startsWith('/admin/')) {
      const permission = pathname.split('/admin/')[1];
      return permission;
    }
    return null;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <CircularProgress color="inherit" size={48} sx={{ mb: 2 }} />
        <Typography variant="h6">
          🔄 Verificando autenticação...
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading: {loading}, User: {user ? 'Sim' : 'Não'}
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permissões de acesso à página
  const requiredPermission = getRequiredPermission(location.pathname);

  if (requiredPermission) {
    // Admins têm acesso a tudo
    if (user.perfil === 'admin') {
      return <>{children}</>;
    }

    // Páginas que são exclusivas para admins
    const adminOnlyPages = ['configuracoes', 'usuarios'];
    
    if (adminOnlyPages.includes(requiredPermission)) {
      return (
        <Box p={3}>
          <Alert severity="error" variant="filled">
            <Typography variant="h6" gutterBottom>
              🚫 Acesso Restrito
            </Typography>
            <Typography>
              Esta página é exclusiva para administradores.
            </Typography>
          </Alert>
        </Box>
      );
    }

    // Verificar se o usuário tem permissão para acessar a página
    const hasPermission = user.paginas_permitidas?.includes(requiredPermission);

    if (!hasPermission) {
      return (
        <Box p={3}>
          <Alert severity="error" variant="filled">
            <Typography variant="h6" gutterBottom>
              🚫 Acesso Negado
            </Typography>
            <Typography>
              Você não tem permissão para acessar esta página.
            </Typography>
          </Alert>
        </Box>
      );
    }
  }

  return <>{children}</>;
};

export default PrivateRoute; 