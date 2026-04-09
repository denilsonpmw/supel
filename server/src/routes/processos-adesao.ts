import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import {
  getAdesoes,
  getAdesaoById,
  createAdesao,
  updateAdesao,
  deleteAdesao,
  importarAdesaoCSV
} from '../controllers/processosAdesaoController';

const router = Router();

// Configurar multer para upload de CSV em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV são permitidos'));
    }
  }
});

// Middleware de autenticação
router.use(authenticateToken);

// Listar todas as adesões
router.get('/', getAdesoes);

// Importar via CSV — deve vir ANTES das rotas com :id
router.post('/import-csv', upload.single('file') as any, importarAdesaoCSV);

// Obter adesão por ID
router.get('/:id', getAdesaoById);

// Criar nova adesão
router.post('/', createAdesao);

// Atualizar adesão
router.put('/:id', updateAdesao);

// Deletar adesão
router.delete('/:id', deleteAdesao);

export default router;
