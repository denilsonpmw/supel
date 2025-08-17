# Sistema de Tracking de Acesso

Sistema independente para capturar logs de autenticação e páginas visitadas pelos usuários.

## 📋 Funcionalidades

- **Logs de Autenticação**: Registra login_success, login_fail e logout
- **Tracking de Páginas**: Registra entrada e saída de páginas visitadas  
- **Dados Capturados**: Email, página, hora de entrada/saída, IP, User-Agent
- **API de Consulta**: Endpoints para consultar e filtrar dados de tracking
- **Manutenção Automática**: Scripts para limpeza de dados antigos

## 🗃️ Estrutura do Banco de Dados

### Tabela: `access_auth_logs`
```sql
- id (UUID)
- email (TEXT) 
- event (TEXT) -- login_success, login_fail, logout
- ip (TEXT)
- user_agent (TEXT)
- created_at (TIMESTAMPTZ)
```

### Tabela: `access_page_visits`
```sql
- id (UUID)
- email (TEXT)
- path (TEXT) -- Caminho da página (/dashboard, /processos)
- ip (TEXT)
- user_agent (TEXT)
- enter_at (TIMESTAMPTZ) -- Hora de entrada
- exit_at (TIMESTAMPTZ) -- Hora de saída (NULL = ainda visualizando)
- session_id (TEXT)
- duration_seconds (calculado) -- Tempo de permanência
```

## 🚀 Como Foi Implementado

### 1. Middleware de Tracking (`/server/src/middleware/accessTracker.ts`)
- Captura automaticamente acessos a páginas HTML
- Só registra usuários autenticados
- Execução assíncrona (não bloqueia requisições)

### 2. Integração nos Controllers de Auth
- Login bem-sucedido → `login_success`
- Login com falha → `login_fail`  
- Logout → `logout`

### 3. API de Consulta (`/server/src/routes/access-tracking.ts`)
**Endpoints disponíveis:**
```
GET /api/access-tracking/page-visits - Consultar visitas
GET /api/access-tracking/auth-logs - Consultar logs de auth
GET /api/access-tracking/stats - Estatísticas básicas
POST /api/access-tracking/page-exit - Marcar saída (frontend)
```

### 4. Frontend Tracking (`/client/src/utils/pageTracker.ts`)
- Classe JavaScript para capturar saídas de página
- Usa `sendBeacon` para garantir envio no unload
- Suporte para SPAs (React, Vue, Angular)

## 📊 Exemplos de Uso da API

### Consultar Visitas de Páginas
```bash
GET /api/access-tracking/page-visits?email=usuario@email.com&from=2025-01-01&to=2025-01-31
```

### Consultar Logs de Autenticação  
```bash
GET /api/access-tracking/auth-logs?event=login_fail&from=2025-01-01
```

### Estatísticas
```bash
GET /api/access-tracking/stats?from=2025-01-01&to=2025-01-31
```

**Retorna:**
- Páginas mais visitadas
- Usuários mais ativos
- Tempo médio de permanência

## 🛠️ Scripts de Manutenção

### Executar Migração
```bash
cd server
npm run migrate:access-tracking
```

### Limpeza Periódica
```bash
cd server  
npm run access-tracking:maintenance
```

**O que faz:**
- Fecha páginas órfãs (sem exit_at após 30 min)
- Remove logs antigos (> 90 dias)

## 🔧 Configuração no Frontend

### Uso Tradicional (Script Tag)
```html
<script src="/utils/pageTracker.js"></script>
<!-- Tracker inicializa automaticamente -->
```

### Uso em React/Vue/Angular
```javascript
import { PageTracker } from './utils/pageTracker';

const tracker = new PageTracker({
  enableTracking: true,
  apiBaseUrl: process.env.REACT_APP_API_URL,
  sessionId: sessionStorage.getItem('sessionId')
});
```

## 🔍 Consultas Úteis

### Páginas mais visitadas hoje
```sql
SELECT path, COUNT(*) as visits 
FROM access_page_visits 
WHERE enter_at::date = CURRENT_DATE 
GROUP BY path 
ORDER BY visits DESC;
```

### Usuários que falharam login hoje
```sql
SELECT email, COUNT(*) as failed_attempts, MAX(created_at) as last_attempt
FROM access_auth_logs 
WHERE event = 'login_fail' 
AND created_at::date = CURRENT_DATE
GROUP BY email 
ORDER BY failed_attempts DESC;
```

### Tempo médio de permanência por página
```sql
SELECT 
  path,
  COUNT(*) as visits,
  AVG(EXTRACT(EPOCH FROM (exit_at - enter_at))::integer) as avg_seconds
FROM access_page_visits 
WHERE exit_at IS NOT NULL
GROUP BY path
ORDER BY avg_seconds DESC;
```

## 🛡️ Segurança e Privacidade

- ✅ **Não interfere** com sistema de auditoria existente
- ✅ **Dados mínimos**: Apenas email, página, horários
- ✅ **Execução assíncrona**: Não afeta performance
- ✅ **Retenção configurável**: Limpeza automática após 90 dias
- ✅ **Autenticação obrigatória**: Só registra usuários logados

## 🚦 Status da Implementação

- ✅ Migração de banco criada e executada
- ✅ Middleware de tracking configurado  
- ✅ Integração nos pontos de autenticação
- ✅ API de consulta implementada
- ✅ Scripts de manutenção criados
- ✅ Tracking de frontend disponível
- ✅ Documentação completa

**Sistema pronto para uso!** 🎉
