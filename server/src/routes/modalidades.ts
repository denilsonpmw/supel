import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getModalidades,
  getModalidadeById,
  createModalidade,
  updateModalidade,
  deleteModalidade,
  getModalidadeStats
} from '../controllers/modalidadesController';

const router = Router();
router.use(authenticateToken);

// Listar todas as modalidades (com filtros opcionais)
router.get('/', getModalidades);

// Obter estatísticas de uma modalidade específica
router.get('/:id/stats', getModalidadeStats);

// Obter modalidade por ID
router.get('/:id', getModalidadeById);

// Criar nova modalidade
router.post('/', createModalidade);

// Atualizar modalidade
router.put('/:id', updateModalidade);

// Deletar modalidade
router.delete('/:id', deleteModalidade);

export default router; 