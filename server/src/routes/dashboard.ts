import { Router } from 'express';
import { 
  getDashboardMetrics, 
  getHeatmapData, 
  getModalidadeDistribution,
  getModalidadeDistributionValores,
  getProcessEvolution,
  getProcessosCriticos,
  getProcessosAndamento,
  getOutliersDetalhes
} from '../controllers/dashboardController';
import { authenticateToken, requirePageAccess, applyUserFilters } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Todas as rotas do dashboard precisam de autenticação
router.use(authenticateToken);

// Verificar acesso à página de dashboard
router.use(requirePageAccess('dashboard'));

// Aplicar filtros automáticos por responsável (exceto para admins)
router.use(applyUserFilters);

// Métricas principais do dashboard (cache 5 minutos)
router.get('/metrics', cacheMiddleware(300), getDashboardMetrics);

// Dados para o mapa de calor das situações (cache 10 minutos)
router.get('/heatmap', cacheMiddleware(600), getHeatmapData);

// Distribuição por modalidade (cache 15 minutos)
router.get('/modalidades', cacheMiddleware(900), getModalidadeDistribution);

// Distribuição de valores por modalidade (cache 15 minutos)
router.get('/modalidades-valores', cacheMiddleware(900), getModalidadeDistributionValores);

// Evolução temporal dos processos (cache 30 minutos)
router.get('/evolution', cacheMiddleware(1800), getProcessEvolution);

// Processos críticos (cache 5 minutos - mais crítico)
router.get('/criticos', cacheMiddleware(300), getProcessosCriticos);

// Processos em andamento (cache 5 minutos)
router.get('/andamento', cacheMiddleware(300), getProcessosAndamento);

// Detalhes dos outliers ocultos (cache 5 minutos)
router.get('/outliers-detalhes', cacheMiddleware(300), getOutliersDetalhes);

export default router; 