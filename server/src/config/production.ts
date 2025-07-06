export const productionConfig = {
  // Configurações do servidor
  port: process.env.PORT || 3001,
  nodeEnv: 'production',
  
  // Configurações de CORS para produção
  cors: {
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Configurações de segurança
  security: {
    helmet: {
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https:"]
        }
      }
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // máximo 100 requests por IP
    }
  },
  
  // Configurações de upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    uploadDir: process.env.UPLOAD_DIR || 'uploads'
  },
  
  // Configurações de logs
  logging: {
    level: 'info',
    format: 'combined'
  }
}; 