import { Router } from 'express';
import { authenticateToken, requirePageAccess, requireRole } from '../middleware/auth';
import {
  listarUsuarios,
  buscarUsuario,
  criarUsuario,
  atualizarUsuario,
  excluirUsuario,
  estatisticasUsuarios,
  sincronizarComResponsaveis,
  gerarTokenResetAdmin
} from '../controllers/usersController';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authenticateToken);

// Verificar acesso à página de usuários
router.use(requirePageAccess('usuarios'));

// Apenas administradores podem gerenciar usuários
router.use(requireRole(['admin']));

// Listar usuários
router.get('/', listarUsuarios);

// Estatísticas dos usuários
router.get('/stats', estatisticasUsuarios);

// Sincronizar usuários com responsáveis
router.post('/sync-responsaveis', sincronizarComResponsaveis);

// Gerar token de redefinição de senha para um usuário
router.post('/:id/gerar-token-reset', gerarTokenResetAdmin);

// Buscar usuário por ID
router.get('/:id', buscarUsuario);

// Criar novo usuário
router.post('/', criarUsuario);

// Atualizar usuário
router.put('/:id', atualizarUsuario);

// Excluir usuário
router.delete('/:id', excluirUsuario);

export default router; 