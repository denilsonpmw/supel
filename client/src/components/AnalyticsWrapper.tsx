import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';

interface AnalyticsWrapperProps {
  children: React.ReactNode;
}

const AnalyticsWrapper: React.FC<AnalyticsWrapperProps> = ({ children }) => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // Rastrear mudanças de página automaticamente
    trackPageView(document.title, {
      path: location.pathname,
      search: location.search,
      hash: location.hash
    });
  }, [location, trackPageView]);

  return <>{children}</>;
};

export default AnalyticsWrapper;
