import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { useAuth } from './contexts/AuthContext'
import { ThemeContextProvider } from './contexts/ThemeContext'
import { useFullscreen } from './hooks/useFullscreen'
import { usePWA } from './hooks/usePWA'

// Páginas de autenticação
import LoginPage from './pages/LoginPage'
import RequestAccessPage from './pages/RequestAccessPage'

// Página principal
import DashboardPage from './pages/DashboardPage'

// Página pública
import PainelPublicoPage from './pages/PainelPublicoPage'

// Componentes de infraestrutura
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'

// Páginas admin
import ModalidadesPage from './pages/admin/ModalidadesPage'
import ProcessosPage from './pages/admin/ProcessosPage'
import ResponsaveisPage from './pages/admin/ResponsaveisPage'
import SituacoesPage from './pages/admin/SituacoesPage'
import EquipeApoioPage from './pages/admin/EquipeApoioPage'
import UnidadesGestorasPage from './pages/admin/UnidadesGestorasPage'
import RelatoriosPage from './pages/admin/RelatoriosPage'
import UsuariosPage from './pages/admin/UsuariosPage'
import ContadorResponsaveisPage from './pages/admin/ContadorResponsaveisPage'
import AuditoriaPage from './pages/admin/AuditoriaPage'

// Novas páginas
import PrimeiroAcessoPage from './pages/PrimeiroAcessoPage'
// import ForgotPasswordPage from './pages/ForgotPasswordPage'
import RedefinirSenhaPage from './pages/RedefinirSenhaPage'

function App() {
  return (
    <ThemeContextProvider>
      <AppContent />
    </ThemeContextProvider>
  )
}

function AppContent() {
  const { user, loading } = useAuth()
  useFullscreen() // Hook ativará tela cheia automaticamente se for PWA

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Typography variant="h5">🔄 Carregando SUPEL...</Typography>
      </Box>
    )
  }

  return (
    <>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/painel-publico" element={<PainelPublicoPage />} />
        
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />

        {/* Página de solicitação de cadastro (pública) */}
        <Route 
          path="/request-access" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <RequestAccessPage />
          } 
        />

        <Route 
          path="/primeiro-acesso" 
          element={<PrimeiroAcessoPage />} 
        />

        <Route 
          path="/redefinir-senha" 
          element={<RedefinirSenhaPage />} 
        />

        {/* Rotas privadas */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Rotas Administrativas */}
        <Route 
          path="/admin/modalidades" 
          element={
            <PrivateRoute>
              <Layout>
                <ModalidadesPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/processos" 
          element={
            <PrivateRoute>
              <Layout>
                <ProcessosPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/responsaveis" 
          element={
            <PrivateRoute>
              <Layout>
                <ResponsaveisPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/situacoes" 
          element={
            <PrivateRoute>
              <Layout>
                <SituacoesPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/equipe-apoio" 
          element={
            <PrivateRoute>
              <Layout>
                <EquipeApoioPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/unidades-gestoras" 
          element={
            <PrivateRoute>
              <Layout>
                <UnidadesGestorasPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/relatorios" 
          element={
            <PrivateRoute>
              <Layout>
                <RelatoriosPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/usuarios" 
          element={
            <PrivateRoute>
              <Layout>
                <UsuariosPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/contador-responsaveis" 
          element={
            <PrivateRoute>
              <Layout>
                <ContadorResponsaveisPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/auditoria" 
          element={
            <PrivateRoute>
              <Layout>
                <AuditoriaPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Página inicial - redireciona */}
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } 
        />

        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App 