import { Router } from 'express';
import { authenticateToken, requirePageAccess, applyUserFilters } from '../middleware/auth';
import { jwtOrApiKey } from '../middleware/apiKeyAuth';
import { invalidateCache, cacheMiddleware } from '../middleware/cache';
import { auditMiddleware } from '../middleware/audit';
import {
  listarProcessos,
  buscarProcesso,
  criarProcesso,
  atualizarProcesso,
  excluirProcesso,
  estatisticasProcesso,
  estatisticasProcessoIndividual,
  importarProcessosCSV,
  checkProcessEditPermission
} from '../controllers/processosController';
import multer from 'multer';

const router = Router();

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV são permitidos'));
    }
  }
});

// GET / - Permitir JWT ou API key
// Outras rotas exigem autenticação JWT normal
router.get('/', jwtOrApiKey, requirePageAccess('processos'), applyUserFilters, cacheMiddleware(30), listarProcessos);

// Todas as demais rotas precisam de autenticação JWT
router.use(authenticateToken);

// Verificar acesso à página de processos
router.use(requirePageAccess('processos'));

// Aplicar filtros automáticos por responsável (exceto para admins)
router.use(applyUserFilters);

// Criar novo processo (invalidar cache dashboard)
router.post('/', auditMiddleware, invalidateCache('/dashboard'), criarProcesso);

// Estatísticas gerais dos processos
router.get('/stats/geral', estatisticasProcesso);

// Nova rota para importação CSV - DEVE VIR ANTES DAS ROTAS COM :id
router.post('/import-csv', auditMiddleware, upload.single('file'), importarProcessosCSV);

// Verificar se usuário pode editar processo específico
router.get('/:id/can-edit', checkProcessEditPermission);

// Buscar processo por ID
router.get('/:id', buscarProcesso);

// Atualizar processo (invalidar cache dashboard e processos)
router.put('/:id', auditMiddleware, invalidateCache('/dashboard'), invalidateCache('/processes'), atualizarProcesso);

// Excluir processo (invalidar cache dashboard)
router.delete('/:id', auditMiddleware, invalidateCache('/dashboard'), excluirProcesso);

// Estatísticas de um processo específico
router.get('/:id/stats', estatisticasProcessoIndividual);

export default router; 