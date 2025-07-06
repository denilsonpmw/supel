import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface PaginationOptions {
  endpoint: string;
  initialPageSize?: number;
  initialFilters?: Record<string, any>;
  enableCache?: boolean;
}

interface PaginationResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: Record<string, any>) => void;
  refresh: () => void;
  loadMore: () => void; // Para lazy loading
}

const usePagination = <T = any>(options: PaginationOptions): PaginationResult<T> => {
  const {
    endpoint,
    initialPageSize = 20,
    initialFilters = {},
    enableCache = true
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [cache, setCache] = useState<Map<string, { data: T[]; timestamp: number }>>(new Map());

  // Gerar chave de cache
  const getCacheKey = useCallback((currentPage: number, currentPageSize: number, currentFilters: Record<string, any>) => {
    return `${endpoint}-${currentPage}-${currentPageSize}-${JSON.stringify(currentFilters)}`;
  }, [endpoint]);

  // Verificar se dados estão em cache (válido por 5 minutos)
  const getCachedData = useCallback((key: string) => {
    if (!enableCache) return null;
    
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
    return null;
  }, [cache, enableCache]);

  // Salvar dados no cache
  const setCachedData = useCallback((key: string, data: T[]) => {
    if (!enableCache) return;
    
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, { data, timestamp: Date.now() });
      
      // Limitar tamanho do cache (máximo 50 entradas)
      if (newCache.size > 50) {
        const firstKey = newCache.keys().next().value;
        if (firstKey) {
          newCache.delete(firstKey);
        }
      }
      
      return newCache;
    });
  }, [enableCache]);

  // Carregar dados
  const loadData = useCallback(async (currentPage: number, currentPageSize: number, currentFilters: Record<string, any>, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = getCacheKey(currentPage, currentPageSize, currentFilters);
      const cachedData = getCachedData(cacheKey);

      if (cachedData && !append) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentPageSize.toString(),
        ...Object.fromEntries(
          Object.entries(currentFilters).filter(([_, value]) => 
            value !== null && value !== undefined && value !== ''
          )
        )
      });

      const response = await api.get(`${endpoint}?${params.toString()}`);
      
      const newData = response.data.data || response.data;
      const pagination = response.data.pagination || {
        total: newData.length,
        pages: 1,
        page: currentPage,
        limit: currentPageSize
      };

      if (append) {
        setData(prev => [...prev, ...newData]);
      } else {
        setData(newData);
        setCachedData(cacheKey, newData);
      }

      setTotalItems(pagination.total);
      setTotalPages(pagination.pages);
    } catch (err: any) {
      console.error('Erro ao carregar dados paginados:', err);
      setError(err.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [endpoint, getCacheKey, getCachedData, setCachedData]);

  // Efeito para carregar dados quando dependências mudam
  useEffect(() => {
    loadData(page, pageSize, filters);
  }, [page, pageSize, filters, loadData]);

  // Funções de controle
  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset para primeira página
  }, []);

  const handleSetFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1); // Reset para primeira página
  }, []);

  const refresh = useCallback(() => {
    // Limpar cache para forçar reload
    if (enableCache) {
      setCache(new Map());
    }
    loadData(page, pageSize, filters);
  }, [page, pageSize, filters, loadData, enableCache]);

  const loadMore = useCallback(() => {
    if (page < totalPages) {
      loadData(page + 1, pageSize, filters, true);
      setPage(prev => prev + 1);
    }
  }, [page, totalPages, pageSize, filters, loadData]);

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    setFilters: handleSetFilters,
    refresh,
    loadMore
  };
};

export default usePagination; 