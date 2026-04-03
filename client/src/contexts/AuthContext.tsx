import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Função para verificar e renovar token automaticamente
  const checkAndRefreshToken = useCallback(async () => {
    const token = localStorage.getItem('supel_token');
    if (!token) return;

    try {
      // Decodificar o token para verificar tempo de expiração
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      
      // Se o token expira em menos de 1 hora (3600 segundos), renovar
      if (timeUntilExpiry < 3600) {
        console.log('🔄 Token próximo do vencimento, renovando...');
        const response = await api.get('/auth/verify');
        if (response.data.newToken) {
          localStorage.setItem('supel_token', response.data.newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.newToken}`;
          console.log('✅ Token renovado com sucesso');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/renovar token:', error);
    }
  }, []);

  // Verificar token a cada 30 minutos nos painéis
  useEffect(() => {
    if (!user) return;
    
    const currentPath = window.location.pathname;
    const isPainelPage = currentPath.includes('/painel') || currentPath.includes('/dashboard');
    
    if (isPainelPage) {
      // Verificar imediatamente
      checkAndRefreshToken();
      
      // Configurar intervalo para verificação automática
      const interval = setInterval(checkAndRefreshToken, 30 * 60 * 1000); // 30 minutos
      
      return () => clearInterval(interval);
    }
  }, [user, checkAndRefreshToken]);
  useEffect(() => {
    // Prevenir múltiplos sendBeacon
    let beaconSent = false;
    
    const sendLogoutBeacon = (reason: string) => {
      if (beaconSent || !user) return;
      
      beaconSent = true;
      
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const url = `${baseUrl}/auth/logout`;
        const payload = JSON.stringify({ reason });
        
        // Usar APENAS fetch com keepalive pois sendBeacon não suporta cookies/credentials
        fetch(url, {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          credentials: 'include' // Importante: incluir cookies
        }).then(() => {
          console.log(`🚪 Fetch keepalive logout enviado com sucesso (${reason})`);
          
          // IMPORTANTE: Limpar estado local também
          setUser(null);
          localStorage.removeItem('supel_token');
          localStorage.removeItem('supel_user');
          api.defaults.headers.common['Authorization'] = '';
          console.log('🧹 Estado local limpo após logout automático');
          
        }).catch((error) => {
          console.error(`❌ Erro no fetch keepalive logout (${reason}):`, error);
        });
        
      } catch (e) {
        console.error('Erro ao enviar logout via fetch:', e);
      }
    };
    
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Exceção para painel público
      const currentPath = window.location.pathname;
      if (currentPath.includes('/painel-publico')) {
        return;
      }
      
      sendLogoutBeacon('unload');
    };

    const handleVisibilityChange = () => {
      // Desabilitado por enquanto - muito sensível e dispara ao mudar de aba
      // Vamos focar apenas no beforeunload para fechamento real
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
    try {
      // Solicitar logout ao servidor para limpar refresh cookie (apenas se temos token)
      const hasToken = localStorage.getItem('supel_token') || api.defaults.headers.common['Authorization'];
      if (hasToken) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // Ignorar erros ao chamar logout no servidor
    }
    setUser(null);
    localStorage.removeItem('supel_token');
    localStorage.removeItem('supel_user');
    sessionStorage.clear();
    api.defaults.headers.common['Authorization'] = '';
    // Limpar cookies de autenticação acessíveis via JS se existirem
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
    
    // Se não tem token salvo, tentar verificar via refresh cookie no servidor
    if (!savedToken) {
      api.get('/auth/verify').then(response => {
        const serverUser = response.data.user;
        setUser(serverUser);
        localStorage.setItem('supel_user', JSON.stringify(serverUser));
        if (response.data.newToken) {
          localStorage.setItem('supel_token', response.data.newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.newToken}`;
        }
        setLoading(false);
      }).catch(() => {
        // Se verify falhar, apenas limpar estado local (não tentar logout que pode causar loop)
        setUser(null);
        localStorage.removeItem('supel_token');
        localStorage.removeItem('supel_user');
        api.defaults.headers.common['Authorization'] = '';
        setLoading(false);
      });
      return;
    }
    
    try {
      let parsedUser: any = null;
      if (savedUser) {
        parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      
      // Verificar se o usuário tem acoes_permitidas, se não, atualizar do servidor
      // APENAS se temos tanto token quanto usuário válidos
      if (parsedUser && savedToken && (!parsedUser.acoes_permitidas || parsedUser.acoes_permitidas.length === 0)) {
        // console.log('🔄 Usuário sem acoes_permitidas, atualizando do servidor...');
        api.get('/auth/verify').then(response => {
          const updatedUser = response.data.user;
          setUser(updatedUser);
          localStorage.setItem('supel_user', JSON.stringify(updatedUser));
        }).catch(error => {
          // console.error('Erro ao atualizar dados do usuário:', error);
          // Se falhar, limpar estado completamente para evitar loops
          setUser(null);
          localStorage.removeItem('supel_token');
          localStorage.removeItem('supel_user');
          api.defaults.headers.common['Authorization'] = '';
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