import React, { createContext, useContext, useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useCustomTheme } from './ThemeContext';

export type AuditoriaNivel = 'baixo' | 'medio' | 'alto';

export interface ConfigState {
  tema: 'light' | 'dark' | 'auto';
  densidade: 'default' | 'compact';
  fonteBase: number; // px
  dashboardItensPagina: number;
  dashboardAutoRefreshSeg: number;
  pwaAutoUpdate: boolean;
  pwaLimparCache: boolean; // flag one-shot
  notificacoesGlobais: boolean;
  notificacoesPush: boolean;
  notificacoesEmail: boolean;
  notificacoesSom: boolean;
  sessaoTimeoutMin: number;
  segurancaDetalheAuditoria: AuditoriaNivel;
  inatividadeLogout: boolean;
}

interface ConfigContextType {
  config: ConfigState;
  updateConfig: (patch: Partial<ConfigState>) => void;
  forceServiceWorkerUpdate: () => Promise<void>;
  clearPWACache: () => Promise<void>;
}

const DEFAULT_CONFIG: ConfigState = {
  tema: 'auto',
  densidade: 'default',
  fonteBase: 14,
  dashboardItensPagina: 20,
  dashboardAutoRefreshSeg: 60,
  pwaAutoUpdate: true,
  pwaLimparCache: false,
  notificacoesGlobais: true,
  notificacoesPush: false,
  notificacoesEmail: false,
  notificacoesSom: false,
  sessaoTimeoutMin: 30,
  segurancaDetalheAuditoria: 'medio',
  inatividadeLogout: true,
};

const LS_KEY = 'configuracoes_sistema_v1';

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig deve ser usado dentro de ConfigContextProvider');
  return ctx;
};

export const ConfigContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const { mode, toggleTheme } = useCustomTheme();
  const [config, setConfig] = useState<ConfigState>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return DEFAULT_CONFIG;
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const persist = useCallback((next: Partial<ConfigState>) => {
    setConfig(prev => {
      const merged = { ...prev, ...next };
      localStorage.setItem(LS_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  // Aplicar tema se config mudar
  // REMOVIDO: Deixar o tema ser controlado exclusivamente pelo ThemeContext
  // para evitar conflitos com mudanças manuais do usuário
  // useEffect(() => {
  //   // Lógica de sincronização de tema removida
  // }, [config.tema, mode, toggleTheme]);

  // Aplicar fonte & densidade
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', config.fonteBase + 'px');
    document.documentElement.style.setProperty('--app-density', config.densidade);
    document.body.style.fontSize = config.fonteBase + 'px';
    if (config.densidade === 'compact') {
      document.documentElement.classList.add('density-compact');
    } else {
      document.documentElement.classList.remove('density-compact');
    }
  }, [config.fonteBase, config.densidade]);

  // Inatividade -> logout
  const lastActivityRef = useRef(Date.now());
  useEffect(() => {
    const handler = () => (lastActivityRef.current = Date.now());
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, handler));
    const interval = setInterval(() => {
      if (!config.inatividadeLogout) return;
      const diffMin = (Date.now() - lastActivityRef.current) / 60000;
      if (diffMin >= config.sessaoTimeoutMin) {
        logout();
      }
    }, 30000);
    return () => {
      events.forEach(ev => window.removeEventListener(ev, handler));
      clearInterval(interval);
    };
  }, [config.inatividadeLogout, config.sessaoTimeoutMin, logout]);

  // Auto update SW
  useEffect(() => {
    if (!config.pwaAutoUpdate) return;
    const interval = setInterval(async () => {
      try {
        const regs = await navigator.serviceWorker?.getRegistrations?.();
        for (const r of regs || []) r.update();
      } catch (e) {
        // silent
      }
    }, Math.max(60000, config.dashboardAutoRefreshSeg * 1000));
    return () => clearInterval(interval);
  }, [config.pwaAutoUpdate, config.dashboardAutoRefreshSeg]);

  // One-shot limpar cache se flag setada
  useEffect(() => {
    if (!config.pwaLimparCache) return;
    (async () => {
      try {
        const keys = await caches.keys();
        for (const k of keys) await caches.delete(k);
        persist({ pwaLimparCache: false });
      } catch {
        persist({ pwaLimparCache: false });
      }
    })();
  }, [config.pwaLimparCache, persist]);

  const forceServiceWorkerUpdate = useCallback(async () => {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    for (const r of regs || []) await r.update();
  }, []);

  const clearPWACache = useCallback(async () => {
    const keys = await caches.keys();
    for (const k of keys) await caches.delete(k);
  }, []);

  const value: ConfigContextType = {
    config,
    updateConfig: persist,
    forceServiceWorkerUpdate,
    clearPWACache,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};
