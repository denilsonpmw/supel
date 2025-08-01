import { Router } from 'express';
import { 
  emailLogin, 
  googleLogin, 
  requestAccess, 
  verifyToken, 
  logout,
  redefinirSenha
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { definirPrimeiraSenha, alterarSenha } from '../controllers/usersController';

const router = Router();

// Rotas de autenticação abertas
router.post('/login', emailLogin);
router.post('/google-login', googleLogin);
router.post('/solicitar-acesso', requestAccess);
router.post('/esqueci-senha', redefinirSenha);
router.post('/primeiro-acesso', definirPrimeiraSenha);

// Rotas de autenticação que precisam de token
router.post('/logout', authenticateToken, logout);
router.get('/verify', authenticateToken, verifyToken);
router.post('/alterar-senha', authenticateToken, alterarSenha);

export default router; 