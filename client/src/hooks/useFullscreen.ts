import { useEffect, useState, useCallback } from 'react';

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  // Detectar se está rodando como PWA
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      // Verificar se está instalado como PWA
      const isInstalled = (window.navigator as any).standalone || 
                         (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                         (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches);
      
      setIsPWA(isStandalone || isFullscreen || isMinimalUI || isInstalled);
    };

    checkPWA();
    
    // Escutar mudanças no display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)');
    const handleDisplayModeChange = () => checkPWA();
    
    mediaQuery.addEventListener('change', handleDisplayModeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Verificar se está em tela cheia
  const checkFullscreen = useCallback(() => {
    const isInFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    setIsFullscreen(isInFullscreen);
  }, []);

  // Entrar em tela cheia
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      
      setIsFullscreen(true);
    } catch (error) {
      console.error('Erro ao entrar em tela cheia:', error);
    }
  }, []);

  // Sair de tela cheia
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      
      setIsFullscreen(false);
    } catch (error) {
      console.error('Erro ao sair de tela cheia:', error);
    }
  }, []);

  // Toggle tela cheia
  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Auto entrar em tela cheia quando for PWA
  useEffect(() => {
    if (isPWA && !isFullscreen) {
      // Delay maior para garantir que a página carregou completamente
      const timer = setTimeout(() => {
        // Se já está em modo fullscreen no manifest, não precisa forçar
        const isFullscreenMode = window.matchMedia('(display-mode: fullscreen)').matches;
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
        
        // Forçar fullscreen mesmo em standalone para garantir que a barra seja escondida
        if (!isFullscreenMode) {
          enterFullscreen();
        }
        
        // Aplicar estilos CSS para esconder a barra de endereços
        if (isStandaloneMode || isFullscreenMode) {
          document.body.style.position = 'fixed';
          document.body.style.top = '0';
          document.body.style.left = '0';
          document.body.style.width = '100vw';
          document.body.style.height = '100vh';
          // Remover overflow: hidden para permitir scroll
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isPWA, isFullscreen, enterFullscreen]);

  // Escutar mudanças de tela cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      checkFullscreen();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Verificar estado inicial
    checkFullscreen();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [checkFullscreen]);

  return {
    isFullscreen,
    isPWA,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}; 