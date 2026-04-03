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

  // Verificar se deve fazer reload automático na abertura
  useEffect(() => {
    const shouldAutoUpdate = localStorage.getItem('pwa-pending-update');
    if (shouldAutoUpdate === 'true') {
      // console.log('🔄 Aplicando atualização pendente na nova sessão');
      localStorage.removeItem('pwa-pending-update');
      
      // DESABILITADO: Deixar o useServiceWorkerUpdate gerenciar os reloads
      // setTimeout(() => {
      //   if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      //     navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      //     window.location.reload();
      //   }
      // }, 1000);
    }
  }, []);

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
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none' // Força verificação de atualizações
        });
        setRegistration(registration);

        // Verificar atualizações imediatamente
        await registration.update();

        // Verificar atualizações periodicamente (a cada 30 segundos)
        const updateInterval = setInterval(async () => {
          await registration.update();
        }, 30000);

        // Verificar atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // console.log('🔄 Nova versão detectada - notificando usuário');
                setIsUpdateAvailable(true);
                
                // Marcar que há uma atualização pendente
                localStorage.setItem('pwa-pending-update', 'true');
                // console.log('💾 Atualização marcada para próxima sessão');
              }
            });
          }
        });

        // Verificar se já existe um worker ativo
        if (registration.waiting) {
          // console.log('🔄 Worker aguardando - notificando usuário');
          setIsUpdateAvailable(true);
          localStorage.setItem('pwa-pending-update', 'true');
        }

        // Escutar mudanças no controller (quando o usuário clica para atualizar)
        // DESABILITADO: useServiceWorkerUpdate já gerencia isso com timing correto
        // navigator.serviceWorker.addEventListener('controllerchange', () => {
        //   console.log('🔄 Controller mudou - recarregando página');
        //   localStorage.removeItem('pwa-pending-update'); // Limpar flag pois já atualizou
        //   window.location.reload();
        // });

        return () => clearInterval(updateInterval);
      } catch (error) {
        console.error('❌ Erro ao registrar Service Worker:', error);
      }
    }
  }, []);

  // Limpar flag de atualização quando app é fechado
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Mantém a flag para próxima sessão se houver atualização disponível
      if (isUpdateAvailable) {
        localStorage.setItem('pwa-pending-update', 'true');
        // console.log('💾 Flag de atualização mantida para próxima sessão');
      }
    };

    const handleVisibilityChange = () => {
      // Se o app ficar invisível e houver atualização, marcar para próxima sessão
      if (document.hidden && isUpdateAvailable) {
        localStorage.setItem('pwa-pending-update', 'true');
        // console.log('💾 App oculto - flag de atualização mantida');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUpdateAvailable]);

  // Escutar evento de instalação
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne o prompt automático
      e.preventDefault();
      // console.log('📱 PWA install prompt interceptado');
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
        // console.log('✅ PWA instalada pelo usuário');
        setIsInstalled(true);
      } else {
                  // console.log('ℹ️ Usuário recusou instalar o PWA');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('❌ Erro ao instalar PWA:', error);
      throw error;
    }
  };

  // Atualizar PWA imediatamente
  const updatePWA = (): void => {
    if (registration?.waiting) {
      // console.log('🔄 Usuário solicitou atualização imediata');
      localStorage.removeItem('pwa-pending-update'); // Limpar flag pois está atualizando agora
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
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