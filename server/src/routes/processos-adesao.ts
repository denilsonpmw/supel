import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAdesoes,
  getAdesaoById,
  createAdesao,
  updateAdesao,
  deleteAdesao
} from '../controllers/processosAdesaoController';

const router = Router();

// Middleware de autenticação e controle de acesso
router.use(authenticateToken);
// Se "adesoes" for gerida como uma página separada nas permissões, certifique-se de que o usuário possui acesso
// Utilizando o middleware se disponível ou apenas authenticateToken. Ajuste se necessitar requirePageAccess('adesoes').

// Listar todas as adesões ou filtrar via requisição GET
router.get('/', getAdesoes);

// Obter adesão por ID
router.get('/:id', getAdesaoById);

// Criar nova adesão
router.post('/', createAdesao);

// Atualizar adesão
router.put('/:id', updateAdesao);

// Deletar adesão
router.delete('/:id', deleteAdesao);

export default router;
