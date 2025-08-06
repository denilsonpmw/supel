const { pool } = require("../database/connection");

// Função para rastrear eventos de analytics
async function trackEvent(eventData) {
  try {
    const {
      userId,
      sessionId,
      eventType,
      eventCategory,
      eventAction,
      eventLabel,
      pageUrl,
      userAgent,
      ipAddress,
      metadata
    } = eventData;

    // Parse do user agent
    const agentInfo = parseUserAgent(userAgent || '');

    // Inserir evento na tabela user_analytics (usando os nomes corretos das colunas)
    const analyticsQuery = `
      INSERT INTO user_analytics (
        user_id, session_id, event_type, event_category, event_action, 
        event_label, page_url, user_agent, browser_name, 
        os_name, device_type, ip_address, event_data, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING id
    `;

    const result = await pool.query(analyticsQuery, [
      userId || null,
      sessionId,
      eventType,
      eventCategory,
      eventAction,
      eventLabel || null,
      pageUrl,
      userAgent,
      agentInfo.browser,
      agentInfo.os,
      agentInfo.deviceType,
      ipAddress,
      JSON.stringify(metadata || {})
    ]);

    // Se houver um userId, atualizar última atividade da sessão
    if (userId && sessionId) {
      await updateSessionActivity(sessionId);
    }

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao rastrear evento:', error);
    throw error;
  }
}

// Função para atualizar sessão do usuário
async function updateUserSession(userId, sessionId, userAgent, ipAddress) {
  try {
    const agentInfo = parseUserAgent(userAgent || '');
    
    const sessionQuery = `
      INSERT INTO user_sessions (
        user_id, session_id, start_time, last_activity, 
        user_agent, browser_name, os_name, device_type, ip_address
      ) VALUES ($1, $2, NOW(), NOW(), $3, $4, $5, $6, $7)
      ON CONFLICT (session_id) 
      DO UPDATE SET 
        last_activity = NOW(),
        user_agent = EXCLUDED.user_agent,
        browser_name = EXCLUDED.browser_name,
        os_name = EXCLUDED.os_name,
        device_type = EXCLUDED.device_type,
        ip_address = EXCLUDED.ip_address
    `;

    await pool.query(sessionQuery, [
      userId,
      sessionId,
      userAgent,
      agentInfo.browser,
      agentInfo.os,
      agentInfo.deviceType,
      ipAddress
    ]);
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
    throw error;
  }
}

// Função para atualizar apenas a última atividade da sessão
async function updateSessionActivity(sessionId) {
  try {
    const updateQuery = `
      UPDATE user_sessions 
      SET last_activity = NOW()
      WHERE session_id = $1
    `;
    
    await pool.query(updateQuery, [sessionId]);
  } catch (error) {
    console.error('Erro ao atualizar atividade da sessão:', error);
    // Não fazer throw aqui para não quebrar o tracking
  }
}

// Função para obter métricas do dashboard
async function getDashboardMetrics() {
  try {
    const queries = {
      // Total de usuários únicos
      totalUsers: `
        SELECT COUNT(DISTINCT user_id) as count 
        FROM user_analytics 
        WHERE user_id IS NOT NULL
      `,
      
      // Sessões ativas hoje
      activeSessions: `
        SELECT COUNT(*) as count 
        FROM user_sessions 
        WHERE DATE(start_time) = CURRENT_DATE
      `,
      
      // Eventos hoje
      eventsToday: `
        SELECT COUNT(*) as count 
        FROM user_analytics 
        WHERE DATE(timestamp) = CURRENT_DATE
      `,
      
      // Páginas mais visitadas (versão simplificada)
      topPages: `
        SELECT 
          page_url, 
          COUNT(*) as visits
        FROM user_analytics
        WHERE event_type = 'page_view' 
          AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY page_url 
        ORDER BY visits DESC 
        LIMIT 10
      `,
      
      // Dispositivos mais usados
      topDevices: `
        SELECT device_type, COUNT(*) as count 
        FROM user_analytics 
        WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY device_type 
        ORDER BY count DESC
      `,
      
      // Browsers mais usados
      topBrowsers: `
        SELECT browser_name, COUNT(*) as count 
        FROM user_analytics 
        WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY browser_name 
        ORDER BY count DESC 
        LIMIT 5
      `,
      
      // Tempo médio de sessão
      avgSessionTime: `
        SELECT AVG(EXTRACT(EPOCH FROM (last_activity - start_time))) as avg_seconds
        FROM user_sessions 
        WHERE start_time >= CURRENT_DATE - INTERVAL '7 days'
          AND last_activity > start_time
      `,
      
      // Dados de série temporal (últimos 7 dias)
      timeSeriesData: `
        SELECT 
          DATE(a.timestamp) as date,
          COUNT(DISTINCT a.user_id) as users,
          COUNT(DISTINCT a.session_id) as sessions,
          COUNT(*) as events,
          AVG(EXTRACT(EPOCH FROM (s.last_activity - s.start_time))) as avg_time
        FROM user_analytics a
        LEFT JOIN user_sessions s ON a.session_id = s.session_id
        WHERE a.timestamp >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(a.timestamp)
        ORDER BY date
      `,
      
      // Comportamento do usuário (tipos de eventos)
      userBehavior: `
        SELECT 
          event_type,
          COUNT(*) as count,
          (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_analytics WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days')) as percentage
        FROM user_analytics 
        WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY event_type
        ORDER BY count DESC
      `
    };

    const results = {};
    
    for (const [key, query] of Object.entries(queries)) {
      const result = await pool.query(query);
      results[key] = result.rows;
    }

    // Calcular bounce rate (usuários que fizeram apenas 1 evento)
    const bounceRateQuery = `
      SELECT 
        (COUNT(CASE WHEN event_count = 1 THEN 1 END) * 100.0 / COUNT(*)) as bounce_rate
      FROM (
        SELECT user_id, COUNT(*) as event_count
        FROM user_analytics 
        WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
          AND user_id IS NOT NULL
        GROUP BY user_id
      ) user_events
    `;
    const bounceRateResult = await pool.query(bounceRateQuery);
    const bounceRate = bounceRateResult.rows[0]?.bounce_rate || 0;

    return {
      summary: {
        totalUsers: parseInt(results.totalUsers[0]?.count || 0),
        totalSessions: parseInt(results.activeSessions[0]?.count || 0),
        totalEvents: parseInt(results.eventsToday[0]?.count || 0),
        avgSessionTime: Math.round(results.avgSessionTime[0]?.avg_seconds || 0),
        bounceRate: parseFloat(bounceRate) / 100,
        newUsers: parseInt(results.totalUsers[0]?.count || 0), // Simplificado por enquanto
        returningUsers: 0 // Implementar diferenciação entre novos/retornando
      },
      timeSeriesData: results.timeSeriesData.map(row => ({
        date: row.date,
        users: parseInt(row.users || 0),
        sessions: parseInt(row.sessions || 0),
        events: parseInt(row.events || 0),
        avgTime: Math.round(row.avg_time || 0)
      })),
      topPages: results.topPages.map(page => ({
        page: page.page_url,
        views: parseInt(page.visits),
        avgTime: 0, // Simplificado por enquanto
        bounceRate: 0 // Calcular por página se necessário
      })),
      userBehavior: results.userBehavior.map(behavior => ({
        eventType: behavior.event_type,
        count: parseInt(behavior.count),
        percentage: parseFloat(behavior.percentage) / 100
      })),
      deviceStats: results.topDevices.map(device => ({
        device: device.device_type,
        browser: 'N/A',
        os: 'N/A',
        count: parseInt(device.count)
      })),
      recentActivity: [], // Implementar se necessário
      searchMetrics: {
        totalSearches: 0,
        avgResultsCount: 0,
        noResultsRate: 0,
        topQueries: []
      },
      reportMetrics: {
        totalReports: 0,
        avgGenerationTime: 0,
        topReportTypes: []
      }
    };
  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    throw error;
  }
}

// Função para obter dados de performance
async function getPerformanceMetrics() {
  try {
    const query = `
      SELECT 
        AVG(CAST(event_data->>'loadTime' AS NUMERIC)) as avg_load_time,
        AVG(CAST(event_data->>'renderTime' AS NUMERIC)) as avg_render_time,
        COUNT(*) as total_measurements
      FROM user_analytics 
      WHERE event_type = 'performance' 
        AND event_data->>'loadTime' IS NOT NULL
        AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
    `;

    const result = await pool.query(query);
    return result.rows[0] || {
      avg_load_time: 0,
      avg_render_time: 0,
      total_measurements: 0
    };
  } catch (error) {
    console.error('Erro ao obter métricas de performance:', error);
    throw error;
  }
}

// Função auxiliar para analisar user agent
function parseUserAgent(userAgent) {
  const result = {
    browser: 'Unknown',
    os: 'Unknown',
    deviceType: 'desktop'
  };

  if (!userAgent) return result;

  // Detectar browser
  if (userAgent.includes('Chrome')) result.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
  else if (userAgent.includes('Safari')) result.browser = 'Safari';
  else if (userAgent.includes('Edge')) result.browser = 'Edge';
  else if (userAgent.includes('Opera')) result.browser = 'Opera';

  // Detectar OS
  if (userAgent.includes('Windows')) result.os = 'Windows';
  else if (userAgent.includes('Mac')) result.os = 'macOS';
  else if (userAgent.includes('Linux')) result.os = 'Linux';
  else if (userAgent.includes('Android')) result.os = 'Android';
  else if (userAgent.includes('iOS')) result.os = 'iOS';

  // Detectar tipo de dispositivo
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    result.deviceType = 'mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    result.deviceType = 'tablet';
  }

  return result;
}

module.exports = {
  trackEvent,
  getDashboardMetrics,
  getPerformanceMetrics,
  updateUserSession,
  updateSessionActivity
};
