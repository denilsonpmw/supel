import { Router } from 'express';
import { getCollectedData, getCollectedDataStats } from '../controllers/processosDataController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// GET /api/processos-data/collected-data - Obter dados de processos do arquivo JSON
router.get('/collected-data', getCollectedData);

// GET /api/processos-data/stats - Obter estatísticas dos dados
router.get('/stats', getCollectedDataStats);

export default router;
