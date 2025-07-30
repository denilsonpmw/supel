import { Router } from 'express';
import {
  listarSituacoes,
  buscarSituacao,
  criarSituacao,
  atualizarSituacao,
  excluirSituacao,
  estatisticasSituacao,
  listarTodasSituacoes
} from '../controllers/situacoesController';
import { authenticateToken } from '../middleware/auth';
import { invalidateCache } from '../middleware/cache';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Rota para auditoria: todas as situações sem filtro
router.get('/todas', listarTodasSituacoes); // GET /api/situacoes/todas

// Rotas CRUD
router.get('/', listarSituacoes);           // GET /api/situacoes
router.get('/:id', buscarSituacao);         // GET /api/situacoes/:id
router.post('/', invalidateCache('/dashboard'), criarSituacao);            // POST /api/situacoes
router.put('/:id', invalidateCache('/dashboard'), atualizarSituacao);      // PUT /api/situacoes/:id
router.delete('/:id', invalidateCache('/dashboard'), excluirSituacao);     // DELETE /api/situacoes/:id

// Rota de estatísticas
router.get('/:id/stats', estatisticasSituacao); // GET /api/situacoes/:id/stats

export default router; 