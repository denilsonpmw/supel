import { Router } from 'express';
import { getIndicadoresGerenciais } from '../controllers/indicadoresController';
import { authenticateToken, requirePageAccess, applyUserFilters } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authenticateToken);

// Verificar acesso à página de indicadores gerenciais
router.use(requirePageAccess('indicadores-gerenciais'));

// Aplicar filtros automáticos por responsável (exceto para admins)
router.use(applyUserFilters);

// Endpoint principal para indicadores gerenciais (cache 15 minutos)
router.get('/', cacheMiddleware(900), getIndicadoresGerenciais);

export default router;
