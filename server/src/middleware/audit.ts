import { Request, Response, NextFunction } from 'express';
import pool from '../database/connection';

// Interface para Request com informações de usuário
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    nome: string;
    perfil: string;
    paginas_permitidas?: string[];
    responsavel_id?: number;
    ativo: boolean;
  };
}

function getClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  if (typeof req.ip === 'string' && req.ip.length > 0) {
    return req.ip;
  }
  if (
    req.connection &&
    (req.connection as any).socket &&
    typeof (req.connection as any).socket.remoteAddress === 'string' &&
    (req.connection as any).socket.remoteAddress.length > 0
  ) {
    return (req.connection as any).socket.remoteAddress;
  }
  if (req.socket && typeof req.socket.remoteAddress === 'string' && req.socket.remoteAddress.length > 0) {
    return req.socket.remoteAddress;
  }
  return 'unknown';
}

/**
 * Middleware para capturar informações de auditoria
 * Define variáveis de sessão do PostgreSQL com informações do usuário e IP
 */
export const auditMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Obter IP do cliente (considerando proxy/rede cloud)
    const ipAddress = getClientIp(req);
    
    // Obter User Agent
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Informações do usuário (se autenticado)
    const userId = req.user?.id || null;
    const userEmail = req.user?.email || null;
    const userName = req.user?.nome || null;
    
    // Definir variáveis de sessão do PostgreSQL
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // Apenas para operações que modificam dados
      await pool.query('SELECT set_config($1, $2, false)', ['app.current_user_id', userId?.toString() || '']);
      await pool.query('SELECT set_config($1, $2, false)', ['app.current_user_email', userEmail || '']);
      await pool.query('SELECT set_config($1, $2, false)', ['app.current_user_nome', userName || '']);
      await pool.query('SELECT set_config($1, $2, false)', ['app.current_ip_address', ipAddress]);
      await pool.query('SELECT set_config($1, $2, false)', ['app.current_user_agent', userAgent]);
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware de auditoria:', error);
    next(); // Continuar mesmo com erro
  }
};

/**
 * Função para registrar log de auditoria manualmente
 * Útil para operações que não passam pelos triggers
 */
export const logAuditoria = async (
  usuarioId: number | null,
  usuarioEmail: string | null,
  usuarioNome: string | null,
  tabelaAfetada: string,
  operacao: 'INSERT' | 'UPDATE' | 'DELETE',
  registroId: number | null,
  dadosAnteriores?: any,
  dadosNovos?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    const query = `
      INSERT INTO auditoria_log (
        usuario_id, usuario_email, usuario_nome, tabela_afetada, 
        operacao, registro_id, dados_anteriores, dados_novos, 
        ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    
    await pool.query(query, [
      usuarioId,
      usuarioEmail,
      usuarioNome,
      tabelaAfetada,
      operacao,
      registroId,
      dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
      dadosNovos ? JSON.stringify(dadosNovos) : null,
      ipAddress,
      userAgent
    ]);
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
  }
}; 