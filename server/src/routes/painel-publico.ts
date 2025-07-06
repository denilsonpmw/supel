import { Router } from 'express';
import {
  getProcessosSemanaAtual,
  getProcessosSemanaPassada,
  getProcessosProximaSemana,
  getDadosPainelPublico
} from '../controllers/painelPublicoController';

const router = Router();

// Rotas PÚBLICAS - sem autenticação necessária

// Obter processos da semana atual
router.get('/semana-atual', getProcessosSemanaAtual);

// Obter processos da semana passada  
router.get('/semana-passada', getProcessosSemanaPassada);

// Obter processos da próxima semana
router.get('/proxima-semana', getProcessosProximaSemana);

// Obter todos os dados do painel de uma vez
router.get('/dados-completos', getDadosPainelPublico);

export default router; 