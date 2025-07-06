# Sistema de Controle de Processos - SUPEL

Sistema completo para gestão e controle de processos de licitação e contratação pública.

## 🚀 Funcionalidades

### Dashboard
- Métricas em tempo real de processos ativos
- Visualizações interativas com gráficos
- Mapa de calor das situações dos processos
- Cards informativos com valores consolidados

### Área Administrativa
- **CRUD Completo para:**
  - Processos de gestão
  - Unidades Gestoras (U.G.)
  - Responsáveis
  - Equipe de Apoio
  - Modalidades de Licitação
  - Situações do Processo
  - Usuários
- Relatórios personalizáveis com exportação para Excel
- Gerenciamento de permissões de usuário

### Painel Público
- Visualização em tempo real dos processos em andamento, sem necessidade de login.
- Layout otimizado para telas de TV e monitores.
- Atualização automática de dados.

### Autenticação e Segurança
- Login via Google OAuth (simplificado para ambiente de desenvolvimento)
- Sistema de perfis (Administrador, Usuário)
- Controle de acesso baseado no responsável pelo processo

## 🛠️ Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Banco de Dados:** PostgreSQL
- **Autenticação:** Google OAuth 2.0
- **UI/UX:** Material-UI
- **Gráficos:** Recharts

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd app-supel
```

2. Instale todas as dependências:
```bash
npm run install:all
```

3. Configure as variáveis de ambiente:
```bash
# Copie os arquivos de exemplo
cp server/.env.example server/.env
cp client/.env.example client/.env
```

4. Configure o banco de dados PostgreSQL e atualize as credenciais no arquivo `server/.env`

5. Execute as migrações do banco:
```bash
cd server && npm run migrate
```

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O sistema estará disponível em:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🗄️ Estrutura do Projeto
O projeto é um monorepo com duas pastas principais:
- `/client`: Contém a aplicação frontend em React.
- `/server`: Contém a API backend em Node.js/Express.
- `/docs`: Contém a documentação detalhada do projeto.

Para mais detalhes sobre a arquitetura e padrões, consulte o [Guia de Diretrizes Técnicas](./docs/DIRETRIZES_TECNICAS.md).

## 🎯 Perfis de Usuário

1. **Administrador:** Acesso completo ao sistema, incluindo gerenciamento de usuários.
2. **Usuário:** Acesso restrito aos processos pelos quais é responsável.

## 📈 Métricas do Dashboard

- Total de Processos Ativos
- Valor Associado aos Processos
- Processos em Andamento
- Processos Concluídos
- Economicidade Alcançada
- Análise de Tempo por Situação

## 🔧 Desenvolvimento

```bash
# Executar o backend e o frontend simultaneamente (recomendado)
npm run dev

# Executar apenas o backend
cd server && npm start

# Executar apenas o frontend
cd client && npm run dev
```

📖 **Documentação Completa:** Para um guia detalhado sobre o roadmap, arquitetura e decisões de projeto, veja a [documentação completa](./docs/README.md).

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes. 