import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getUnidadesGestoras,
  getUnidadeGestoraById,
  createUnidadeGestora,
  updateUnidadeGestora,
  deleteUnidadeGestora,
  getUnidadeGestoraStats
} from '../controllers/unidadesGestorasController';

const router = Router();
router.use(authenticateToken);

// Listar todas as unidades gestoras (com filtros opcionais)
router.get('/', getUnidadesGestoras);

// Obter estatísticas de uma unidade gestora específica
router.get('/:id/stats', getUnidadeGestoraStats);

// Obter unidade gestora por ID
router.get('/:id', getUnidadeGestoraById);

// Criar nova unidade gestora
router.post('/', createUnidadeGestora);

// Atualizar unidade gestora
router.put('/:id', updateUnidadeGestora);

// Deletar unidade gestora
router.delete('/:id', deleteUnidadeGestora);

export default router; 