const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const ICONS_DIR = path.join(process.cwd(), 'client', 'public', 'icons');
const BACKUP_DIR = path.join(ICONS_DIR, 'backup');

async function generateIcons(logoPath = null) {
  try {
    // Define o caminho da logo
    const inputLogo = logoPath || path.join(ICONS_DIR, 'logo-1024.png');
    
    // Verifica se a logo existe
    if (!fs.existsSync(inputLogo)) {
      console.error('❌ Logo não encontrada em:', inputLogo);
      console.log('💡 Coloque sua logo 1024x1024 em: client/public/icons/logo-1024.png');
      process.exit(1);
    }

    console.log('🎨 Iniciando geração de ícones...');
    console.log('📂 Logo encontrada:', inputLogo);

    // Criar pasta de backup se não existir
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Fazer backup dos ícones existentes
    console.log('💾 Fazendo backup dos ícones existentes...');
    let backupCount = 0;
    
    for (const size of ICON_SIZES) {
      const iconPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
      const backupPath = path.join(BACKUP_DIR, `icon-${size}x${size}-backup-${new Date().toISOString().slice(0, 10)}.png`);
      
      if (fs.existsSync(iconPath)) {
        try {
          fs.copyFileSync(iconPath, backupPath);
          backupCount++;
          console.log(`   ✅ Backup: icon-${size}x${size}.png`);
        } catch (error) {
          console.warn(`   ⚠️ Falha no backup: icon-${size}x${size}.png`);
        }
      }
    }

    if (backupCount > 0) {
      console.log(`💾 ${backupCount} ícones salvos em backup`);
    } else {
      console.log('📝 Nenhum ícone anterior encontrado');
    }

    // Gerar novos ícones
    console.log('🔄 Gerando novos ícones...');
    let successCount = 0;

    for (const size of ICON_SIZES) {
      try {
        const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
        
        await sharp(inputLogo)
          .resize(size, size, {
            kernel: sharp.kernel.lanczos3,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({
            quality: 100,
            compressionLevel: 6,
            adaptiveFiltering: false,
            force: true
          })
          .toFile(outputPath);

        console.log(`   ✅ Gerado: icon-${size}x${size}.png`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Erro ao gerar icon-${size}x${size}.png:`, error.message);
      }
    }

    // Relatório final
    console.log('\n🎉 Geração de ícones concluída!');
    console.log(`✅ ${successCount}/${ICON_SIZES.length} ícones gerados com sucesso`);
    
    if (backupCount > 0) {
      console.log(`💾 Backup dos ícones anteriores em: ${BACKUP_DIR}`);
    }

    console.log('\n📋 Próximos passos:');
    console.log('1. Verifique os novos ícones em: client/public/icons/');
    console.log('2. Execute: .\\scripts\\version-sw.ps1 minor "Atualização da logomarca e ícones do PWA"');
    console.log('3. Se estiver satisfeito, você pode limpar o backup posteriormente');

    // Instruções para limpeza manual
    console.log('\n🧹 Para limpar backups antigos (opcional):');
    console.log(`   Remove-Item "${BACKUP_DIR}" -Recurse -Force`);

  } catch (error) {
    console.error('❌ Erro durante a geração:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const customLogo = process.argv[2];
  generateIcons(customLogo);
}

module.exports = generateIcons;
