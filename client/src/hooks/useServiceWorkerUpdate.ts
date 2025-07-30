import { useState, useEffect } from 'react';

interface ServiceWorkerUpdateState {
  updateAvailable: boolean;
  isUpdating: boolean;
  applyUpdate: () => void;
}

export const useServiceWorkerUpdate = (): ServiceWorkerUpdateState => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleServiceWorkerUpdate = async () => {
        try {
          console.log('🔍 Configurando detecção de atualizações do SW');
          const registration = await navigator.serviceWorker.getRegistration();
          
          if (registration) {
            console.log('📱 Registration encontrada:', registration);
            
            // Verificar se há um SW esperando para ser ativado
            if (registration.waiting) {
              console.log('⏳ SW aguardando detectado imediatamente');
              setWaitingWorker(registration.waiting);
              setUpdateAvailable(true);
            }

            // Escutar por novos SWs instalados
            registration.addEventListener('updatefound', () => {
              console.log('🔄 Update found - novo SW sendo instalado');
              const newWorker = registration.installing;
              
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  console.log('🔄 SW state change:', newWorker.state);
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Novo SW instalado e há um SW controlando a página
                    console.log('✅ Nova versão disponível');
                    setWaitingWorker(newWorker);
                    setUpdateAvailable(true);
                  }
                });
              }
            });

            // Escutar quando um novo SW assume o controle
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              console.log('🔄 Controller change detectado');
              if (isUpdating) {
                console.log('🔄 Recarregando página após atualização do SW');
                window.location.reload();
              }
            });

            // Verificar atualizações periodicamente
            const checkForUpdates = () => {
              registration.update().catch(err => 
                console.log('Erro ao verificar atualizações do SW:', err)
              );
            };

            // Verificar atualizações a cada 30 minutos
            const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000);

            // Verificar imediatamente
            checkForUpdates();

            return () => clearInterval(updateInterval);
          }
        } catch (error) {
          console.error('Erro ao configurar Service Worker updates:', error);
        }
      };

      handleServiceWorkerUpdate();
    }
  }, [isUpdating]);

  const applyUpdate = () => {
    if (waitingWorker) {
      console.log('🔄 Aplicando atualização do Service Worker');
      setIsUpdating(true);
      
      // Enviar mensagem para o SW aguardando para que ele assuma o controle
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      
      // Fallback: se não recarregar automaticamente em 3 segundos, força reload
      setTimeout(() => {
        if (isUpdating) {
          console.log('🔄 Forçando reload após timeout');
          window.location.reload();
        }
      }, 3000);
    }
  };

  return {
    updateAvailable,
    isUpdating,
    applyUpdate
  };
};
