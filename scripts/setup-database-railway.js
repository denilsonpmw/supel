const { execSync } = require('child_process');

console.log('🗄️  Configurando banco de dados no Railway...');

// Verificar se as variáveis de ambiente do banco estão configuradas
const requiredDbVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredDbVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variáveis de ambiente do banco não configuradas:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.log('\n💡 Configure essas variáveis no Railway Dashboard');
  console.log('   ou use o arquivo railway.env.example como referência');
  process.exit(1);
}

console.log('✅ Variáveis de ambiente do banco configuradas');

// Executar migrações
console.log('🔄 Executando migrações...');
try {
  execSync('npm run migrate', { stdio: 'inherit' });
  console.log('✅ Migrações executadas com sucesso');
} catch (error) {
  console.error('❌ Erro ao executar migrações');
  console.log('💡 Verifique se o banco está acessível');
  process.exit(1);
}

// Executar seeds (opcional)
console.log('🌱 Executando seeds...');
try {
  execSync('npm run seed', { stdio: 'inherit' });
  console.log('✅ Seeds executados com sucesso');
} catch (error) {
  console.warn('⚠️  Erro ao executar seeds (pode ser normal se já existem dados)');
}

console.log('🎉 Banco de dados configurado com sucesso!');
console.log('📊 Tabelas criadas e dados iniciais inseridos');
console.log('🚀 Sistema pronto para uso'); 