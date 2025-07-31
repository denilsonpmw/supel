const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(process.cwd(), 'client', 'public', 'screenshots');
const REQUIRED_SCREENSHOTS = [
  'login-screen.png',
  'pwa-install-button.png',
  'dashboard-overview.png',
  'dashboard-filters.png',
  'process-table.png',
  'public-panel.png',
  'process-creation.png',
  'process-modal.png',
  'process-editing.png',
  'user-management.png',
  'unit-management.png',
  'status-management.png',
  'reports-overview.png',
  'report-generation.png',
  'report-dashboard.png',
  'system-settings.png',
  'pwa-settings.png'
];

function checkScreenshots() {
  console.log('📸 Verificando capturas de tela necessárias...\n');

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    console.log('📁 Criando pasta de screenshots...');
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  let foundCount = 0;
  let missingCount = 0;

  console.log('🔍 Status das capturas:');
  
  REQUIRED_SCREENSHOTS.forEach(screenshot => {
    const filePath = path.join(SCREENSHOTS_DIR, screenshot);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`✅ ${screenshot.padEnd(25)} (${sizeKB}KB)`);
      foundCount++;
    } else {
      console.log(`❌ ${screenshot.padEnd(25)} - FALTANDO`);
      missingCount++;
    }
  });

  console.log('\n📊 Resumo:');
  console.log(`✅ Encontradas: ${foundCount}/${REQUIRED_SCREENSHOTS.length}`);
  console.log(`❌ Faltando: ${missingCount}/${REQUIRED_SCREENSHOTS.length}`);
  
  const percentage = ((foundCount / REQUIRED_SCREENSHOTS.length) * 100).toFixed(1);
  console.log(`📈 Progresso: ${percentage}%`);
  
  if (missingCount === 0) {
    console.log('\n🎉 Todas as capturas de tela estão prontas!');
    console.log('📝 O manual do usuário está visualmente completo.');
    console.log('🚀 Pronto para versionar as mudanças!');
  } else {
    console.log('\n📋 Capturas ainda necessárias:');
    REQUIRED_SCREENSHOTS.forEach(screenshot => {
      const filePath = path.join(SCREENSHOTS_DIR, screenshot);
      if (!fs.existsSync(filePath)) {
        console.log(`   • ${screenshot}`);
      }
    });
    console.log('\n💡 Consulte docs/manual/CAPTURAS_NECESSARIAS.md para detalhes.');
    console.log('📸 Após fazer as capturas, execute este script novamente.');
  }

  // Verificar se há arquivos extras na pasta
  if (fs.existsSync(SCREENSHOTS_DIR)) {
    const existingFiles = fs.readdirSync(SCREENSHOTS_DIR);
    const extraFiles = existingFiles.filter(file => 
      file.endsWith('.png') && !REQUIRED_SCREENSHOTS.includes(file)
    );
    
    if (extraFiles.length > 0) {
      console.log('\n📁 Arquivos extras encontrados:');
      extraFiles.forEach(file => {
        console.log(`   📄 ${file} (não listado no manual)`);
      });
    }
  }

  return missingCount === 0;
}

// Executar se chamado diretamente
if (require.main === module) {
  checkScreenshots();
}

module.exports = checkScreenshots;
