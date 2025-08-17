// Tracking de páginas visitadas no frontend
// Este arquivo deve ser incluído em todas as páginas da aplicação

interface PageTrackingConfig {
  enableTracking: boolean;
  apiBaseUrl: string;
  sessionId: string | null;
}

class PageTracker {
  private config: PageTrackingConfig;
  private currentPageId: string | null = null;
  private isTrackingEnabled: boolean = false;

  constructor(config: PageTrackingConfig) {
    this.config = config;
    this.isTrackingEnabled = config.enableTracking && this.hasValidSession();
    
    if (this.isTrackingEnabled) {
      this.init();
    }
  }

  private hasValidSession(): boolean {
    // Verificar se há token de autenticação válido
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return !!token;
  }

  private init(): void {
    // Inicializar tracking quando a página carrega
    document.addEventListener('DOMContentLoaded', () => {
      this.startPageTracking();
    });

    // Tracking de saída da página
    window.addEventListener('beforeunload', () => {
      this.endPageTracking();
    });

    // Para SPAs - tracking de mudança de rota
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });

    // Interceptar mudanças de URL em SPAs (pushState/replaceState)
    this.interceptHistoryAPI();
  }

  private startPageTracking(): void {
    if (!this.isTrackingEnabled) return;

    // Capturar ID da página se disponível no DOM
    const pageIdMeta = document.querySelector('meta[name="page-visit-id"]') as HTMLMetaElement;
    if (pageIdMeta) {
      this.currentPageId = pageIdMeta.content;
    }

    // Se não tiver ID, essa página não está sendo trackada pelo backend
    // (provavelmente porque não passou pelo middleware ou não é uma página autenticada)
  }

  private endPageTracking(): void {
    if (!this.isTrackingEnabled || !this.currentPageId) return;

    const payload = JSON.stringify({ 
      pageId: this.currentPageId 
    });

    const url = `${this.config.apiBaseUrl}/api/access-tracking/page-exit`;

    // Usar sendBeacon para garantir envio mesmo durante unload
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      // Fallback para navegadores mais antigos
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, false); // Síncrono para unload
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(payload);
      } catch (e) {
        // Silently fail - tracking não é crítico
      }
    }
  }

  private handleRouteChange(): void {
    // Finalizar tracking da página anterior
    this.endPageTracking();
    
    // Aguardar DOM atualizar e iniciar novo tracking
    setTimeout(() => {
      this.startPageTracking();
    }, 100);
  }

  private interceptHistoryAPI(): void {
    // Interceptar pushState e replaceState para SPAs
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleRouteChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleRouteChange();
    };
  }

  // Método público para controlar tracking
  public setTrackingEnabled(enabled: boolean): void {
    this.isTrackingEnabled = enabled && this.hasValidSession();
  }

  // Método público para finalizar tracking manualmente
  public endCurrentPageTracking(): void {
    this.endPageTracking();
    this.currentPageId = null;
  }
}

// Exportar classe para uso em módulos
export { PageTracker };

// Auto-inicialização para uso tradicional (script tag)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Configuração padrão
    const config: PageTrackingConfig = {
      enableTracking: true,
      apiBaseUrl: '', // Base URL vazia usa a mesma origem
      sessionId: sessionStorage.getItem('sessionId')
    };

    // Inicializar tracker global
    (window as any).pageTracker = new PageTracker(config);
  });
}

// Exemplo de uso em React/Vue/Angular:
/*
import { PageTracker } from './pageTracker';

const tracker = new PageTracker({
  enableTracking: true,
  apiBaseUrl: process.env.REACT_APP_API_URL || '',
  sessionId: sessionStorage.getItem('sessionId')
});

// Em componentes que gerenciam roteamento:
useEffect(() => {
  // Tracker já cuida de mudanças de rota automaticamente
  
  return () => {
    // Cleanup ao desmontar componente principal
    tracker.endCurrentPageTracking();
  };
}, []);
*/
