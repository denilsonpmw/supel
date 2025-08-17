import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

interface PageVisit {
  visitId?: string;
  path: string;
  enterTime: number;
}

// Hook para tracking de navegação de páginas
export const usePageTracking = () => {
  const location = useLocation();
  const currentVisit = useRef<PageVisit | null>(null);
  const isTracking = useRef(false);

  // Função para registrar entrada em página
  const trackPageEnter = async (path: string) => {
    if (isTracking.current) return;
    
    try {
      isTracking.current = true;
      const response = await api.post('/access-tracking/page-enter', { path });
      
      currentVisit.current = {
        visitId: response.data.visitId,
        path,
        enterTime: Date.now()
      };
      
      // console.log(`📄 Page enter tracked: ${path} (ID: ${response.data.visitId})`);
    } catch (error) {
      console.error('Error tracking page enter:', error);
    } finally {
      isTracking.current = false;
    }
  };

  // Função para registrar saída de página
  const trackPageExit = async () => {
    if (!currentVisit.current?.visitId || isTracking.current) return;
    
    try {
      isTracking.current = true;
      await api.post('/access-tracking/page-exit', { 
        visitId: currentVisit.current.visitId 
      });
      
      const duration = Date.now() - currentVisit.current.enterTime;
      // console.log(`📤 Page exit tracked: ${currentVisit.current.path} (Duration: ${Math.round(duration/1000)}s)`);
      
      currentVisit.current = null;
    } catch (error) {
      console.error('Error tracking page exit:', error);
    } finally {
      isTracking.current = false;
    }
  };

  // Hook effect para rastrear mudanças de rota
  useEffect(() => {
    // Registrar saída da página anterior (se houver)
    if (currentVisit.current) {
      trackPageExit();
    }

    // Aguardar um pouco antes de registrar nova página para evitar conflitos
    const timer = setTimeout(() => {
      trackPageEnter(location.pathname);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname]);

  // Registrar saída quando o componente for desmontado ou página fechada
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentVisit.current?.visitId) {
        // Usar sendBeacon para garantir que a requisição seja enviada mesmo ao fechar
        navigator.sendBeacon(
          '/api/access-tracking/page-exit',
          JSON.stringify({ visitId: currentVisit.current.visitId })
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentVisit.current?.visitId) {
        trackPageExit();
      } else if (document.visibilityState === 'visible' && !currentVisit.current) {
        trackPageEnter(location.pathname);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Registrar saída ao desmontar o hook
      if (currentVisit.current) {
        trackPageExit();
      }
    };
  }, []);

  return {
    currentVisit: currentVisit.current,
    trackPageEnter,
    trackPageExit
  };
};
