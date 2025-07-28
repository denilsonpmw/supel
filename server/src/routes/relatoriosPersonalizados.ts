import express from 'express';

import * as relatoriosPersonalizadosController from '../controllers/relatoriosPersonalizadosController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Todas as rotas exigem autenticação
router.get('/', authenticateToken, relatoriosPersonalizadosController.listar);
router.post('/', authenticateToken, relatoriosPersonalizadosController.criar);
router.put('/:id', authenticateToken, relatoriosPersonalizadosController.editar);
router.delete('/:id', authenticateToken, relatoriosPersonalizadosController.excluir);

export default router;
