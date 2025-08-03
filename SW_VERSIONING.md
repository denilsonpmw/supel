# Sistema de Versionamento do Service Worker

Este projeto implementa um sistema automatizado de versionamento para o Service Worker, com criação automática de tags Git.

## 📦 Estrutura de Versões

O Service Worker segue o padrão **Semantic Versioning (SemVer)**:
- `MAJOR.MINOR.PATCH` (ex: v1.1.2)

### Tipos de Versão:
- **PATCH** (`1.1.2` → `1.1.3`): Bug fixes, pequenos ajustes
- **MINOR** (`1.1.3` → `1.2.0`): Novas funcionalidades, melhorias
- **MAJOR** (`1.2.0` → `2.0.0`): Breaking changes, refatorações grandes

## 🚀 Como Usar

### ⚠️ **IMPORTANTE - Verificação Prévia para Produção**

**Antes de criar uma versão para produção, SEMPRE verifique a última tag oficial:**

```powershell
# 1. Verificar últimas tags no repositório
git tag -l --sort=-version:refname | head -10

# 2. Ou verificar no GitHub Releases
# https://github.com/denilsonpmw/supel/releases

# 3. Se necessário, ajustar manualmente a versão base no sw.js
# Exemplo: se a última tag oficial é v1.4.2, ajuste para v1.4.2 antes de versionar
```

### Opção 1: Script Node.js
```bash
# Incrementar patch (bugs/fixes)
node scripts/version-sw.js patch "Fix notification timing"

# Incrementar minor (features)
node scripts/version-sw.js minor "Add new cache strategy"

# Incrementar major (breaking changes)
node scripts/version-sw.js major "Rewrite service worker architecture"
```

### Opção 2: Script PowerShell
```powershell
# Incrementar patch
.\scripts\version-sw.ps1 patch "Fix notification timing"

# Incrementar minor
.\scripts\version-sw.ps1 minor "Add new cache strategy"

# Incrementar major
.\scripts\version-sw.ps1 major "Rewrite service worker architecture"
```

### Opção 3: Script Robusto (Recomendado) 🆕
```bash
# Incrementar patch com diagnóstico avançado
node scripts/version-sw-robust.cjs patch "Fix notification timing"

# Incrementar minor
node scripts/version-sw-robust.cjs minor "Add new cache strategy"

# Incrementar major
node scripts/version-sw-robust.cjs major "Rewrite service worker architecture"
```

## 🔄 O que o Script Faz Automaticamente

1. **📋 Lê a versão atual** do `client/public/sw.js`
2. **🔢 Incrementa a versão** conforme o tipo especificado
3. **✏️ Atualiza o Service Worker** com a nova versão
4. **🔨 Faz o build** do client (`npm run build`)
5. **� Verifica mudanças** antes do commit (evita commits vazios)
6. **�📝 Commit das mudanças** com mensagem padronizada
7. **🏷️ Cria tag Git** com a nova versão
8. **📤 Push do commit e tag** para o repositório

### 🛠️ Melhorias do Script Robusto

- **✅ Detecção de erros** com logs detalhados
- **✅ Verificação de mudanças** antes do commit
- **✅ Tratamento de falhas** no build
- **✅ Validação do Git** status
- **✅ Suporte completo** ao CommonJS (.cjs)

## 📋 Exemplo de Saída

```
📦 Versão atual: v1.1.2
🚀 Nova versão: v1.1.3
✅ Service Worker atualizado
🔨 Fazendo build...
📝 Fazendo commit...
🏷️ Criando tag v1.1.3...
📤 Enviando para repositório...
🎉 Versão v1.1.3 criada e enviada com sucesso!
🔗 Tag disponível em: https://github.com/denilsonpmw/supel/releases/tag/v1.1.3
```

## 📝 Histórico de Versões

As versões ficam disponíveis em:
- **Tags Git**: `git tag -l`
- **GitHub Releases**: https://github.com/denilsonpmw/supel/releases
- **Service Worker**: `const CACHE_NAME = 'supel-vX.X.X'`

## 🛠️ Manutenção Manual

### 🔍 **Verificação de Versão Oficial (Produção)**

Para garantir que a próxima versão seja baseada na versão oficial:

```powershell
# 1. Verificar última tag oficial
git tag -l --sort=-version:refname | head -5

# 2. Verificar versão atual no Service Worker
Get-Content client/public/sw.js | Select-String "CACHE_NAME"

# 3. Se versões não coincidirem, ajustar manualmente:
# Editar client/public/sw.js → const CACHE_NAME = 'supel-vX.X.X'
```

### ✏️ **Ajuste Manual de Versão Base**

Se precisar ajustar manualmente:

1. **Editar versão**: `client/public/sw.js` → `CACHE_NAME`
2. **Build**: `cd client && npm run build`
3. **Commit**: `git add . && git commit -m "manual: versão vX.X.X"`
4. **Tag**: `git tag -a vX.X.X -m "Versão manual X.X.X"`
5. **Push**: `git push origin main && git push origin vX.X.X`

## 🎯 Benefícios

- ✅ **Versionamento consistente** e automático
- ✅ **Rastreabilidade completa** via tags Git
- ✅ **Deploy coordenado** (build + commit + tag + push)
- ✅ **Histórico organizado** de mudanças no SW
- ✅ **Rollback fácil** para versões anteriores
- ✅ **GitHub Releases** automáticos
