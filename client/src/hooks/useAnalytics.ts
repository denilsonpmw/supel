import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface EventData {
  eventType?: string;
  eventCategory: string;
  eventAction: string;
  eventLabel: string;
  eventData?: Record<string, any>;
  pageLoadTime?: number;
}

interface SearchData {
  query: string;
  context: string;
  resultsCount: number;
  searchTime?: number;
  clickedResultPosition?: number;
  noResults?: boolean;
}

interface ReportData {
  type: string;
  format: string;
  filters?: Record<string, any>;
  recordsCount: number;
  generationTime?: number;
  fileSize?: number;
}

interface ErrorInfo {
  message?: string;
  stack?: string;
  component?: string;
}

// Hook personalizado para tracking de analytics
export const useAnalytics = () => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string>(getOrCreateSessionId());
  const pageStartTimeRef = useRef<number>(Date.now());
  const lastEventTimeRef = useRef<number>(Date.now());

  // Gerar ou recuperar session ID
  function getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Função principal para enviar eventos
  const trackEvent = useCallback(async (eventData: EventData) => {
    try {
      const payload = {
        userId: user?.id, // Incluir ID do usuário logado
        sessionId: sessionIdRef.current,
        eventType: eventData.eventType || 'custom',
        eventCategory: eventData.eventCategory,
        eventAction: eventData.eventAction,
        eventLabel: eventData.eventLabel,
        pageUrl: window.location.href,
        pageTitle: document.title,
        eventData: eventData.eventData || {},
        pageLoadTime: eventData.pageLoadTime,
        timeOnPage: Math.floor((Date.now() - pageStartTimeRef.current) / 1000),
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supel_token')}` // Corrigir nome do token
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn('Falha ao enviar evento de analytics:', response.statusText);
      } else {
        const result = await response.json();
        console.log('✅ Analytics event tracked:', result);
      }

      lastEventTimeRef.current = Date.now();
    } catch (error) {
      console.warn('Erro ao enviar analytics:', error);
    }
  }, [user]);

  // Tracking de página visitada
  const trackPageView = useCallback((pageTitle?: string, additionalData: Record<string, any> = {}) => {
    trackEvent({
      eventType: 'page_view',
      eventCategory: 'navigation',
      eventAction: 'view',
      eventLabel: pageTitle || document.title,
      eventData: {
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        referrer: document.referrer,
        ...additionalData
      },
      pageLoadTime: performance.now()
    });
  }, [trackEvent]);

  // Tracking de cliques
  const trackClick = useCallback((element: string, category: string = 'interaction', additionalData: Record<string, any> = {}) => {
    trackEvent({
      eventType: 'click',
      eventCategory: category,
      eventAction: 'click',
      eventLabel: element,
      eventData: {
        element,
        timestamp: Date.now(),
        ...additionalData
      }
    });
  }, [trackEvent]);

  // Tracking de pesquisas
  const trackSearch = useCallback(async (searchData: SearchData) => {
    try {
      const payload = {
        userId: user?.id, // Incluir ID do usuário logado
        sessionId: sessionIdRef.current,
        searchQuery: searchData.query,
        searchContext: searchData.context,
        resultsCount: searchData.resultsCount,
        searchTime: searchData.searchTime,
        clickedResultPosition: searchData.clickedResultPosition,
        noResults: searchData.noResults || false
      };

      const response = await fetch('/api/analytics/track/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supel_token')}` // Corrigir nome do token
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn('Falha ao enviar analytics de pesquisa:', response.statusText);
      }
    } catch (error) {
      console.warn('Erro ao enviar analytics de pesquisa:', error);
    }
  }, []);

  // Tracking de relatórios
  const trackReport = useCallback(async (reportData: ReportData) => {
    try {
      const payload = {
        sessionId: sessionIdRef.current,
        reportType: reportData.type,
        reportFormat: reportData.format,
        filtersUsed: reportData.filters || {},
        totalRecords: reportData.recordsCount,
        generationTime: reportData.generationTime,
        fileSize: reportData.fileSize
      };

      const response = await fetch('/api/analytics/track/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supel_token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn('Falha ao enviar analytics de relatório:', response.statusText);
      }
    } catch (error) {
      console.warn('Erro ao enviar analytics de relatório:', error);
    }
  }, []);

  // Tracking de tempo de permanência
  const trackTimeOnPage = useCallback(() => {
    const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
    
    if (timeSpent > 10) { // Só rastrear se ficou mais de 10 segundos
      trackEvent({
        eventType: 'engagement',
        eventCategory: 'time',
        eventAction: 'time_on_page',
        eventLabel: document.title,
        eventData: {
          timeSpent: timeSpent,
          path: window.location.pathname
        }
      });
    }
  }, [trackEvent]);

  // Tracking de downloads
  const trackDownload = useCallback((fileName: string, fileType: string, fileSize: number | null = null) => {
    trackEvent({
      eventType: 'download',
      eventCategory: 'file',
      eventAction: 'download',
      eventLabel: fileName,
      eventData: {
        fileName,
        fileType,
        fileSize,
        downloadTime: Date.now()
      }
    });
  }, [trackEvent]);

  // Tracking de erros
  const trackError = useCallback((errorInfo: ErrorInfo) => {
    trackEvent({
      eventType: 'error',
      eventCategory: 'system',
      eventAction: 'error_occurred',
      eventLabel: errorInfo.message || 'Unknown error',
      eventData: {
        error: errorInfo.message,
        stack: errorInfo.stack,
        component: errorInfo.component,
        page: window.location.pathname,
        userAgent: navigator.userAgent
      }
    });
  }, [trackEvent]);

  // Finalizar sessão
  const endSession = useCallback(async () => {
    try {
      await fetch('/api/analytics/session/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supel_token')}`
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current
        })
      });
    } catch (error) {
      console.warn('Erro ao finalizar sessão:', error);
    }
  }, []);

  // Tracking de login
  const trackLogin = useCallback((success: boolean, method: string = 'email', errorMessage?: string) => {
    trackEvent({
      eventType: 'login',
      eventCategory: 'authentication',
      eventAction: success ? 'login_success' : 'login_failed',
      eventLabel: method,
      eventData: {
        success,
        method,
        errorMessage,
        timestamp: Date.now()
      }
    });
  }, [trackEvent]);

  // Tracking de logout
  const trackLogout = useCallback(() => {
    trackEvent({
      eventType: 'logout',
      eventCategory: 'authentication',
      eventAction: 'logout',
      eventLabel: 'user_logout',
      eventData: {
        sessionDuration: Date.now() - pageStartTimeRef.current,
        timestamp: Date.now()
      }
    });
  }, [trackEvent]);

  // Detectar quando o usuário sai da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackTimeOnPage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackTimeOnPage();
      } else {
        pageStartTimeRef.current = Date.now();
      }
    };

    // Tracking automático de cliques em links externos
    const handleClickTracking = (event: MouseEvent) => {
      if (!event.target) return;
      
      const target = (event.target as Element).closest('a, button');
      if (target) {
        const isExternalLink = target.tagName === 'A' && 
          (target as HTMLAnchorElement).href && 
          !(target as HTMLAnchorElement).href.startsWith(window.location.origin);
        
        if (isExternalLink) {
          trackClick(`external_link:${(target as HTMLAnchorElement).href}`, 'navigation');
        } else if (target.tagName === 'BUTTON') {
          trackClick(`button:${target.textContent || (target as HTMLElement).id || 'unknown'}`, 'interaction');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleClickTracking);

    // Tracking automático de performance da página
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      if (loadTime > 0) {
        trackEvent({
          eventType: 'performance',
          eventCategory: 'page_load',
          eventAction: 'load_complete',
          eventLabel: document.title,
          eventData: {
            loadTime: loadTime,
            domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            path: window.location.pathname
          },
          pageLoadTime: loadTime
        });
      }
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleClickTracking);
    };
  }, [trackEvent, trackClick, trackTimeOnPage]);

  // Reset do timer de página quando a rota muda
  useEffect(() => {
    pageStartTimeRef.current = Date.now();
  }, [window.location.pathname]);

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackSearch,
    trackReport,
    trackDownload,
    trackError,
    trackTimeOnPage,
    trackLogin,
    trackLogout,
    endSession,
    sessionId: sessionIdRef.current
  };
};

// Hook para componentes específicos
export const usePageAnalytics = (pageName: string, category: string = 'page') => {
  const { trackPageView, trackEvent } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName, { category });
  }, [pageName, category, trackPageView]);

  return { trackEvent };
};

// Hook para tracking de formulários
export const useFormAnalytics = (formName: string) => {
  const { trackEvent } = useAnalytics();

  const trackFormStart = useCallback(() => {
    trackEvent({
      eventType: 'form',
      eventCategory: 'form',
      eventAction: 'start',
      eventLabel: formName
    });
  }, [trackEvent, formName]);

  const trackFormSubmit = useCallback((success: boolean = true, errorMessage: string | null = null) => {
    trackEvent({
      eventType: 'form',
      eventCategory: 'form',
      eventAction: success ? 'submit_success' : 'submit_error',
      eventLabel: formName,
      eventData: {
        success,
        errorMessage
      }
    });
  }, [trackEvent, formName]);

  const trackFieldInteraction = useCallback((fieldName: string, action: string = 'focus') => {
    trackEvent({
      eventType: 'form',
      eventCategory: 'form_field',
      eventAction: action,
      eventLabel: `${formName}:${fieldName}`
    });
  }, [trackEvent, formName]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFieldInteraction
  };
};

export default useAnalytics;
