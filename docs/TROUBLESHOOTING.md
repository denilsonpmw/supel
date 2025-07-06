# 🔧 TROUBLESHOOTING - Sistema SUPEL

> **Guia de Solução de Problemas**  
> Documento para resolver problemas comuns durante o desenvolvimento

---

## 🚨 PROBLEMAS FREQUENTES

### **1. Erro 403 (Forbidden) em Todas as APIs**

**Sintomas:**
- Todas as páginas mostram erro ao carregar dados
- Console do navegador mostra erro 403 em todas as requisições
- APIs retornam "Token inválido"
- Dashboard e páginas admin não carregam dados

**Causa:**
- Token de autenticação expirado ou inválido
- localStorage corrompido
- Token não está no formato correto para ambiente de desenvolvimento

**Solução Automática (Recomendada):**
```bash
# Usar script automático que abre o navegador e faz tudo sozinho
npm run fix-auth:auto

# Aguardar o navegador abrir e fazer as correções
# A página será recarregada automaticamente
```

**Solução Manual (Alternativa):**
```bash
# Usar script manual que mostra os passos
npm run fix-auth

# Seguir as instruções exibidas no terminal
```

**Solução Manual via DevTools:**
1. Abrir navegador em http://localhost:5173
2. Pressionar `F12` para abrir DevTools
3. Ir na aba **Console**
4. Executar comandos:
```javascript
// Limpar localStorage
localStorage.removeItem("supel_token");
localStorage.removeItem("fake_user");
localStorage.removeItem("supel_user");

// Criar novo token
localStorage.setItem('supel_token', 'fake_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
localStorage.setItem("fake_user", JSON.stringify({
  id: 1,
  email: "denilson.pmw@gmail.com",
  nome: "Denilson Maciel",
  perfil: "admin",
  ativo: true
}));

// Recarregar página
window.location.reload();
```

---

### **2. Página em Branco após Reinicialização do Servidor**

**Sintomas:**
- Frontend carrega mas mostra página em branco
- Console do navegador mostra erros de conexão com API
- Dashboard não carrega dados
- Erro 401 (Unauthorized) nas requisições

**Causa:**
- Frontend perde conexão com backend durante reinicialização
- Token de autenticação expira ou é perdido
- Cache do navegador desatualizado
- Processos não foram parados corretamente

**Solução Rápida:**
```bash
# Opção 1: Usar script automático
npm run restart-dev

# Opção 2: Manual
# Terminal 1 - Parar processos
taskkill /F /IM node.exe

# Terminal 2 - Iniciar backend
cd server && npm start

# Terminal 3 - Iniciar frontend
cd client && npm run dev
```

**Solução no Navegador:**
1. Pressionar `Ctrl + Shift + R` (hard refresh)
2. Abrir DevTools → Network → Disable cache
3. Se persistir, limpar localStorage:
   - DevTools → Application → Local Storage
   - Remover `supel_token` e `fake_user`
   - Fazer login novamente

---

### **3. Erro de Porta em Uso**

**Sintomas:**
- Erro "EADDRINUSE" no backend
- Erro "Port 5173 is already in use" no frontend

**Solução:**
```bash
# Verificar processos usando as portas
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Parar processo específico (substituir PID pelo número)
taskkill /F /PID <PID>

# Ou parar todos os processos Node.js
taskkill /F /IM node.exe
```

---

### **4. Erro de Dependências**

**Sintomas:**
- Erro "Cannot find module" no frontend
- Erro "Package not found" no backend
- Gráficos não carregam (recharts)

**Solução:**
```bash
# Reinstalar dependências
npm run install:all

# Ou individualmente
cd client && npm install
cd server && npm install

# Se persistir, limpar cache
npm cache clean --force
```

---

### **5. Erro de Banco de Dados**

**Sintomas:**
- Erro "Connection refused" no backend
- Erro "Database does not exist"
- APIs retornam erro 500

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
# Windows: Serviços → PostgreSQL

# Recriar banco se necessário
npm run reset-db

# Ou executar migrações
npm run migrate
npm run seed
```

---

### **6. Erro de Autenticação**

**Sintomas:**
- Erro 401 em todas as APIs
- Login não funciona
- Token inválido

**Solução:**
```bash
# Limpar tokens do localStorage
# DevTools → Application → Local Storage → Clear

# Ou usar token fake manual
localStorage.setItem('supel_token', 'fake_token_' + Date.now())
```

### **7. Erro de Diretório (ENOENT: no such file or directory)**

**Sintomas:**
- Erro `ENOENT: no such file or directory, open 'C:\Users\Denilson\package.json'`
- Comando `cd ..` sai do diretório do projeto
- npm não encontra o package.json

**Causa:**
- Navegação incorreta de diretórios
- Comando executado fora do diretório do projeto
- Problema com caminhos relativos

**Solução:**
```bash
# 1. Verificar se está no diretório correto
pwd
ls package.json

# 2. Se não estiver, navegar para o diretório do projeto
cd C:\Users\Denilson\app-supel

# 3. Verificar se os arquivos estão presentes
ls package.json
ls scripts/dev.js

# 4. Executar comando do projeto raiz
npm run dev
```

**Prevenção:**
- Sempre verificar se está no diretório `app-supel` antes de executar comandos
- Usar `pwd` para verificar o diretório atual
- Usar `ls` ou `dir` para verificar se os arquivos do projeto estão presentes

---

## 🛠️ COMANDOS ÚTEIS

### **Scripts de Resolução Automática**
```bash
# Resolver problemas de autenticação (403 Forbidden) de forma manual
npm run fix-auth

# Resolver problemas de autenticação (403 Forbidden) de forma automática (abre navegador e faz tudo sozinho)
npm run fix-auth:auto

# Reinicializar ambiente completo
npm run restart-dev

# Verificar ambiente
npm run check-env

# Reinstalar dependências
npm run install:all
```

### **Reinicialização Rápida**
```bash
# Parar tudo e reiniciar
npm run restart-dev

# Ou manual
taskkill //F //IM node.exe
npm run dev
```

### **Verificação de Status**
```bash
# Verificar se APIs estão funcionando
curl -H "Authorization: Bearer fake_token_123" http://localhost:3001/api/dashboard/metrics

# Verificar processos
netstat -ano | findstr :3001
netstat -ano | findstr :5173
```

### **Limpeza Completa**
```bash
# Parar todos os processos
taskkill //F //IM node.exe

# Limpar cache npm
npm cache clean --force

# Reinstalar dependências
npm run install:all

# Reiniciar
npm run dev
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Antes de reportar um problema, verifique:

- [ ] PostgreSQL está rodando
- [ ] Portas 3001 e 5173 estão livres
- [ ] Dependências estão instaladas
- [ ] Migrações foram executadas
- [ ] Token de autenticação existe
- [ ] Cache do navegador foi limpo

---

## 🆘 CONTATO

Se o problema persistir após tentar todas as soluções:

1. Verificar logs do console do navegador
2. Verificar logs do terminal do servidor
3. Documentar passos que reproduzem o problema
4. Verificar se é um problema específico do ambiente

---

**💡 Dica:** Sempre use `npm run fix-auth` para problemas de autenticação e `npm run restart-dev` para reinicializações rápidas!

## Atualização
- Documentação revisada após limpeza do projeto. Scripts temporários e arquivos de debug removidos.