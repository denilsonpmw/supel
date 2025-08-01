const fs = require('fs');

const file = 'src/pages/admin/ProcessosPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Substituir especificamente linha com problema
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("value.replace(/[^ -0-9\\/]/g, '')")) {
    console.log(`Linha ${i + 1} encontrada: ${lines[i]}`);
    lines[i] = lines[i].replace("value.replace(/[^ -0-9\\/]/g, '')", "value.replace(/[^ 0-9/]/g, '')");
    console.log(`Linha ${i + 1} corrigida: ${lines[i]}`);
  }
}

content = lines.join('\n');
fs.writeFileSync(file, content, 'utf8');
console.log('Arquivo corrigido!');
