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
async function getDashboardMetrics(timeRange = '7d') {
  try {
    // Converter timeRange para dias
    const daysMap = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    const days = daysMap[timeRange] || 7;
    
    const queries = {
      // Total de usuários únicos
      totalUsers: `
        SELECT COUNT(DISTINCT user_id) as count 
        FROM user_analytics 
        WHERE user_id IS NOT NULL
          AND timestamp >= CURRENT_DATE - INTERVAL '${days} days'
      `,
      
      // Sessões ativas no período
      activeSessions: `
        SELECT COUNT(*) as count 
        FROM user_sessions 
        WHERE start_time >= CURRENT_DATE - INTERVAL '${days} days'
      `,
      
      // Eventos no período
      eventsToday: `
        SELECT COUNT(*) as count 
        FROM user_analytics 
        WHERE timestamp >= CURRENT_DATE - INTERVAL '${days} days'
      `,
      
      // Páginas mais visitadas (versão simplificada)
      topPages: `
        SELECT 
          page_url, 
          COUNT(*) as visits
        FROM user_analytics
        WHERE event_type = 'page_view' 
          AND timestamp >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY page_url 
        ORDER BY visits DESC 
        LIMIT 10
      `,
      
      // Dispositivos mais usados
      topDevices: `
        SELECT device_type, COUNT(*) as count 
        FROM user_analytics 
        WHERE timestamp >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY device_type 
        ORDER BY count DESC
      `,
      
      // Browsers mais usados
      topBrowsers: `
        SELECT browser_name, COUNT(*) as count 
        FROM user_analytics 
        WHERE timestamp >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY browser_name 
        ORDER BY count DESC 
        LIMIT 5
      `,
      
      // Tempo médio de sessão
      avgSessionTime: `
        SELECT AVG(EXTRACT(EPOCH FROM (last_activity - start_time))) as avg_seconds
        FROM user_sessions 
        WHERE start_time >= CURRENT_DATE - INTERVAL '${days} days'
          AND last_activity > start_time
      `,
      
      // Dados de série temporal
      timeSeriesData: `
        SELECT 
          DATE(a.timestamp) as date,
          COUNT(DISTINCT a.user_id) as users,
          COUNT(DISTINCT a.session_id) as sessions,
          COUNT(*) as events,
          AVG(EXTRACT(EPOCH FROM (s.last_activity - s.start_time))) as avg_time
        FROM user_analytics a
        LEFT JOIN user_sessions s ON a.session_id = s.session_id
        WHERE a.timestamp >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(a.timestamp)
        ORDER BY date
      `,
      
      // Comportamento do usuário (tipos de eventos)
      userBehavior: `
        SELECT 
          event_type,
          COUNT(*) as count,
          (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_analytics WHERE timestamp >= CURRENT_DATE - INTERVAL '${days} days')) as percentage
        FROM user_analytics 
        WHERE timestamp >= CURRENT_DATE - INTERVAL '${days} days'
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
        WHERE timestamp >= CURRENT_DATE - INTERVAL '${days} days'
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

    // Buscar métricas de pesquisa
    try {
      const searchMetricsQuery = `
        SELECT 
          COUNT(*) as total_searches,
          AVG(results_count) as avg_results,
          (COUNT(CASE WHEN no_results = true THEN 1 END) * 100.0 / COUNT(*)) as no_results_rate
        FROM search_analytics 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      `;
      const searchResult = await pool.query(searchMetricsQuery);
      const searchData = searchResult.rows[0];

      const topQueriesQuery = `
        SELECT search_query, COUNT(*) as count
        FROM search_analytics 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY search_query
        ORDER BY count DESC
        LIMIT 10
      `;
      const topQueriesResult = await pool.query(topQueriesQuery);

      dashboard.searchMetrics = {
        totalSearches: parseInt(searchData?.total_searches || 0),
        avgResultsCount: Math.round(searchData?.avg_results || 0),
        noResultsRate: parseFloat(searchData?.no_results_rate || 0) / 100,
        topQueries: topQueriesResult.rows.map(row => ({
          query: row.search_query,
          count: parseInt(row.count)
        }))
      };
    } catch (error) {
      console.error('Erro ao buscar métricas de pesquisa:', error);
    }

    // Buscar métricas de relatórios
    try {
      const reportMetricsQuery = `
        SELECT 
          COUNT(*) as total_reports,
          AVG(generation_time) as avg_generation_time
        FROM report_analytics 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      `;
      const reportResult = await pool.query(reportMetricsQuery);
      const reportData = reportResult.rows[0];

      const topReportTypesQuery = `
        SELECT report_type, report_format, COUNT(*) as count
        FROM report_analytics 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY report_type, report_format
        ORDER BY count DESC
        LIMIT 10
      `;
      const topReportTypesResult = await pool.query(topReportTypesQuery);

      dashboard.reportMetrics = {
        totalReports: parseInt(reportData?.total_reports || 0),
        avgGenerationTime: Math.round(reportData?.avg_generation_time || 0),
        topReportTypes: topReportTypesResult.rows.map(row => ({
          type: row.report_type,
          format: row.report_format,
          count: parseInt(row.count)
        }))
      };
    } catch (error) {
      console.error('Erro ao buscar métricas de relatórios:', error);
    }

    // Buscar atividade recente
    try {
      const recentActivityQuery = `
        SELECT 
          event_type,
          event_action,
          page_url,
          timestamp,
          u.nome as user_name
        FROM user_analytics ua
        LEFT JOIN users u ON ua.user_id = u.id
        WHERE ua.timestamp >= CURRENT_DATE - INTERVAL '1 days'
        ORDER BY ua.timestamp DESC
        LIMIT 20
      `;
      const recentActivityResult = await pool.query(recentActivityQuery);

      dashboard.recentActivity = recentActivityResult.rows.map(row => ({
        eventType: row.event_type,
        action: row.event_action,
        page: row.page_url,
        timestamp: row.timestamp,
        user: row.user_name || 'Usuário anônimo'
      }));
    } catch (error) {
      console.error('Erro ao buscar atividade recente:', error);
    }

    // Atualizar páginas mais visitadas com tempo médio
    try {
      const pageTimeQuery = `
        SELECT 
          page_url,
          COUNT(*) as visits,
          AVG(CAST(event_data->>'timeOnPage' AS NUMERIC)) as avg_time
        FROM user_analytics
        WHERE event_type = 'page_view' 
          AND timestamp >= CURRENT_DATE - INTERVAL '${days} days'
          AND event_data->>'timeOnPage' IS NOT NULL
        GROUP BY page_url 
        ORDER BY visits DESC 
        LIMIT 10
      `;
      const pageTimeResult = await pool.query(pageTimeQuery);
      
      dashboard.topPages = pageTimeResult.rows.map(page => ({
        page: page.page_url,
        views: parseInt(page.visits),
        avgTime: Math.round(page.avg_time || 0),
        bounceRate: 0 // Calcular por página se necessário
      }));
    } catch (error) {
      console.error('Erro ao buscar tempo médio por página:', error);
    }

    return dashboard;
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

// Função para rastrear relatórios
async function trackReport(reportData) {
  try {
    const {
      userId,
      sessionId,
      reportType,
      reportFormat,
      filtersUsed,
      totalRecords,
      generationTime,
      fileSize
    } = reportData;

    const query = `
      INSERT INTO report_analytics (
        user_id, session_id, report_type, report_format, 
        filters_used, total_records, generation_time, file_size, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `;

    const result = await pool.query(query, [
      userId,
      sessionId,
      reportType,
      reportFormat,
      JSON.stringify(filtersUsed || {}),
      totalRecords || 0,
      generationTime || 0,
      fileSize || 0
    ]);

    return result;
  } catch (error) {
    console.error('Erro ao rastrear relatório:', error);
    throw error;
  }
}

// Função para rastrear pesquisas
async function trackSearch(searchData) {
  try {
    const {
      userId,
      sessionId,
      searchQuery,
      searchContext,
      resultsCount,
      searchTime,
      clickedResultPosition,
      noResults
    } = searchData;

    const query = `
      INSERT INTO search_analytics (
        user_id, session_id, search_query, search_context,
        results_count, search_time, clicked_result_position,
        no_results, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `;

    const result = await pool.query(query, [
      userId,
      sessionId,
      searchQuery,
      searchContext,
      resultsCount || 0,
      searchTime || 0,
      clickedResultPosition || null,
      noResults || false
    ]);

    return result;
  } catch (error) {
    console.error('Erro ao rastrear pesquisa:', error);
    throw error;
  }
}

// Função para finalizar sessão
async function endSession(sessionId) {
  try {
    if (!sessionId) return;

    const query = `
      UPDATE user_sessions 
      SET last_activity = NOW(), session_end = NOW()
      WHERE session_id = $1
    `;

    await pool.query(query, [sessionId]);
  } catch (error) {
    console.error('Erro ao finalizar sessão:', error);
    throw error;
  }
}

module.exports = {
  trackEvent,
  trackReport,
  trackSearch,
  endSession,
  getDashboardMetrics,
  getPerformanceMetrics,
  updateUserSession,
  updateSessionActivity
};
