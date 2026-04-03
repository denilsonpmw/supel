import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requirePageAccess, applyUserFilters } from '../middleware/auth';
import {
  getRelatoriosDisponiveis,
  gerarRelatorioProcessos,
  gerarRelatorioEconomicidade,
  gerarRelatorioProcessosCriticos,
  getOpcoesRelatorios
} from '../controllers/relatoriosController';

// Definir interface para request com user
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    perfil: string;
    paginas_permitidas?: string[];
  };
}

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authenticateToken);

// Verificar acesso à página de relatórios
router.use(requirePageAccess('relatorios'));

// Aplicar filtros automáticos por responsável (exceto para admins)
router.use(applyUserFilters);

// Log de debug para cada rota
router.use((req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthRequest).user;
  // console.log('📊 Acessando rota de relatórios:', {
  //   method: req.method,
  //   url: req.url,
  //   query: req.query,
  //   user: user?.email,
  //   userResponsavelId: (req as any).userResponsavelId
  // });
  next();
});

// Obter lista de relatórios disponíveis
router.get('/', getRelatoriosDisponiveis);

// Obter opções para filtros
router.get('/opcoes', getOpcoesRelatorios);

// Gerar relatórios específicos
router.get('/processos', gerarRelatorioProcessos);
router.get('/economicidade', gerarRelatorioEconomicidade);
router.get('/criticos', gerarRelatorioProcessosCriticos);

export default router; 