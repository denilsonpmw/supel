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