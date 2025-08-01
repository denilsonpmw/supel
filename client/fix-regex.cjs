const fs = require('fs');

const file = 'src/pages/admin/ProcessosPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Substituir a linha problemática
content = content.replace(
  'const limpo = value.replace(/[^ -0-9\\/]/g, \'\');',
  'const limpo = value.replace(/[^ 0-9/]/g, \'\');'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Arquivo corrigido!');
