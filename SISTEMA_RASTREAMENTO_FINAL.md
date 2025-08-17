# 📊 Sistema de Rastreamento de Acesso - Versão Final

## 🎯 Visão Geral
Sistema completo para capturar logs de autenticação e páginas visitadas, com interface administrativa restrita para visualização dos dados.

## ✨ Funcionalidades Implementadas

### 🔐 Rastreamento de Autenticação
- **Captura automática** de todos os logins no sistema
- **Dados coletados**: E-mail do usuário, data/hora de acesso, sucesso/falha
- **Armazenamento** em tabela `access_auth_logs` com UUID único

### 📱 Rastreamento de Páginas Visitadas
- **Captura automática** de navegação entre páginas
- **Funciona para todos** os usuários autenticados (não apenas administradores)
- **Dados coletados**: E-mail, página visitada, data/hora de entrada/saída, tempo de permanência
- **Armazenamento** em tabela `access_page_visits` com UUID único

### 👨‍💼 Interface Administrativa
- **Acesso restrito** apenas para usuários administradores
- **Dashboard completo** com 3 abas:
  1. **Logs de Autenticação**: Histórico de logins
  2. **Páginas Visitadas**: Rastreamento de navegação
  3. **Estatísticas**: Resumos e métricas
- **Filtros avançados**: Data, usuário, página
- **Exportação CSV** dos dados
- **Paginação** para performance

## 🏗️ Arquitetura Técnica

### 📊 Banco de Dados
```sql
-- Tabela de logs de autenticação
CREATE TABLE access_auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255) NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT true,
    ip_address INET,
    user_agent TEXT
);

-- Tabela de páginas visitadas
CREATE TABLE access_page_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255) NOT NULL,
    page_path VARCHAR(500) NOT NULL,
    page_title VARCHAR(255),
    visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP,
    duration_seconds INTEGER,
    referrer VARCHAR(500)
);
```

### 🔧 Backend (Express.js)
- **Middleware de autenticação**: `authenticateToken` para validação JWT
- **Middleware admin**: `requireAdmin` para rotas restritas
- **Rotas de rastreamento**:
  - `POST /api/access-tracking/auth` - Registra login (aberto)
  - `POST /api/access-tracking/page-enter` - Página visitada (aberto)
  - `POST /api/access-tracking/page-exit` - Saída da página (aberto)
  - `GET /api/access-tracking/*` - Consultas (apenas admin)

### 🎨 Frontend (React + TypeScript)
- **Hook personalizado**: `usePageTracking` para captura automática
- **Componente admin**: `AccessTrackingPage` com interface completa
- **Integração transparente**: Não afeta experiência do usuário
- **Performance otimizada**: Usa localStorage e navigator.sendBeacon

## 🔒 Segurança Implementada

### 🛡️ Controle de Acesso
- **Autenticação obrigatória** para todas as funcionalidades
- **Separação de permissões**:
  - Usuários comuns: Apenas enviam dados de tracking
  - Administradores: Visualizam e exportam dados
- **Validação JWT** em todas as requisições

### 🚀 Performance
- **Paginação** nas consultas (100 registros por página)
- **Índices** no banco de dados para queries otimizadas
- **Lazy loading** dos componentes administrativos
- **Debounce** nos filtros de pesquisa

## 📁 Estrutura de Arquivos

### Backend
```
server/
├── middleware/
│   └── accessTracker.ts          # Middleware de rastreamento
├── routes/
│   └── access-tracking.ts        # Rotas da API
└── migrations/
    └── 020_create_access_tracking_tables.sql
```

### Frontend
```
client/src/
├── hooks/
│   └── usePageTracking.ts        # Hook de rastreamento
├── pages/admin/
│   └── AccessTrackingPage.tsx    # Interface administrativa
└── components/
    └── Layout.tsx                # Integração do tracking
```

## 🎯 Como Usar

### 👤 Para Usuários Comuns
- **Funcionamento automático**: O sistema captura dados de navegação sem intervenção
- **Transparente**: Não afeta a experiência de uso
- **Privacidade**: Dados apenas para administradores

### 👨‍💼 Para Administradores
1. **Acesso**: Menu lateral → "Rastreamento de Acesso"
2. **Visualização**: Escolha entre logs de auth, páginas ou estatísticas
3. **Filtros**: Use os campos para refinar a busca
4. **Exportação**: Botão "Exportar CSV" em cada aba

## 🧹 Versão de Produção
- **Logs de debug removidos**: Console.log comentados para produção
- **Código otimizado**: Sem impacto visual ou funcional
- **Pronto para deploy**: Versão limpa e performática

## 🔄 Monitoramento
- **Logs estruturados** no servidor para debugging
- **Métricas automáticas** de uso e performance
- **Alertas** para falhas de rastreamento (opcional)

## 📈 Estatísticas Disponíveis
- Total de logins por período
- Páginas mais visitadas
- Tempo médio por página
- Usuários mais ativos
- Horários de maior acesso
