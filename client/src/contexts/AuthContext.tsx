import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  nome: string;
  perfil: string;
  paginas_permitidas?: string[];
  acoes_permitidas?: string[];
  ativo: boolean;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  clearCache: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Logout automático ao fechar aplicativo/aba
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Verificar se está na página painel-publico (não aplicar logout automático)
      const currentPath = window.location.pathname;
      if (currentPath.includes('/painel-publico')) {
        return;
      }
      
      // Só salva se for um fechamento real (não refresh)
      if (!event.defaultPrevented) {
        sessionStorage.setItem('app_closing_time', Date.now().toString());
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Verificar se está na página painel-publico (não aplicar logout automático)
        const currentPath = window.location.pathname;
        if (currentPath.includes('/painel-publico')) {
          return;
        }
        
        // Quando a aba fica oculta, aguardar um tempo antes de considerar fechamento
        const timeoutId = setTimeout(() => {
          // Se ainda estiver oculto após 30 minutos, considerar fechamento
          if (document.visibilityState === 'hidden' && user) {
            sessionStorage.setItem('should_logout', 'true');
          }
        }, 1800000); // 30 minutos (1800000 ms)
        
        // Salvar o timeout ID para cancelar se necessário
        sessionStorage.setItem('logout_timeout', timeoutId.toString());
      } else if (document.visibilityState === 'visible') {
        // Cancelar o timeout se voltar a ficar visível
        const timeoutId = sessionStorage.getItem('logout_timeout');
        if (timeoutId) {
          clearTimeout(parseInt(timeoutId));
          sessionStorage.removeItem('logout_timeout');
        }
        
        // Verificar se deve fazer logout ao voltar
        const shouldLogout = sessionStorage.getItem('should_logout');
        if (shouldLogout === 'true') {
          sessionStorage.removeItem('should_logout');
          logout();
        }
        
        // Limpar timestamps
        sessionStorage.removeItem('app_closing_time');
      }
    };

    // Verificar ao carregar se deve fazer logout
    const checkLogoutOnLoad = () => {
      const shouldLogout = sessionStorage.getItem('should_logout');
      if (shouldLogout === 'true') {
        sessionStorage.removeItem('should_logout');
        logout();
      }
    };

    // Verificar logout pendente ao carregar
    checkLogoutOnLoad();

    // Adicionar listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Limpar timeout se existir
      const timeoutId = sessionStorage.getItem('logout_timeout');
      if (timeoutId) {
        clearTimeout(parseInt(timeoutId));
        sessionStorage.removeItem('logout_timeout');
      }
    };
  }, [user]);


  // Função para limpar completamente o cache e sessão
  const clearCache = () => {
    setUser(null);
    localStorage.removeItem('supel_token');
    localStorage.removeItem('supel_user');
    sessionStorage.clear();
    api.defaults.headers.common['Authorization'] = '';
    // Limpar cookies de autenticação se existirem
    document.cookie.split(';').forEach((c) => {
      if (c.trim().startsWith('supel_token') || c.trim().startsWith('token')) {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
      }
    });
    // Redirecionar para login em vez de reload para evitar loops
    window.location.href = '/login';
  };

  // Função para fazer logout
  const logout = async () => {
    // Track logout antes de limpar dados
    if (user) {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('supel_token')}`
          },
          body: JSON.stringify({
            userId: user.id,
            sessionId: sessionStorage.getItem('analytics_session_id') || `session_${Date.now()}`,
            eventType: 'logout',
            eventCategory: 'authentication',
            eventAction: 'logout',
            eventLabel: 'user_logout',
            pageUrl: window.location.href,
            metadata: {
              userProfile: user.perfil,
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (analyticsError) {
        console.warn('Erro ao rastrear logout:', analyticsError);
      }
    }
    
    setUser(null);
    localStorage.removeItem('supel_token');
    localStorage.removeItem('supel_user');
    sessionStorage.clear();
    api.defaults.headers.common['Authorization'] = '';
    // Limpar cookies de autenticação se existirem
    document.cookie.split(';').forEach((c) => {
      if (c.trim().startsWith('supel_token') || c.trim().startsWith('token')) {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
      }
    });
  };

  // Função para fazer login
  const login = async (token: string) => {
    try {
      localStorage.setItem('supel_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/auth/verify');
      setUser(response.data.user);
      localStorage.setItem('supel_user', JSON.stringify(response.data.user));
      
      // Track login success
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: response.data.user.id,
            sessionId: sessionStorage.getItem('analytics_session_id') || `session_${Date.now()}`,
            eventType: 'login',
            eventCategory: 'authentication',
            eventAction: 'login_success',
            eventLabel: 'email_login',
            pageUrl: window.location.href,
            metadata: {
              userProfile: response.data.user.perfil,
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (analyticsError) {
        console.warn('Erro ao rastrear login:', analyticsError);
      }
    } catch (error) {
      // console.error('Erro ao fazer login:', error);
      await logout();
      throw error;
    }
  };

  // Função para verificar se está autenticado
  const isAuthenticated = () => {
    return !!user;
  };

  // Efeito para restaurar usuário do localStorage ao iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('supel_user');
    const savedToken = localStorage.getItem('supel_token');
    
    // Se não tem dados salvos, apenas limpar estado local
    if (!savedUser || !savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    try {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      
      // Verificar se o usuário tem acoes_permitidas, se não, atualizar do servidor
      if (!userData.acoes_permitidas || userData.acoes_permitidas.length === 0) {
        // console.log('🔄 Usuário sem acoes_permitidas, atualizando do servidor...');
        api.get('/auth/verify').then(response => {
          const updatedUser = response.data.user;
          setUser(updatedUser);
          localStorage.setItem('supel_user', JSON.stringify(updatedUser));
        }).catch(error => {
          // console.error('Erro ao atualizar dados do usuário:', error);
        });
      }
    } catch (error) {
      // console.error('Erro ao carregar dados do usuário:', error);
      setUser(null);
      localStorage.removeItem('supel_token');
      localStorage.removeItem('supel_user');
      api.defaults.headers.common['Authorization'] = '';
    }
    
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated, clearCache }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext; 