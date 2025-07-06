import { useEffect, useState } from 'react';

interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  isFullscreen: boolean;
}

interface PWAActions {
  installPWA: () => Promise<void>;
  updatePWA: () => void;
  skipWaiting: () => void;
}

export const usePWA = (): PWAState & PWAActions => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Verificar se é PWA instalada e modo de exibição
  useEffect(() => {
    const checkDisplayMode = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const minimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      setIsStandalone(standalone);
      setIsFullscreen(fullscreen);
      setIsInstalled(standalone || fullscreen || minimalUI);
    };

    checkDisplayMode();
    window.addEventListener('appinstalled', checkDisplayMode);
    
    // Escutar mudanças no display mode
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const fullscreenQuery = window.matchMedia('(display-mode: fullscreen)');
    
    standaloneQuery.addEventListener('change', checkDisplayMode);
    fullscreenQuery.addEventListener('change', checkDisplayMode);
    
    return () => {
      window.removeEventListener('appinstalled', checkDisplayMode);
      standaloneQuery.removeEventListener('change', checkDisplayMode);
      fullscreenQuery.removeEventListener('change', checkDisplayMode);
    };
  }, []);

  // Registrar service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    async function registerServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setRegistration(registration);

        // Verificar atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          }
        });

        // Verificar se já existe um worker ativo
        if (registration.waiting) {
          setIsUpdateAvailable(true);
        }

        console.log('✅ Service Worker registrado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao registrar Service Worker:', error);
      }
    }
  }, []);

  // Escutar evento de instalação
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PWAInstallPrompt);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Monitorar status online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Instalar PWA
  const installPWA = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('PWA não está disponível para instalação');
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA instalada pelo usuário');
        setIsInstalled(true);
      } else {
        console.log('ℹ️ Usuário recusou instalar o PWA');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('❌ Erro ao instalar PWA:', error);
      throw error;
    }
  };

  // Atualizar PWA
  const updatePWA = (): void => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // Pular espera e ativar novo service worker
  const skipWaiting = (): void => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
    }
  };

  return {
    isInstallable,
    isInstalled,
    isUpdateAvailable,
    isOnline,
    isStandalone,
    isFullscreen,
    installPWA,
    updatePWA,
    skipWaiting,
  };
};

// Hook para detectar se está offline
export const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}; 