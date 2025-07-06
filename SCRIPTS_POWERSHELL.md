# Scripts Corrigidos para PowerShell

## Problema Identificado

O PowerShell não suporta o operador `&&` como separador de comandos da mesma forma que o Bash/CMD. Isso causava erros ao executar scripts que usavam `cd diretório && comando`.

## Soluções Implementadas

### 1. Scripts Alternativos com Sufixo `:ps`

Foram criados scripts específicos para PowerShell que usam Node.js para navegação entre diretórios:

```json
{
  "dev:ps": "node scripts/powershell-dev.js",
  "server:dev:ps": "node -e \"process.chdir('server'); require('child_process').spawn('npm', ['run', 'dev'], {stdio: 'inherit', shell: true})\"",
  "client:dev:ps": "node -e \"process.chdir('client'); require('child_process').spawn('npm', ['run', 'dev'], {stdio: 'inherit', shell: true})\"",
  "start:ps": "node -e \"process.chdir('server'); require('child_process').spawn('npm', ['start'], {stdio: 'inherit', shell: true})\"",
  "migrate:ps": "node -e \"process.chdir('server'); require('child_process').spawn('npm', ['run', 'migrate'], {stdio: 'inherit', shell: true})\"",
  "seed:ps": "node -e \"process.chdir('server'); require('child_process').spawn('npm', ['run', 'seed'], {stdio: 'inherit', shell: true})\""
}
```

### 2. Script Principal para Desenvolvimento

Criado `scripts/powershell-dev.js` que:
- Verifica a estrutura do projeto
- Inicia servidor e cliente simultaneamente
- Usa navegação de diretório via Node.js
- Funciona em qualquer terminal (PowerShell, CMD, Bash)

## Como Usar

### Para Desenvolvimento Completo
```powershell
# Em vez de: npm run dev
npm run dev:ps
```

### Para Servidor Apenas
```powershell
# Em vez de: npm run server:dev
npm run server:dev:ps
```

### Para Cliente Apenas
```powershell
# Em vez de: npm run client:dev
npm run client:dev:ps
```

### Para Produção
```powershell
# Em vez de: npm start
npm run start:ps
```

### Para Migrações
```powershell
# Em vez de: npm run migrate
npm run migrate:ps
```

### Para Seeds
```powershell
# Em vez de: npm run seed
npm run seed:ps
```

## Scripts Mantidos (Para Bash/CMD)

Os scripts originais foram mantidos para compatibilidade com outros terminais:

```json
{
  "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
  "server:dev": "cd server && npm run dev",
  "client:dev": "cd client && npm run dev",
  "start": "cd server && npm start",
  "migrate": "cd server && npm run migrate",
  "seed": "cd server && npm run seed"
}
```

## Verificações de Compatibilidade

### arquivos alterados para usar Node.js em vez de shell:
- `scripts/check-env.js` - Usa `process.chdir()` em vez de `cd diretório &&`
- `scripts/setup.js` - Mensagens atualizadas com alternativas para PowerShell
- `scripts/fix-client-windows.js` - Mensagens com dicas para PowerShell

## Recomendações

### Para Usuários do PowerShell
1. **Use sempre os scripts com sufixo `:ps`**
2. **Para desenvolvimento**: `npm run dev:ps`
3. **Para produção**: `npm run start:ps`
4. **Para banco**: `npm run migrate:ps` e `npm run seed:ps`

### Para Usuários de Bash/CMD
- Continue usando os scripts normais (`npm run dev`, `npm start`, etc.)

### Para Times Mistos
- Configure aliases ou use o script principal `dev:ps` que funciona em todos os terminais

## Vantagens da Nova Abordagem

1. **Compatibilidade Universal**: Funciona em PowerShell, CMD, Bash
2. **Feedback Melhor**: Logs coloridos e informativos
3. **Verificações**: Valida estrutura do projeto antes de executar
4. **Robustez**: Melhor tratamento de erros
5. **Mantibilidade**: Scripts originais preservados

## Arquivo Principal: `scripts/powershell-dev.js`

Este script:
- ✅ Verifica se os diretórios `server` e `client` existem
- ✅ Usa `process.chdir()` para navegação segura
- ✅ Inicia ambos os serviços com logs coloridos
- ✅ Captura Ctrl+C para finalização limpa
- ✅ Funciona em qualquer terminal

## Troubleshooting

### Se ainda houver problemas:
1. Use `npm run dev:ps` em vez de `npm run dev`
2. Verifique se Node.js está instalado
3. Execute cada comando separadamente:
   ```powershell
   cd server
   npm run dev
   ```
   Em outro terminal:
   ```powershell
   cd client  
   npm run dev
   ```

### Para debug:
- Os scripts `:ps` mostram o diretório atual e comando sendo executado
- Logs coloridos ajudam a identificar de qual serviço vem cada mensagem 