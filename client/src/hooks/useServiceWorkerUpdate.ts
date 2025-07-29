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
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      const handleServiceWorkerUpdate = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          
          if (registration) {
            // Verificar se há um SW esperando para ser ativado
            if (registration.waiting) {
              setWaitingWorker(registration.waiting);
              setUpdateAvailable(true);
              console.log('🔄 Service Worker aguardando ativação detectado');
            }

            // Escutar por novos SWs instalados
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Novo SW instalado e há um SW controlando a página
                    setWaitingWorker(newWorker);
                    setUpdateAvailable(true);
                    console.log('🔄 Nova versão do Service Worker disponível');
                  }
                });
              }
            });

            // Escutar quando um novo SW assume o controle
            navigator.serviceWorker.addEventListener('controllerchange', () => {
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
    }
  };

  return {
    updateAvailable,
    isUpdating,
    applyUpdate
  };
};
