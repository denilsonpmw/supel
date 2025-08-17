import React, { createContext, useContext, useState, useCallback } from 'react';

interface ProcessosContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
  lastUpdate: Date | null;
}

const ProcessosContext = createContext<ProcessosContextType>({
  refreshTrigger: 0,
  triggerRefresh: () => {},
  lastUpdate: null,
});

export const ProcessosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    setLastUpdate(new Date());
    // console.log('🔄 Trigger de refresh acionado:', new Date().toISOString());
  }, []);

  return (
    <ProcessosContext.Provider value={{ refreshTrigger, triggerRefresh, lastUpdate }}>
      {children}
    </ProcessosContext.Provider>
  );
};

export const useProcessosContext = () => useContext(ProcessosContext);
