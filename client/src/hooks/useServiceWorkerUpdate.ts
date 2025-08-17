import { useState, useEffect } from 'react';

interface ServiceWorkerUpdateState {
  updateAvailable: boolean;
  isUpdating: boolean;
  applyUpdate: () => void;
  currentVersion: string;
}

export const useServiceWorkerUpdate = (): ServiceWorkerUpdateState => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const getCurrentVersion = async (): Promise<string> => {
        try {
          const cacheNames = await caches.keys();
          // console.log('📦 Cache names found:', cacheNames);
          
          // Procurar por cache com versão no nome (formato supel-v1.2.3)
          const versionCache = cacheNames.find(name => name.includes('supel-v'));
          if (versionCache) {
            const versionMatch = versionCache.match(/supel-v(\d+\.\d+\.\d+)/);
            if (versionMatch) {
              return versionMatch[1];
            }
          }
          
          return '1.0.0';
        } catch (error) {
          // console.warn('❌ Erro ao obter versão:', error);
          return '1.0.0';
        }
      };

      const handleServiceWorkerUpdate = async () => {
        try {
          // console.log('🔍 Configurando detecção de atualizações do SW');
          
          // Obter versão atual
          const version = await getCurrentVersion();
          // console.log('📱 Versão atual detectada:', version);
          setCurrentVersion(version);
          
          const registration = await navigator.serviceWorker.getRegistration();
          
          if (registration) {
            // console.log('📱 Registration encontrada:', registration);
            
            // Verificar se há um SW esperando para ser ativado
            if (registration.waiting) {
              // console.log('⏳ SW aguardando detectado imediatamente:', registration.waiting);
              setWaitingWorker(registration.waiting);
              setUpdateAvailable(true);
            } else {
              // console.log('ℹ️ Nenhum SW waiting encontrado, configurando listener para futuras atualizações');
            }

            // Escutar por novos SWs instalados
            registration.addEventListener('updatefound', () => {
              // console.log('🔄 Update found - novo SW sendo instalado');
              const newWorker = registration.installing;
              
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  // console.log('🔄 SW state change:', newWorker.state);
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Novo SW instalado e há um SW controlando a página
                    // console.log('✅ Nova versão disponível');
                    setWaitingWorker(newWorker);
                    setUpdateAvailable(true);
                    
                    // Detectar versão da nova atualização
                    const detectNewVersion = async () => {
                      try {
                        const cacheNames = await caches.keys();
                        // console.log('📦 Caches disponíveis:', cacheNames);
                        // Procurar pelo cache mais recente (o Service Worker novo cria um cache novo)
                        const versionCaches = cacheNames.filter(name => name.includes('supel-v'));
                        if (versionCaches.length > 0) {
                          // Pegar a versão mais alta
                          const versions = versionCaches.map(name => {
                            const match = name.match(/supel-v(\d+\.\d+\.\d+)/);
                            return match ? match[1] : '0.0.0';
                          }).sort((a, b) => {
                            const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
                            const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
                            if (aMajor !== bMajor) return bMajor - aMajor;
                            if (aMinor !== bMinor) return bMinor - aMinor;
                            return bPatch - aPatch;
                          });
                          
                          if (versions.length > 0) {
                            // console.log('🔄 Nova versão detectada:', versions[0]);
                            setCurrentVersion(versions[0]);
                          }
                        }
                      } catch (error) {
                        // console.warn('❌ Erro ao detectar nova versão:', error);
                      }
                    };
                    
                    detectNewVersion();
                  }
                });
              }
            });

            // Escutar quando um novo SW assume o controle
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              // console.log('🔄 Controller change detectado - aguardando 10s antes de recarregar');
              setTimeout(() => {
                window.location.reload();
              }, 10000);
            });

            // Verificar atualizações periodicamente
            const checkForUpdates = () => {
              registration.update().catch(() => {
                // console.log('Erro ao verificar atualizações do SW:', err)
              });
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
  }, []);

  const applyUpdate = () => {
    // console.log('🔄 applyUpdate chamado - waitingWorker:', waitingWorker, 'isUpdating:', isUpdating);
    
    if (waitingWorker && !isUpdating) {
      // console.log('🔄 Aplicando atualização do Service Worker');
      setIsUpdating(true);
      
      // Enviar mensagem para o SW aguardando para que ele assuma o controle
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      // console.log('📤 Mensagem SKIP_WAITING enviada para o SW');
      setUpdateAvailable(false);
      
      // Fallback: se não recarregar automaticamente em 10 segundos, força reload
      setTimeout(() => {
        // console.log('🔄 Forçando reload após timeout de 10s');
        window.location.reload();
      }, 10000);
    } else if (!waitingWorker) {
      // console.warn('⚠️ Nenhum waitingWorker encontrado, tentando forçar atualização via registration');
      
      // Fallback: tentar forçar atualização via registration
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          // console.log('📱 Registration encontrada, tentando update...');
          setIsUpdating(true);
          
          if (registration.waiting) {
            // console.log('⏳ SW waiting encontrado via registration');
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            setTimeout(() => window.location.reload(), 2000);
          } else {
            // console.log('🔄 Forçando update da registration');
            registration.update().then(() => {
              setTimeout(() => window.location.reload(), 2000);
            });
          }
        }
      });
    }
  };

  return {
    updateAvailable,
    isUpdating,
    applyUpdate,
    currentVersion
  };
};
