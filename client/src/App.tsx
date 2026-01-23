import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { useAuth } from './contexts/AuthContext'
import { ThemeContextProvider } from './contexts/ThemeContext'
import { ConfigContextProvider } from './contexts/ConfigContext'
import { useFullscreen } from './hooks/useFullscreen'
import { usePWA } from './hooks/usePWA'
import { useEffect } from 'react'

// Páginas de autenticação
import LoginPage from './pages/LoginPage'
import RequestAccessPage from './pages/RequestAccessPage'

// Página principal
import DashboardPage from './pages/DashboardPage'

// Página pública
import PainelPublicoPage from './pages/PainelPublicoPage'
import PainelSemanaAtualPage from './pages/PainelSemanaAtualPage'

// Componentes de infraestrutura
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import { UpdateNotification } from './components/UpdateNotification'

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
import AccessTrackingPage from './pages/admin/AccessTrackingPage'
import ArpsPage from './pages/admin/ArpsPage'
import ApiKeysPage from './pages/admin/ApiKeysPage'

// Novas páginas
// import ForgotPasswordPage from './pages/ForgotPasswordPage'
import RedefinirSenhaPage from './pages/RedefinirSenhaPage'
import PWADebugPage from './pages/PWADebugPage'
import ManualPage from './pages/ManualPage'
import ConfiguracoesPage from './pages/admin/ConfiguracoesPage'
import IndicadoresGerenciaisPage from './pages/admin/IndicadoresGerenciaisPage.tsx'

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // console.log('🚀 Iniciando registro do Service Worker');
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // console.log('✅ Service Worker registrado:', registration);
        // console.log('📍 Scope:', registration.scope);
        
        // Debug: Verificar estado do SW
        if (registration.active) {
          // console.log('🟢 SW ativo:', registration.active.scriptURL);
        }
        if (registration.waiting) {
          // console.log('🟡 SW aguardando:', registration.waiting.scriptURL);
        }
        if (registration.installing) {
          // console.log('🔄 SW instalando:', registration.installing.scriptURL);
        }
        
        // Verificar atualizações imediatamente
        registration.update().then(() => {
          // console.log('🔍 Verificação de atualização concluída');
        }).catch(err => {
          // console.log('⚠️ Erro na verificação de atualização:', err);
        });
      })
      .catch((error) => {
        // console.error('❌ Erro ao registrar Service Worker:', error);
      });
  });
}

function App() {
  return (
    <ThemeContextProvider>
      <ConfigContextProvider>
      <AppContent />
      </ConfigContextProvider>
    </ThemeContextProvider>
  )
}

function AppContent() {
  const { user, loading } = useAuth()
  const { isInstalled, isFullscreen } = usePWA()
  useFullscreen() // Hook ativará tela cheia automaticamente se for PWA

  // Verificação adicional para forçar reload quando service worker mudar
  // DESABILITADO: useServiceWorkerUpdate já gerencia isso
  // useEffect(() => {
  //   if ('serviceWorker' in navigator) {
  //     navigator.serviceWorker.addEventListener('controllerchange', () => {
  //       // console.log('🔄 Service worker controller mudou - aguardando 10s antes de recarregar');
  //       // Aguardar 10 segundos para permitir que a notificação seja exibida
  //       setTimeout(() => {
  //         window.location.reload();
  //       }, 10000);
  //     });
  //   }
  // }, []);

  // Forçar fullscreen em PWA (migrado do index.html)
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: fullscreen)').matches) {
      // REMOVER position: fixed do body para permitir dropdowns funcionarem
      // O CSS do PWA já cuida do comportamento adequado
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.height = '';
      // Remover overflow: hidden para permitir scroll
    }
  }, []);

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
        
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />

        {/* Página de solicitação de cadastro (pública) */}
        <Route 
          path="/solicitar-acesso" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <RequestAccessPage />
          } 
        />

        <Route 
          path="/esqueci-senha" 
          element={<RedefinirSenhaPage />} 
        />

        {/* Página de Debug PWA (pública para diagnóstico) */}
        <Route 
          path="/debug/pwa" 
          element={<PWADebugPage />} 
        />

        {/* Rotas privadas */}
        <Route 
          path="/painel-publico" 
          element={
            <PrivateRoute>
              <PainelPublicoPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/painel-semana-atual" 
          element={
            <PrivateRoute>
              <PainelSemanaAtualPage />
            </PrivateRoute>
          } 
        />

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
          path="/admin/indicadores-gerenciais" 
          element={
            <PrivateRoute>
              <Layout>
                <IndicadoresGerenciaisPage />
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

        <Route 
          path="/admin/access-tracking" 
          element={
            <PrivateRoute>
              <Layout>
                <AccessTrackingPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/configuracoes" 
          element={
            <PrivateRoute>
              <Layout>
                <ConfiguracoesPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/arps" 
          element={
            <PrivateRoute>
              <Layout>
                <ArpsPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        <Route 
          path="/admin/api-keys" 
          element={
            <PrivateRoute>
              <Layout>
                <ApiKeysPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Rota do Manual */}
        <Route 
          path="/manual" 
          element={
            <PrivateRoute>
              <Layout>
                <ManualPage />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Rota padrão */}
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />

        {/* Rota 404 */}
        <Route 
          path="*" 
          element={
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
              <Typography variant="h5">404 - Página não encontrada</Typography>
            </Box>
          } 
        />
      </Routes>
      
      {/* Componente de notificação de atualização do PWA */}
      <UpdateNotification />
    </>
  )
}

export default App 