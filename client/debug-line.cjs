const fs = require('fs');

const file = 'src/pages/admin/ProcessosPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Debug para ver a linha exata
const lines = content.split('\n');
for (let i = 1140; i < 1146; i++) {
  console.log(`Linha ${i + 1}: "${lines[i]}"`);
}

// Substituir linha específica
const targetLine = "    const limpo = value.replace(/[^ -0-9\\/]/g, '');";
const newLine = "    const limpo = value.replace(/[^ 0-9/]/g, '');";

content = content.replace(targetLine, newLine);

fs.writeFileSync(file, content, 'utf8');
console.log('Arquivo atualizado!');
