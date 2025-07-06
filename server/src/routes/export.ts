import { Router } from 'express';
import { authenticateToken, requirePageAccess, applyUserFilters } from '../middleware/auth';
import {
  exportarRelatorioGeralExcel,
  exportarEstatisticasExcel
} from '../controllers/exportController';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authenticateToken);

// Verificar acesso à página de relatórios
router.use(requirePageAccess('relatorios'));

// Aplicar filtros automáticos por responsável (exceto para admins)
router.use(applyUserFilters);

// Exportar relatório geral em Excel
router.get('/relatorio-geral/excel', exportarRelatorioGeralExcel);

// Exportar estatísticas em Excel
router.get('/estatisticas/excel', exportarEstatisticasExcel);

export default router; 