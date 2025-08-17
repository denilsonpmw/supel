import { Request, Response, NextFunction } from 'express';
import pool from '../database/connection';

// Tipos para o tracking
interface TrackingRequest extends Request {
  user?: {
    id?: string;
    email?: string;
    perfil?: string;
  };
  sessionID?: string;
}

// Middleware para tracking de páginas visitadas
export function trackPageAccess(req: TrackingRequest, res: Response, next: NextFunction): void {
  // Executa o next() primeiro
  next();
  
  // Log debug para administradores
  if (req.user?.email && req.user?.perfil === 'admin' && req.method === 'GET' && !req.path.startsWith('/api/')) {
    console.log(`🔴 ADMIN BLOCKED: ${req.user.email} -> ${req.path}`);
  }
  
  // Só registra GETs para páginas HTML (não APIs nem assets) E quando há usuário logado E não é admin
  if (
    req.method === 'GET' && 
    !req.path.startsWith('/api/') && 
    !req.path.startsWith('/uploads/') &&
    !req.path.includes('.') && // Evita arquivos com extensão
    req.user?.email &&
    req.user?.perfil !== 'admin' // NÃO rastrear administradores
  ) {
    // Debug log
    console.log(`🟢 TRACKING: ${req.user!.email} (${req.user!.perfil}) -> ${req.path}`);
    
    // Executa assincronamente para não bloquear a requisição
    setImmediate(async () => {
      try {
        await pool.query(
          `INSERT INTO access_page_visits (email, path, ip, user_agent, session_id) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            req.user!.email,
            req.path,
            req.ip || req.connection.remoteAddress || null,
            req.get('User-Agent') || null,
            req.sessionID || null
          ]
        );
        console.log(`📄 Page visit tracked: ${req.user!.email} -> ${req.path}`);
      } catch (err) {
        console.error('Access tracking error:', err);
      }
    });
  }
}

// Função para registrar eventos de autenticação
export async function trackAuthEvent(
  email: string, 
  event: 'login_success' | 'login_fail' | 'logout', 
  ip?: string,
  userAgent?: string,
  userProfile?: string
): Promise<void> {
  try {
    // NÃO rastrear administradores
    if (userProfile === 'admin') {
      return;
    }
    
    await pool.query(
      `INSERT INTO access_auth_logs (email, event, ip, user_agent) 
       VALUES ($1, $2, $3, $4)`,
      [email, event, ip || null, userAgent || null]
    );
  } catch (err) {
    console.error('Auth tracking error:', err);
    // Não propaga o erro para não afetar o fluxo principal
  }
}

// Função para marcar saída de página (chamada pelo frontend)
export async function trackPageExit(pageId: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE access_page_visits 
       SET exit_at = now() 
       WHERE id = $1 AND exit_at IS NULL`,
      [pageId]
    );
  } catch (err) {
    console.error('Page exit tracking error:', err);
  }
}

// Job para fechar páginas órfãs (sem exit_at após timeout)
export async function closeOrphanedPages(timeoutMinutes: number = 30): Promise<void> {
  try {
    const result = await pool.query(
      `UPDATE access_page_visits 
       SET exit_at = enter_at + interval '${timeoutMinutes} minutes'
       WHERE exit_at IS NULL 
       AND enter_at < now() - interval '${timeoutMinutes} minutes'`,
    );
    
    if (result.rowCount && result.rowCount > 0) {
      console.log(`Closed ${result.rowCount} orphaned page visits`);
    }
  } catch (err) {
    console.error('Close orphaned pages error:', err);
  }
}

// Limpeza de logs antigos (opcional)
export async function cleanOldLogs(retentionDays: number = 90): Promise<void> {
  try {
    const authResult = await pool.query(
      `DELETE FROM access_auth_logs 
       WHERE created_at < now() - interval '${retentionDays} days'`
    );
    
    const pageResult = await pool.query(
      `DELETE FROM access_page_visits 
       WHERE enter_at < now() - interval '${retentionDays} days'`
    );
    
    console.log(`Cleaned ${authResult.rowCount || 0} auth logs and ${pageResult.rowCount || 0} page visits`);
  } catch (err) {
    console.error('Clean old logs error:', err);
  }
}
