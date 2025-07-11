import pool from '../connection';
import { readFileSync } from 'fs';
import { join } from 'path';

const seeds = [
  '001_initial_data.sql',
  '003_processos_data.sql',
  '004_processos_mapa_calor.sql'
];

export async function runSeeds() {
  try {
    // console.log('🌱 Executando seeds do banco de dados...');
    
    for (const seedFile of seeds) {
      // console.log(`📄 Executando seed: ${seedFile}`);
      const seedPath = join(__dirname, seedFile);
      const sql = readFileSync(seedPath, 'utf8');
      await pool.query(sql);
      // console.log(`✅ Seed ${seedFile} executada com sucesso!`);
    }
    
    // console.log('🎉 Todas as seeds foram executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
      runSeeds()
      .then(() => {
        // console.log('✅ Seeds concluídas!');
        process.exit(0);
      })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
} 