import { Router } from 'express';
import { authenticateToken, requirePageAccess, applyUserFilters } from '../middleware/auth';
import {
  exportarRelatorioGeralExcel,
  exportarRelatorioGeralPDF
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

// Exportar relatório geral em PDF
router.get('/relatorio-geral/pdf', exportarRelatorioGeralPDF);

export default router; 