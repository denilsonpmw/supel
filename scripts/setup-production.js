const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando ambiente de produção...');

// Criar diretório de uploads se não existir
const uploadsDir = path.join(__dirname, '../server/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Diretório de uploads criado');
}

// Verificar variáveis de ambiente essenciais
const requiredEnvVars = [
  'DB_HOST',
  'DB_NAME', 
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Variáveis de ambiente ausentes:', missingVars.join(', '));
  console.warn('   Certifique-se de configurar essas variáveis no Railway');
} else {
  console.log('✅ Todas as variáveis de ambiente essenciais estão configuradas');
}

// Verificar se estamos em produção
if (process.env.NODE_ENV === 'production') {
  console.log('🌍 Ambiente de produção detectado');
  
  // Configurações específicas para produção
  if (!process.env.CLIENT_URL) {
    console.warn('⚠️  CLIENT_URL não configurada - usando CORS aberto');
  }
  
  if (!process.env.API_URL) {
    console.warn('⚠️  API_URL não configurada - usando URL padrão');
  }
} else {
  console.log('🔧 Ambiente de desenvolvimento detectado');
}

console.log('✅ Configuração de produção concluída');
console.log('📊 Health check disponível em: /api/health');
console.log('🚀 Servidor pronto para iniciar'); 