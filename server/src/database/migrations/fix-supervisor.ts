import pool from '../connection';

async function fix() {
  try {
    console.log('🛠️ Corrigindo restrição de perfil (supervisor)...');
    
    // Remover a constraint antiga
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_perfil_check');
    
    // Adicionar a nova constraint com o perfil supervisor
    await pool.query("ALTER TABLE users ADD CONSTRAINT users_perfil_check CHECK (perfil IN ('admin', 'supervisor', 'usuario', 'visualizador', 'painel', 'publico'))");
    
    console.log('✅ Sucesso! O perfil supervisor agora é aceito pelo banco de dados local.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao aplicar correção:', error.message);
    process.exit(1);
  }
}

fix();
