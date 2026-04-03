# 🛠️ DIRETRIZES TÉCNICAS - Sistema SUPEL

> **Padrões e Convenções de Desenvolvimento**  
> Guia técnico para manter consistência no código

---

## 🏗️ ARQUITETURA DO SISTEMA

### **Stack Tecnológico**
- **Frontend**: React 18 + TypeScript + Vite + Material-UI
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL
- **Autenticação**: Google OAuth 2.0 (simulado em dev)

### **Estrutura de Pastas**
```
app-supel/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   │   └── admin/      # Páginas administrativas
│   │   ├── contexts/       # Context API
│   │   ├── services/       # Chamadas de API
│   │   ├── types/          # Interfaces TypeScript
│   │   └── theme.ts        # Tema Material-UI
│   └── package.json
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── routes/         # Definição de rotas
│   │   ├── middleware/     # Middlewares
│   │   ├── database/       # Conexão e migrações
│   │   └── types/          # Interfaces TypeScript
│   └── package.json
├── docs/                   # Documentação
└── scripts/                # Scripts de automação
```

---

## 📝 PADRÕES DE CÓDIGO

### **Convenções de Nomenclatura**

#### **Arquivos e Pastas**
- **Componentes**: `PascalCase.tsx` (ex: `ResponsaveisPage.tsx`)
- **Hooks**: `useCamelCase.ts` (ex: `useResponsaveis.ts`)
- **Services**: `camelCase.ts` (ex: `responsaveisService.ts`)
- **Types**: `index.ts` (interfaces organizadas por módulo)

#### **Variáveis e Funções**
- **Variáveis**: `camelCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase`
- **Endpoints**: `/api/recurso-plural` (ex: `/api/responsaveis`)

### **Estrutura de Controllers (Backend)**
```typescript
// Template padrão para controllers
import { Request, Response } from 'express';
import pool from '../database/connection';

export const listarRecursos = async (req: Request, res: Response) => {
  try {
    // 1. Extrair parâmetros da query
    // 2. Montar query SQL com filtros
    // 3. Executar query
    // 4. Retornar dados padronizados
  } catch (error) {
    // Tratamento de erro padronizado
  }
};

export const criarRecurso = async (req: Request, res: Response) => {
  try {
    // 1. Validar dados de entrada
    // 2. Verificar duplicatas se necessário
    // 3. Inserir no banco
    // 4. Retornar recurso criado
  } catch (error) {
    // Tratamento de erro
  }
};
```

### **Estrutura de Pages (Frontend)**
```typescript
// Template padrão para páginas administrativas
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Button, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Box
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../services/api';

const RecursoPage = () => {
  // 1. Estados do componente
  const [recursos, setRecursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // 2. useEffect para carregar dados
  useEffect(() => {
    loadRecursos();
  }, []);
  
  // 3. Funções de CRUD
  const loadRecursos = async () => { /* ... */ };
  const handleSubmit = async () => { /* ... */ };
  const handleDelete = async () => { /* ... */ };
  
  // 4. Render do componente
  return (
    <Container maxWidth="lg">
      {/* Cabeçalho */}
      {/* Tabela */}
      {/* Modal de edição */}
    </Container>
  );
};
```

---

## 🗄️ PADRÕES DE BANCO DE DADOS

### **Convenções de Nomenclatura**
- **Tabelas**: `snake_case` plural (ex: `responsaveis`, `unidades_gestoras`)
- **Colunas**: `snake_case` (ex: `nome_responsavel`, `email_contato`)
- **PKs**: `id` (sempre serial/auto-increment)
- **FKs**: `{tabela}_id` (ex: `responsavel_id`, `modalidade_id`)

### **Campos Padrão em Todas as Tabelas**
```sql
-- Campos obrigatórios em todas as entidades
id SERIAL PRIMARY KEY,
ativo BOOLEAN DEFAULT true,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### **Estrutura da Tabela `responsaveis`**
```sql
CREATE TABLE responsaveis (
  id SERIAL PRIMARY KEY,
  nome_responsavel VARCHAR(255) NOT NULL,
  email_responsavel VARCHAR(255) UNIQUE NOT NULL,
  telefone_responsavel VARCHAR(20),
  cargo_responsavel VARCHAR(100),
  setor_responsavel VARCHAR(100),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 PADRÕES DE API

### **Estrutura de Rotas**
```
GET    /api/recurso         # Listar com filtros
POST   /api/recurso         # Criar novo
GET    /api/recurso/:id     # Buscar por ID
PUT    /api/recurso/:id     # Atualizar
DELETE /api/recurso/:id     # Excluir
GET    /api/recurso/:id/stats  # Estatísticas (se aplicável)
```

### **Formato de Resposta Padronizado**
```typescript
// Sucesso (200, 201)
{
  "data": any,
  "message"?: string,
  "total"?: number,     // Para listas paginadas
  "page"?: number,      // Para paginação
  "limit"?: number      // Para paginação
}

// Erro (400, 404, 500)
{
  "error": string,
  "message": string,
  "details"?: any
}
```

### **Parâmetros de Query Comuns**
- `?search=termo` - Busca textual
- `?ativo=true/false` - Filtrar por status
- `?page=1&limit=10` - Paginação
- `?sort=campo&order=asc/desc` - Ordenação

---

## 🎨 PADRÕES DE INTERFACE

### **Painel Público**
- Layout responsivo 16:9, três áreas (semana atual, passada, próxima)
- Sistema de cores por modalidade e situação
- Atualização automática a cada 30s (polling ou WebSocket)
- Acesso público, sem autenticação
- Tabelas compactas, foco em visualização rápida
- Exportação de dados visíveis (em desenvolvimento)

### **Relatórios**
- Relatórios predefinidos (Geral, Economicidade, Críticos)
- Filtros avançados por período, modalidade, situação
- Exportação PDF/Excel (em desenvolvimento)
- Preview com tabelas e gráficos
- Métricas automáticas e análises integradas

### **Tema e Cores**
- **Primary**: Material-UI Blue (#1976d2)
- **Success**: Green (#2e7d32)
- **Error**: Red (#d32f2f)
- **Warning**: Orange (#ed6c02)
- **Info**: Light Blue (#0288d1)

### **Componentes Padrão**
```typescript
// Cabeçalho da página
<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
  <Typography variant="h4" component="h1">
    📋 Título da Página
  </Typography>
  <Button variant="contained" startIcon={<AddIcon />}>
    Adicionar
  </Button>
</Box>

// Tabela padrão
<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Campo 1</TableCell>
        <TableCell>Campo 2</TableCell>
        <TableCell align="right">Ações</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {/* Dados */}
    </TableBody>
  </Table>
</TableContainer>

// Modal de edição
<Dialog open={dialogOpen} maxWidth="md" fullWidth>
  <DialogTitle>
    {editingItem ? 'Editar' : 'Novo'} Recurso
  </DialogTitle>
  <DialogContent>
    {/* Formulário */}
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCancel}>Cancelar</Button>
    <Button onClick={handleSubmit} variant="contained">
      Salvar
    </Button>
  </DialogActions>
</Dialog>
```

### **Estados de Loading e Feedback**
- **Loading**: `<CircularProgress />` para operações assíncronas
- **Success**: `<Alert severity="success">` para operações bem-sucedidas
- **Error**: `<Alert severity="error">` para erros
- **Empty State**: Mensagem amigável quando não há dados

### **Checklist de Qualidade (atualizado)**
- [ ] Exportação de dados (relatórios, painel público)
- [ ] Acessibilidade (cores, contraste, navegação)

---

## 🧪 PADRÕES DE VALIDAÇÃO

### **Frontend (TypeScript)**
```typescript
// Validação de formulário
const isFormValid = () => {
  return formData.nome_campo.trim() && 
         formData.email_campo.includes('@') &&
         formData.campo_obrigatorio;
};

// Validação de email
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### **Backend (Validação de Entrada)**
```typescript
// Validação básica no controller
if (!req.body.nome_campo || !req.body.email_campo) {
  return res.status(400).json({
    error: 'VALIDATION_ERROR',
    message: 'Campos obrigatórios não preenchidos'
  });
}
```

---

## 🔒 PADRÕES DE SEGURANÇA

### **Middleware de Autenticação**
```typescript
// Todas as rotas administrativas devem usar auth middleware
router.use('/admin/*', authMiddleware);
router.use('/api/*', authMiddleware);
```

### **Sanitização de Dados**
- Sempre validar entrada do usuário
- Usar prepared statements para SQL
- Escapar dados antes de inserir no banco

---

## 📋 CHECKLIST DE QUALIDADE

### **Antes de Fazer Commit**
- [ ] Código segue os padrões de nomenclatura
- [ ] Componente tem loading states
- [ ] Erros são tratados adequadamente
- [ ] Interface é responsiva
- [ ] Validações estão implementadas
- [ ] Não há console.log() esquecidos
- [ ] TypeScript sem erros

### **Antes de Considerar uma Feature "Completa"**
- [ ] Backend: CRUD completo implementado
- [ ] Frontend: Interface funcional e responsiva
- [ ] Validações: Front e backend funcionando
- [ ] Feedback: Loading, success, error implementados
- [ ] Testes: Funcionalidade testada manualmente
- [ ] Documentação: Roadmap atualizado

---

## 🚀 COMANDOS ÚTEIS

### **Desenvolvimento**
```bash
# Iniciar ambiente completo
npm run dev

# Apenas backend
npm run server:dev

# Apenas frontend  
npm run client:dev

# Configurar banco
npm run setup-db

# Reset do banco (cuidado!)
npm run reset-db
```

### **Manutenção**
```bash
# Corrigir dependências
npm run fix-client

# Adicionar admin
npm run add-admin

# Instalar dependências
npm run install:all
```

---

**💡 Esta documentação será atualizada conforme novos padrões forem estabelecidos durante o desenvolvimento.** 