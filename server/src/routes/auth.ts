import { Router } from 'express';
import { 
  emailLogin, 
  googleLogin, 
  requestAccess, 
  verifyToken, 
  verifyAndRefreshToken,
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
router.post('/logout', logout); // Logout deve funcionar sempre, mesmo sem token válido
router.get('/verify', authenticateToken, verifyAndRefreshToken);
router.post('/alterar-senha', authenticateToken, alterarSenha);

export default router; 