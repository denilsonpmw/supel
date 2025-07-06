import { Router } from 'express';
import {
  listarEquipeApoio,
  buscarMembroEquipe,
  criarMembroEquipe,
  atualizarMembroEquipe,
  excluirMembroEquipe,
  estatisticasEquipeApoio
} from '../controllers/equipeApoioController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Rotas CRUD
router.get('/', listarEquipeApoio);           // GET /api/equipe-apoio
router.get('/:id', buscarMembroEquipe);       // GET /api/equipe-apoio/:id
router.post('/', criarMembroEquipe);          // POST /api/equipe-apoio
router.put('/:id', atualizarMembroEquipe);    // PUT /api/equipe-apoio/:id
router.delete('/:id', excluirMembroEquipe);   // DELETE /api/equipe-apoio/:id

// Rota de estatísticas
router.get('/:id/stats', estatisticasEquipeApoio); // GET /api/equipe-apoio/:id/stats

export default router; 