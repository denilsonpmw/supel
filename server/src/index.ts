import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Configurar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Habilitar CORS para todas as rotas e métodos, antes de tudo
app.use(cors({
  origin: '*',
  credentials: true,
}));

// Helmet com crossOriginResourcePolicy desabilitado para não conflitar com CORS
app.use(helmet({ crossOriginResourcePolicy: false }));

// Importar rotas
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import profileRoutes from './routes/profile';
import processRoutes from './routes/processes';
import unidadeGestoraRoutes from './routes/unidades-gestoras';
import responsavelRoutes from './routes/responsaveis';
import equipeApoioRoutes from './routes/equipe-apoio';
import modalidadeRoutes from './routes/modalidades';
import situacaoRoutes from './routes/situacoes';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import uploadRoutes from './routes/upload';
import painelPublicoRoutes from './routes/painel-publico';
import exportRoutes from './routes/export';
import auditoriaRoutes from './routes/auditoria';

// Importar middlewares
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { auditMiddleware } from './middleware/audit';
import { pwaMiddleware } from './middleware/pwa';

// Middlewares globais
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Rate limiting (desabilitado para desenvolvimento)
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 100, // máximo 100 requests por IP
//   message: 'Muitas tentativas de acesso. Tente novamente em 15 minutos.',
// });
// app.use(limiter);

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Aplicar middleware PWA para todos os arquivos estáticos
app.use(pwaMiddleware);

// Rotas da API
console.log('🔄 Registrando rotas da API...');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);

// Aplicar middleware de auditoria nas rotas que modificam dados
app.use('/api/processes', auditMiddleware, processRoutes);
app.use('/api/unidades-gestoras', auditMiddleware, unidadeGestoraRoutes);
app.use('/api/responsaveis', auditMiddleware, responsavelRoutes);
app.use('/api/equipe-apoio', auditMiddleware, equipeApoioRoutes);
app.use('/api/modalidades', auditMiddleware, modalidadeRoutes);
app.use('/api/situacoes', auditMiddleware, situacaoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Debug: Log de registro da rota de relatórios
console.log('🔄 Registrando rota /api/reports');
app.use('/api/reports', reportRoutes);

app.use('/api/upload', uploadRoutes);
app.use('/api/painel-publico', painelPublicoRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    routes: {
      auth: true,
      users: true,
      profile: true,
      processes: true,
      reports: true,
      dashboard: true
    }
  });
});

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
  
  // Servir index.html para todas as rotas não-API (SPA)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    }
  });
}

// Middlewares de erro
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ Rotas registradas:');
  console.log('  - /api/auth');
  console.log('  - /api/users');
  console.log('  - /api/profile');
  console.log('  - /api/processes');
  console.log('  - /api/reports');
  console.log('  - /api/dashboard');
  // ... outras rotas ...
});

export default app; 