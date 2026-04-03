# 🏛️ Mapeamento Completo do Sistema SUPEL

> **Visão Geral da Arquitetura e Módulos**  
> Sistema de Controle de Processos de Licitação e Contratação Pública

---

## 🔭 Visão Geral
O SUPEL é composto por um **frontend** em React + Vite + Material-UI e um **backend** em Node.js (Express) utilizando PostgreSQL como banco de dados. O sistema segue uma arquitetura *cliente → API REST → banco de dados*, com cache na camada de API para otimizar requisições.

```
                  ┌─────────────┐
╔════════════════>│  Frontend   │─────────────┐
║                 └─────────────┘             │
║                                             ▼
║                 ┌───────────────────┐   ┌──────────────┐
║  Navegador HTTP │  API Express/TS   │──►│  PostgreSQL  │
║                 └───────────────────┘   └──────────────┘
║                         ▲
║                         │
║            Invalidação  │
║            de Cache     │
║                         ▼
║                 ┌───────────────────┐
╚═════════════════│   Cache In-Mem    │
                  └───────────────────┘
```

---

## 🗂️ Módulos Principais

| Módulo | Descrição | Arquivos-Chave |
|--------|-----------|----------------|
| **Autenticação** | Login por e-mail/senha, tokens JWT, redefinição de senha | `server/src/controllers/authController.ts`, `server/src/routes/auth.ts`, páginas `LoginPage`, `PrimeiroAcessoPage`, `RedefinirSenhaPage` |
| **Administração** | Área administrativa com páginas de configuração e manutenção do sistema (Usuários, Permissões, Logs, Integrações) | Diretório `client/src/pages/admin/*`, rotas protegidas via `PrivateRoute` |
| **Cadastros Básicos** | CRUD de Modalidades, Unidades Gestoras, Responsáveis, Situações, Equipe de Apoio | Controladores e rotas correspondentes (`modalidades`, `unidades-gestoras`, `responsaveis`, etc.) |
| **Processos** | Entidade central do sistema. Possui relacionamentos com todos os cadastros, histórico de situações e métricas financeiras | `server/src/controllers/processosController.ts`, `ProcessosPage.tsx` |
| **Dashboard** | Métricas e gráficos em tempo real (pizza, barras, heat-map) | `DashboardPage.tsx`, `dashboardController.ts` |
| **Relatórios** | Geração de relatórios tabulares e gráficos com filtros avançados e exportação (Excel) | `relatoriosController.ts`, `RelatoriosPage.tsx` |
| **Painel Público** | Exibição 16:9 dos processos relevantes sem autenticação | `PainelPublicoPage.tsx`, `painelPublicoController.ts` |
| **Permissões** | Controle de acesso por perfil e página, filtro automático por responsável | `middleware/auth.ts`, `profile.ts` (rota) |
| **Infra & Otimizações** | Cache inteligente, logging, scripts de banco, CI/CD (em planejamento) | `middleware/cache.ts`, scripts em `scripts/` |

---

## 🌐 Fluxo de Navegação do Usuário
1. **Login** – Usuário insere e-mail e senha  → token JWT.
2. **Roteamento Protegido** – `PrivateRoute` verifica token e permissões.
3. **Administração ou Área de Trabalho** – Dependendo do perfil, é redirecionado para **Administração** (admin) ou **Dashboard** (usuário comum).
4. **Cadastros / Processos** – CRUD, filtros e estatísticas.
5. **Relatórios** – Seleção de template ou construtor personalizado → geração no backend → download/exportação.
6. **Painel Público** – Acesso livre em outra rota (sem token).

---

## 🔒 Permissões e Regras
- **admin**: acesso total a todas as rotas/páginas.
- **usuario**: acesso restrito; filtros automáticos por responsável.
- Middleware `requirePageAccess` garante que a página solicitada esteja listada em `paginas_permitidas`.

---

## 📡 Principais Endpoints Backend
```
GET  /api/auth/profile           → Dados do usuário logado
POST /api/auth/login             → Autenticação
GET  /api/modalidades            → Lista de modalidades
GET  /api/processes              → Lista de processos com filtros
GET  /api/dashboard/metrics      → Métricas para dashboard
GET  /api/reports/processos      → Relatório geral de processos
GET  /api/reports/economicidade  → Relatório de economicidade
```
*(lista completa em **DIRETRIZES_TECNICAS.md**)*

---

## 🗄️ Estrutura de Banco de Dados (Simplificada)
```
users (id, email, nome, perfil, ativo)
responsaveis (id, nome_responsavel, email, ...)
processos (id, nup, modalidade_id, ug_id, responsavel_id, ...)
modalidades (id, nome_modalidade, cor_hex, ...)
unidades_gestoras (id, nome_completo_unidade, ...)
situacoes (id, nome_situacao, cor_hex, ...)
```

---

## 🚧 Funcionalidades em Desenvolvimento
- **Relatórios**: exportação em PDF, agendamento e construtor avançado.
- **Deploy & CI/CD**: scripts de pipeline, variáveis de ambiente para produção.

---

## 📑 Referências
- **Diretrizes Técnicas**: [`docs/DIRETRIZES_TECNICAS.md`](./DIRETRIZES_TECNICAS.md)
- **Roadmap**: [`docs/ROADMAP_DESENVOLVIMENTO.md`](./ROADMAP_DESENVOLVIMENTO.md)

---

> Mantenha este documento atualizado sempre que um novo módulo for criado ou alterado. 