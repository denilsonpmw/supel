import { Router, Request, Response } from 'express';
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

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    nome: string;
    perfil: string;
    paginas_permitidas?: string[];
    acoes_permitidas?: string[];
    responsavel_id?: number;
    ativo: boolean;
  };
}

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
router.get('/token', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  // Extrai o token do header que foi gerado pelo middleware
  const authHeader = authReq.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token && authReq.user) {
    res.json({
      token,
      user: {
        id: authReq.user.id,
        email: authReq.user.email,
        nome: authReq.user.nome,
        perfil: authReq.user.perfil,
        primeiro_nome: authReq.user.nome?.split(' ')[0] || authReq.user.nome
      }
    });
  } else {
    res.status(401).json({ error: 'Token não disponível' });
  }
});
router.post('/alterar-senha', authenticateToken, alterarSenha);

export default router; 