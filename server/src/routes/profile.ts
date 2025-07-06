import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { alterarSenha } from '../controllers/usersController';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authenticateToken);

// Alterar senha do próprio usuário
router.put('/change-password', alterarSenha);

export default router; 