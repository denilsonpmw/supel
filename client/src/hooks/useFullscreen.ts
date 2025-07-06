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
      
      setIsPWA(isStandalone || isFullscreen || isMinimalUI);
    };

    checkPWA();
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
      // Pequeno delay para garantir que a página carregou
      const timer = setTimeout(() => {
        enterFullscreen();
      }, 500);
      
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