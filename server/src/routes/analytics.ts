import express, { Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';

const router = express.Router();

// Importar dinamicamente o serviço (já que está em .js)
const AnalyticsService = require('../services/analyticsService');

// Middleware para extrair informações do request
const extractRequestInfo = (req: Request) => {
  return {
    userAgent: req.get('User-Agent') || '',
    ipAddress: req.ip || req.connection.remoteAddress,
    referrer: req.get('Referer') || '',
  };
};

// 📊 Rota para registrar evento de analytics
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const requestInfo = extractRequestInfo(req);
    
    const eventData = {
      userId: req.user.id,
      sessionId: req.body.sessionId || req.sessionID,
      eventType: req.body.eventType,
      eventCategory: req.body.eventCategory,
      eventAction: req.body.eventAction,
      eventLabel: req.body.eventLabel,
      pageUrl: req.body.pageUrl,
      pageTitle: req.body.pageTitle,
      eventData: req.body.eventData || {},
      pageLoadTime: req.body.pageLoadTime,
      timeOnPage: req.body.timeOnPage,
      ...requestInfo
    };

    // Validações básicas
    if (!eventData.eventType || !eventData.eventCategory || !eventData.eventAction) {
      return res.status(400).json({
        error: 'eventType, eventCategory e eventAction são obrigatórios'
      });
    }

    const result = await AnalyticsService.trackEvent(eventData);
    
    res.status(201).json({
      success: true,
      eventId: result.id,
      message: 'Evento registrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registrar evento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📝 Rota para registrar analytics de relatório
router.post('/track/report', authenticateToken, async (req, res) => {
  try {
    const reportData = {
      userId: req.user.id,
      sessionId: req.body.sessionId || req.sessionID,
      reportType: req.body.reportType,
      reportFormat: req.body.reportFormat,
      filtersUsed: req.body.filtersUsed || {},
      totalRecords: req.body.totalRecords,
      generationTime: req.body.generationTime,
      fileSize: req.body.fileSize
    };

    // Validações
    if (!reportData.reportType || !reportData.reportFormat) {
      return res.status(400).json({
        error: 'reportType e reportFormat são obrigatórios'
      });
    }

    const result = await AnalyticsService.trackReport(reportData);
    
    // Também registrar como evento geral
    await AnalyticsService.trackEvent({
      userId: req.user.id,
      sessionId: reportData.sessionId,
      eventType: 'report_generated',
      eventCategory: 'report',
      eventAction: 'generate',
      eventLabel: `${reportData.reportType}_${reportData.reportFormat}`,
      eventData: {
        reportType: reportData.reportType,
        recordsCount: reportData.totalRecords,
        generationTime: reportData.generationTime
      },
      ...extractRequestInfo(req)
    });
    
    res.status(201).json({
      success: true,
      reportAnalyticsId: result.rows[0].id,
      message: 'Analytics de relatório registrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registrar analytics de relatório:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔍 Rota para registrar analytics de pesquisa
router.post('/track/search', authenticateToken, async (req, res) => {
  try {
    const searchData = {
      userId: req.user.id,
      sessionId: req.body.sessionId || req.sessionID,
      searchQuery: req.body.searchQuery,
      searchContext: req.body.searchContext,
      resultsCount: req.body.resultsCount,
      searchTime: req.body.searchTime,
      clickedResultPosition: req.body.clickedResultPosition,
      noResults: req.body.noResults || false
    };

    // Validações
    if (!searchData.searchQuery || !searchData.searchContext) {
      return res.status(400).json({
        error: 'searchQuery e searchContext são obrigatórios'
      });
    }

    const result = await AnalyticsService.trackSearch(searchData);
    
    // Também registrar como evento geral
    await AnalyticsService.trackEvent({
      userId: req.user.id,
      sessionId: searchData.sessionId,
      eventType: 'search',
      eventCategory: 'search',
      eventAction: 'perform',
      eventLabel: searchData.searchContext,
      eventData: {
        query: searchData.searchQuery,
        resultsCount: searchData.resultsCount,
        searchTime: searchData.searchTime
      },
      ...extractRequestInfo(req)
    });
    
    res.status(201).json({
      success: true,
      searchAnalyticsId: result.rows[0].id,
      message: 'Analytics de pesquisa registrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registrar analytics de pesquisa:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔚 Rota para finalizar sessão
router.post('/session/end', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.body.sessionId || req.sessionID;
    
    await AnalyticsService.endSession(sessionId);
    
    res.json({
      success: true,
      message: 'Sessão finalizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao finalizar sessão:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// 📈 ROTAS ADMINISTRATIVAS (requerem privilégios de admin)

// Dashboard de métricas gerais
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const timeRange = (req.query.timeRange as string) || '7d';
    
    const metrics = await AnalyticsService.getDashboardMetrics(timeRange);
    
    res.json({
      success: true,
      data: metrics,
      timeRange
    });
  } catch (error) {
    console.error('Erro ao obter métricas do dashboard:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Analytics de usuário específico
router.get('/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const timeRange = (req.query.timeRange as string) || '30d';
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'ID do usuário inválido'
      });
    }
    
    const analytics = await AnalyticsService.getUserAnalytics(userId, timeRange);
    
    res.json({
      success: true,
      data: analytics.rows,
      userId,
      timeRange
    });
  } catch (error) {
    console.error('Erro ao obter analytics do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Exportar dados de analytics (CSV)
router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const timeRange = (req.query.timeRange as string) || '30d';
    const format = (req.query.format as string) || 'json';
    
    const metrics = await AnalyticsService.getDashboardMetrics(timeRange);
    
    if (format === 'csv') {
      // Implementar exportação CSV se necessário
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
      
      // Converter para CSV (implementação básica)
      const csvData = JSON.stringify(metrics);
      res.send(csvData);
    } else {
      res.json({
        success: true,
        data: metrics,
        exportedAt: new Date().toISOString(),
        timeRange
      });
    }
  } catch (error) {
    console.error('Erro ao exportar analytics:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para agregação manual de métricas (útil para testes)
router.post('/aggregate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await AnalyticsService.aggregateDailyMetrics();
    
    res.json({
      success: true,
      message: 'Métricas agregadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao agregar métricas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Health check da API de analytics
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Analytics API',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
