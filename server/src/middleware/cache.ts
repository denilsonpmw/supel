import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live em segundos
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();

  set(key: string, data: any, ttl: number = 300): void { // TTL padrão: 5 minutos
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000 // Converter para milissegundos
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Limpar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Estatísticas do cache
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instância global do cache
const cache = new SimpleCache();

// Limpar cache expirado a cada 10 minutos
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

// Middleware de cache para rotas
export const cacheMiddleware = (ttl: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Criar chave única baseada na URL e query params
    const cacheKey = `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}:${(req as any).user?.id || 'anonymous'}`;
    
    // Tentar buscar no cache
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache HIT: ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`Cache MISS: ${cacheKey}`);

    // Interceptar o response para salvar no cache
    const originalJson = res.json;
    res.json = function(data: any) {
      // Salvar no cache apenas se a resposta for bem-sucedida
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl);
      }
      return originalJson.call(this, data);
    };

    return next();
  };
};

// Middleware para invalidar cache específico
export const invalidateCache = (pattern?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (pattern) {
      // Invalidar chaves que contêm o padrão
      const stats = cache.getStats();
      stats.keys.forEach(key => {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      });
    } else {
      // Limpar todo o cache
      cache.clear();
    }
    
    next();
  };
};

// Função para obter estatísticas do cache
export const getCacheStats = () => {
  return cache.getStats();
};

// Exportar instância do cache para uso direto
export { cache };

export default cacheMiddleware; 