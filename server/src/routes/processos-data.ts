import { Router } from 'express';
import { getCollectedData, getCollectedDataStats, syncPcpData, getSyncStatus } from '../controllers/processosDataController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// POST /api/processos-data/sync - Sincronizar dados do PCP
router.post('/sync', syncPcpData);

// GET /api/processos-data/sync-status - Obter status da sincronização
router.get('/sync-status', getSyncStatus);

// GET /api/processos-data/collected-data - Obter dados de processos do arquivo JSON
router.get('/collected-data', getCollectedData);

// GET /api/processos-data/stats - Obter estatísticas dos dados
router.get('/stats', getCollectedDataStats);

export default router;
