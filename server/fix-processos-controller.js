const fs = require("fs");
const path = require("path");

const filePath = "src/controllers/processosController.ts";
let content = fs.readFileSync(filePath, "utf8");

console.log(" Removendo consultas SQL desnecessárias...");

// Remover a consulta SQL desnecessária na função criarProcesso (linhas 443-452)
const pattern1 = /\/\/ Buscar o processo criado com relacionamentos\s*const processoCompleto = await pool\.query\(`[\s\S]*?`, \[result\.rows\[0\]\.id\]\);/;
content = content.replace(pattern1, "");

// Remover a consulta SQL desnecessária na função atualizarProcesso (linhas 575-584)
const pattern2 = /\/\/ Buscar o processo atualizado com relacionamentos\s*const processoCompleto = await pool\.query\(`[\s\S]*?`, \[id\]\);/;
content = content.replace(pattern2, "");

fs.writeFileSync(filePath, content, "utf8");
console.log(" Consultas SQL desnecessárias removidas com sucesso!");
