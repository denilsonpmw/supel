import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  listarLogsAuditoria,
  detalhesLogAuditoria,
  estatisticasAuditoria,
  exportarLogsAuditoria
} from '../controllers/auditoriaController';

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Listar logs de auditoria com filtros
router.get('/', listarLogsAuditoria);

// Estatísticas de auditoria
router.get('/estatisticas', estatisticasAuditoria);

// Exportar logs de auditoria
router.get('/export', exportarLogsAuditoria);

// Detalhes de um log específico
router.get('/:id', detalhesLogAuditoria);

export default router; 