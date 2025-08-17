import express from 'express';
import pool from '../database/connection';
import { authenticateToken } from '../middleware/auth';

// Interface para estender o Request com propriedades personalizadas
interface AuthenticatedRequest extends express.Request {
  user?: {
    id?: string;
    email?: string;
    perfil?: string;
  };
  sessionID?: string;
}

// Middleware para verificar se o usuário é administrador
const requireAdmin = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction): void => {
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  if (user.perfil !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito a administradores' });
    return;
  }

  next();
};

const router = express.Router();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// POST /api/access-tracking/page-enter - Registrar entrada em página (todos os usuários autenticados)
router.post('/page-enter', async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { path } = req.body;
    const user = req.user;
    
    if (!user?.email || !path) {
      res.status(400).json({ error: 'Email e path são obrigatórios' });
      return;
    }
    
    // NÃO rastrear administradores
    if (user.perfil === 'admin') {
      res.json({ success: true, message: 'Admin tracking blocked' });
      return;
    }
    
    const result = await pool.query(
      `INSERT INTO access_page_visits (email, path, ip, user_agent, session_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        user.email,
        path,
        req.ip || req.connection?.remoteAddress || null,
        req.get('User-Agent') || null,
        req.sessionID || null
      ]
    );
    
    // console.log(`📄 Page visit tracked: ${user.email} -> ${path}`);
    res.json({ success: true, visitId: result.rows[0].id });
  } catch (err) {
    console.error('Page enter tracking error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/access-tracking/page-exit - Registrar saída de página (enviado pelo frontend)
router.post('/page-exit', async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { visitId } = req.body;
    const user = req.user;
    
    if (!visitId) {
      res.status(400).json({ error: 'visitId é obrigatório' });
      return;
    }
    
    // NÃO rastrear administradores
    if (user?.perfil === 'admin') {
      res.json({ success: true, message: 'Admin tracking blocked' });
      return;
    }
    
    await pool.query(
      `UPDATE access_page_visits 
       SET exit_at = now() 
       WHERE id = $1 AND exit_at IS NULL`,
      [visitId]
    );
    
    // console.log(`📤 Page exit tracked for visitId: ${visitId}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Page exit tracking error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/access-tracking/page-visits - Consultar visitas de páginas (apenas admin)
router.get('/page-visits', requireAdmin, async (req, res): Promise<void> => {
  try {
    const { 
      email, 
      from, 
      to, 
      path, 
      format,
      limit = '1000',
      offset = '0' 
    } = req.query;
    
    let query = `
      SELECT 
        id,
        email,
        path,
        ip,
        user_agent,
        enter_at,
        exit_at,
        session_id,
        CASE 
          WHEN exit_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (exit_at - enter_at))::integer
          ELSE NULL 
        END as duration_seconds
      FROM access_page_visits 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (email) {
      query += ` AND email ILIKE $${paramIndex}`;
      params.push(`%${email}%`);
      paramIndex++;
    }
    
    if (from) {
      query += ` AND enter_at >= $${paramIndex}`;
      params.push(from);
      paramIndex++;
    }
    
    if (to) {
      query += ` AND enter_at <= $${paramIndex}`;
      params.push(to);
      paramIndex++;
    }
    
    if (path) {
      query += ` AND path ILIKE $${paramIndex}`;
      params.push(`%${path}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY enter_at DESC`;
    
    if (format !== 'csv') {
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string), parseInt(offset as string));
    }
    
    const result = await pool.query(query, params);
    
    // Se for CSV, retornar formato CSV
    if (format === 'csv') {
      const csvHeader = 'Email,Página,Entrada,Saída,Duração (s),IP,Session ID\n';
      const csvRows = result.rows.map(row => [
        row.email,
        row.path,
        new Date(row.enter_at).toLocaleString('pt-BR'),
        row.exit_at ? new Date(row.exit_at).toLocaleString('pt-BR') : 'Ativa',
        row.duration_seconds || '',
        row.ip || '',
        row.session_id || ''
      ].map(field => `"${field}"`).join(',')).join('\n');
      
      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="page-visits.csv"');
      res.send('\uFEFF' + csv);
      return;
    }
    
    // Contar total de registros para paginação
    let countQuery = `SELECT COUNT(*) as total FROM access_page_visits WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIndex = 1;
    
    if (email) {
      countQuery += ` AND email ILIKE $${countParamIndex}`;
      countParams.push(`%${email}%`);
      countParamIndex++;
    }
    
    if (from) {
      countQuery += ` AND enter_at >= $${countParamIndex}`;
      countParams.push(from);
      countParamIndex++;
    }
    
    if (to) {
      countQuery += ` AND enter_at <= $${countParamIndex}`;
      countParams.push(to);
      countParamIndex++;
    }
    
    if (path) {
      countQuery += ` AND path ILIKE $${countParamIndex}`;
      countParams.push(`%${path}%`);
      countParamIndex++;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (parseInt(offset as string) + parseInt(limit as string)) < parseInt(countResult.rows[0].total)
      }
    });
  } catch (err) {
    console.error('Page visits query error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/access-tracking/auth-logs - Consultar logs de autenticação (apenas admin)
router.get('/auth-logs', requireAdmin, async (req, res): Promise<void> => {
  try {
    const { 
      email, 
      from, 
      to, 
      event,
      format,
      limit = '1000',
      offset = '0' 
    } = req.query;
    
    let query = `
      SELECT 
        id,
        email,
        event,
        ip,
        user_agent,
        created_at
      FROM access_auth_logs 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (email) {
      query += ` AND email ILIKE $${paramIndex}`;
      params.push(`%${email}%`);
      paramIndex++;
    }
    
    if (from) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(from);
      paramIndex++;
    }
    
    if (to) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(to);
      paramIndex++;
    }
    
    if (event) {
      query += ` AND event = $${paramIndex}`;
      params.push(event);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    if (format !== 'csv') {
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string), parseInt(offset as string));
    }
    
    const result = await pool.query(query, params);
    
    // Se for CSV, retornar formato CSV
    if (format === 'csv') {
      const csvHeader = 'Email,Evento,IP,User Agent,Data/Hora\n';
      const csvRows = result.rows.map(row => [
        row.email,
        row.event,
        row.ip || '',
        (row.user_agent || '').replace(/"/g, '""'),
        new Date(row.created_at).toLocaleString('pt-BR')
      ].map(field => `"${field}"`).join(',')).join('\n');
      
      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="auth-logs.csv"');
      res.send('\uFEFF' + csv);
      return;
    }
    
    // Contar total para paginação
    let countQuery = `SELECT COUNT(*) as total FROM access_auth_logs WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIndex = 1;
    
    if (email) {
      countQuery += ` AND email ILIKE $${countParamIndex}`;
      countParams.push(`%${email}%`);
      countParamIndex++;
    }
    
    if (from) {
      countQuery += ` AND created_at >= $${countParamIndex}`;
      countParams.push(from);
      countParamIndex++;
    }
    
    if (to) {
      countQuery += ` AND created_at <= $${countParamIndex}`;
      countParams.push(to);
      countParamIndex++;
    }
    
    if (event) {
      countQuery += ` AND event = $${countParamIndex}`;
      countParams.push(event);
      countParamIndex++;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (parseInt(offset as string) + parseInt(limit as string)) < parseInt(countResult.rows[0].total)
      }
    });
  } catch (err) {
    console.error('Auth logs query error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/access-tracking/stats - Estatísticas básicas (apenas admin)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { from, to } = req.query;
    
    let dateFilter = '';
    const params: any[] = [];
    
    if (from || to) {
      if (from && to) {
        dateFilter = 'WHERE enter_at BETWEEN $1 AND $2';
        params.push(from, to);
      } else if (from) {
        dateFilter = 'WHERE enter_at >= $1';
        params.push(from);
      } else if (to) {
        dateFilter = 'WHERE enter_at <= $1';
        params.push(to);
      }
    }
    
    // Estatísticas de páginas mais visitadas
    const pagesQuery = `
      SELECT 
        path,
        COUNT(*) as visits,
        COUNT(DISTINCT email) as unique_users,
        AVG(EXTRACT(EPOCH FROM (exit_at - enter_at))::integer) as avg_duration_seconds
      FROM access_page_visits 
      ${dateFilter}
      GROUP BY path
      ORDER BY visits DESC
      LIMIT 10
    `;
    
    // Estatísticas de usuários mais ativos
    const usersQuery = `
      SELECT 
        email,
        COUNT(*) as page_visits,
        COUNT(DISTINCT path) as unique_pages,
        MAX(enter_at) as last_visit
      FROM access_page_visits 
      ${dateFilter}
      GROUP BY email
      ORDER BY page_visits DESC
      LIMIT 10
    `;
    
    const [pagesResult, usersResult] = await Promise.all([
      pool.query(pagesQuery, params),
      pool.query(usersQuery, params)
    ]);
    
    res.json({
      mostVisitedPages: pagesResult.rows,
      mostActiveUsers: usersResult.rows
    });
  } catch (err) {
    console.error('Stats query error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
