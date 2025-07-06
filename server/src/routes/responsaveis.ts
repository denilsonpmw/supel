import { Router } from 'express';
import {
  listarResponsaveis,
  buscarResponsavel,
  criarResponsavel,
  atualizarResponsavel,
  excluirResponsavel,
  estatisticasResponsavel,
  analisePorResponsavel,
  distribuicaoModalidadesPorResponsavel,
  distribuicaoModalidadesGeral,
  evolucaoMensalPorResponsavel,
  evolucaoMensalGeral
} from '../controllers/responsaveisController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Rotas de análise (devem vir antes das rotas com :id)
router.get('/analise', analisePorResponsavel);                              // GET /api/responsaveis/analise
router.get('/modalidades-geral', distribuicaoModalidadesGeral);             // GET /api/responsaveis/modalidades-geral
router.get('/evolucao-mensal-geral', evolucaoMensalGeral);                  // GET /api/responsaveis/evolucao-mensal-geral

// Rotas CRUD
router.get('/', listarResponsaveis);           // GET /api/responsaveis
router.get('/:id', buscarResponsavel);         // GET /api/responsaveis/:id
router.post('/', criarResponsavel);            // POST /api/responsaveis
router.put('/:id', atualizarResponsavel);      // PUT /api/responsaveis/:id
router.delete('/:id', excluirResponsavel);     // DELETE /api/responsaveis/:id

// Rotas de estatísticas e análise por responsável específico
router.get('/:id/stats', estatisticasResponsavel);                          // GET /api/responsaveis/:id/stats
router.get('/:id/modalidades', distribuicaoModalidadesPorResponsavel);      // GET /api/responsaveis/:id/modalidades
router.get('/:id/evolucao-mensal', evolucaoMensalPorResponsavel);           // GET /api/responsaveis/:id/evolucao-mensal

export default router; 