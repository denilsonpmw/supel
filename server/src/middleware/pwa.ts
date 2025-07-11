import { Request, Response, NextFunction } from 'express';

export const pwaMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Headers específicos para PWA
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Headers para PWA - garantir que funcione em produção
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Headers específicos para manifest.json
  if (req.path === '/manifest.json') {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
  }
  
  // Headers específicos para service worker
  if (req.path === '/sw.js') {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Headers para ícones PWA
  if (req.path.startsWith('/icons/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 ano
  }
  
  // Headers para garantir que o PWA funcione corretamente
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}; 