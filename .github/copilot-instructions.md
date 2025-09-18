
# Instruções e boas práticas do projeto

> 1) Sempre use o português do Brasil para responder aos chats e para as mensagens de commit.

Estas instruções reúnem uma análise prática do repositório e uma coleção de verificações, comandos e políticas recomendadas para manter a qualidade, segurança e previsibilidade do desenvolvimento.

## Visão geral do repositório (observações inferidas)

- Projeto Node.js com frontend em Vite/TypeScript (pasta `client/`).
- Há scripts utilitários em `scripts/` e vários arquivos SQL em `arquivos_sql/`.
- Arquivos de configuração para deploy (Railway/Procfile) e documentação extensa em `docs/`.

Assumo que o CI é GitHub Actions ou similar e que o deploy principal pode ocorrer em Railway (há `railway.*`).

## Contrato mínimo (o que cada contribuidor deve garantir)

- Respostas em issues/PRs e mensagens de commit em português do Brasil.
- Builds reproduzíveis: sempre usar `node` e `npm` (ou `pnpm`/`yarn`) nas versões definidas pelo projeto.
- Antes de abrir PR: tests unitários (se existirem), lint e formatação automáticos, e verificação de segurança básica (`npm audit`/Snyk).

## Checagens corriqueiras (comandos recomendados - PowerShell)

1. Instalar dependências (usar versão específica do Node):

```powershell
# Ajuste NVM/nvm-windows conforme seu fluxo; exemplo genérico:
nvm use <versão-recomendada>
npm ci
```

2. Lint, Fix e Formatar

```powershell
npm run lint
npm run format
# ou, se preferir, executar format + lint fix
npm run format && npm run lint:fix
```

3. Testes e build

```powershell
npm test
npm run build
```

4. Verificações de segurança e integridade

```powershell
npm audit --audit-level=moderate
# opcional: npx snyk test
```

5. Verificar variáveis de ambiente esperadas (exemplo rápido):

```powershell
if (-not $env:DATABASE_URL) { Write-Error 'Variável DATABASE_URL não definida' }
```

## Scripts sugeridos para `package.json`

Recomenda-se adicionar (ou padronizar) scripts como:

- "check:env": validações básicas de env
- "lint": lint do monorepo (client/server)
- "format": prettier --write
- "test": runner de testes (jest/vitest)
- "build": build do frontend e backend
- "ci": executar: npm ci && npm run lint && npm test && npm audit

Exemplo (documentação — não altere automaticamente):

```json
{
	"scripts": {
		"check:env": "node ./scripts/check-env.js",
		"lint": "eslint . --ext .js,.ts,.tsx",
		"format": "prettier --write \"**/*.{js,ts,tsx,json,md}\"",
		"test": "vitest --run",
		"build": "npm --prefix client run build && node ./server/build-script.js",
		"ci": "npm ci && npm run format && npm run lint && npm test && npm audit --audit-level=moderate"
	}
}
```

## Hooks Git recomendados

- Instalar `husky` + `lint-staged` para garantir formato e lint antes do commit.
- Exemplo de regras:
	- pre-commit: executar `npm run format` e `lint-staged` (aplicar só aos arquivos alterados)
	- pre-push: executar `npm test --silent` e `npm run build` (opcional em branches principais)

## Mensagens de commit e PRs

- Use português do Brasil.
- Adote um estilo objetivo e consistente. Sugestão adaptada do Conventional Commits (em pt-BR):

	- feat: nova funcionalidade
	- fix: correção de bug
	- docs: mudanças na documentação
	- chore: mudanças que não afetam src/test (ex.: config)
	- refactor: refatoração de código
	- test: adicionar/ajustar testes

- Exemplos:
	- "feat: adicionar validação de CNPJ na API"
	- "fix: corrigir cálculo de prazo na rotina de auditoria"

## CI/CD (resumo mínimo de recomendações)

- GitHub Actions: criar workflow que execute `npm ci`, `npm run ci` e publique artefatos se necessário.
- Executar checks em PRs: lint, tests, build e audit. Bloquear merge se algum falhar.
- Deploy: usar segredos do repositório para credenciais do Railway/Heroku. Validar variáveis antes do deploy.

## Segurança e segredos

- Nunca commitar arquivos `.env` ou credenciais. Adicione `*.env` ao `.gitignore` se já não existir.
- Use o GitHub Secrets / Railway/Heroku Config Vars.
- Verifique dependências vulneráveis com `npm audit` e envie PRs para atualizações.

## Boas práticas de código e revisão

- Pequenos PRs focados com descrição clara do que foi alterado e por quê.
- Incluir 'how to test' no corpo do PR (passos para reproduzir). Preferir passos reproduzíveis no Windows PowerShell.
- Tests automáticos para lógica crítica (cálculo de processos, contadores, auditoria).

## Rotinas de manutenção (scripts/checagens que valem automatizar)

- Script de verificação de integridade do banco (ex.: `scripts/check_database.js`) que rode checagens básicas.
- Script para limpar logs antigos e rotacionar (existe `clean_admin_tracking.sql`).
- Script para checar constraints NUP (há arquivos SQL para isso); crie uma task para rodar localmente em DB de teste.

## Debug e logs locais

- Centralizar logs em um formato consistente (json-lines) para facilitar análise.
- Incluir instruções rápidas de como rodar o servidor em modo debug no README e nos scripts NPM.

## Sugestões adicionais de baixo risco (próximos passos)

1. Adicionar `engines` em `package.json` com a versão do Node suportada.
2. Criar um workflow GitHub Actions básico (`.github/workflows/ci.yml`) que rode `npm run ci` em PRs.
3. Adicionar `husky` + `lint-staged` para qualidade na borda de commit.
4. Criar um template de PR com checklist mínimo (lint, tests, doc, how-to-test).

## Contato e referências rápidas

- Documentação local: ver `docs/` para padrões já existentes.
- Para dúvidas sobre deploy: checar `README.md` e `RAILWAY_DEPLOY.md` em `docs/`.

---

Se quiser, eu já posso:
- Criar um `package.json` snippet real (ou editar o existente) com os scripts sugeridos.
- Gerar um exemplo de `husky` + `lint-staged` e o workflow do GitHub Actions.

Escolha qual próximo passo quer que eu execute e eu continuo implementando.
