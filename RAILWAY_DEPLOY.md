# 🚀 Deploy do SUPEL no Railway

Este guia explica como fazer o deploy do sistema SUPEL no Railway.

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Repositório Git do projeto
3. Banco de dados PostgreSQL (pode ser provisionado no Railway)

## 🔧 Configuração do Projeto

### 1. Estrutura do Projeto
O projeto está configurado como uma aplicação full-stack com:
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Banco**: PostgreSQL

### 2. Arquivos de Configuração
- `railway.json`: Configuração específica do Railway
- `Procfile`: Comando de inicialização
- `.railwayignore`: Arquivos excluídos do deploy

## 🚀 Passos para Deploy

### 1. Conectar ao Railway
```bash
# Instalar CLI do Railway (se necessário)
npm install -g @railway/cli

# Fazer login
railway login

# Conectar ao projeto
railway link
```

### 2. Configurar Variáveis de Ambiente
No painel do Railway, configure as seguintes variáveis:

#### Variáveis Obrigatórias:
```env
# Banco de Dados
DB_HOST=seu_host_postgres
DB_PORT=5432
DB_NAME=seu_nome_banco
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

# Ambiente
NODE_ENV=production
PORT=3001
```

#### Variáveis Opcionais:
```env
# URLs (se não configuradas, usarão valores padrão)
CLIENT_URL=https://seu-dominio.railway.app
API_URL=https://seu-dominio.railway.app

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Google OAuth (se usar)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

### 3. Provisionar Banco de Dados
1. No Railway, adicione um serviço PostgreSQL
2. Copie as credenciais do banco para as variáveis de ambiente
3. O sistema criará as tabelas automaticamente na primeira execução

### 4. Fazer Deploy
```bash
# Deploy automático (quando fizer push para o repositório)
git push origin main

# Ou deploy manual
railway up
```

## 🔍 Verificação do Deploy

### 1. Health Check
Acesse: `https://seu-dominio.railway.app/api/health`

Resposta esperada:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "routes": {
    "auth": true,
    "users": true,
    "profile": true,
    "processes": true,
    "reports": true,
    "dashboard": true
  }
}
```

### 2. Logs
```bash
# Ver logs em tempo real
railway logs

# Ver logs específicos
railway logs --service web
```

## 🛠️ Comandos Úteis

### Desenvolvimento Local
```bash
# Instalar dependências
npm run install:all

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Railway CLI
```bash
# Status do projeto
railway status

# Abrir no navegador
railway open

# Executar comando no Railway
railway run npm run migrate
railway run npm run seed
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Erro de Build**
   - Verificar se todas as dependências estão no `package.json`
   - Verificar se o Node.js está na versão correta

2. **Erro de Conexão com Banco**
   - Verificar variáveis de ambiente do banco
   - Verificar se o banco está ativo no Railway

3. **Erro de CORS**
   - Configurar `CLIENT_URL` corretamente
   - Verificar se o frontend está sendo servido corretamente

4. **Arquivos não encontrados**
   - Verificar se o `.railwayignore` não está excluindo arquivos necessários
   - Verificar se o build está gerando os arquivos corretamente

### Logs de Debug
```bash
# Ver logs detalhados
railway logs --follow

# Ver logs de build
railway logs --service web --build
```

## 📊 Monitoramento

### Métricas Importantes
- **Uptime**: Verificar se a aplicação está sempre online
- **Response Time**: Tempo de resposta das APIs
- **Memory Usage**: Uso de memória da aplicação
- **Database Connections**: Conexões ativas com o banco

### Alertas
Configure alertas no Railway para:
- Falhas de deploy
- Alto uso de recursos
- Erros de aplicação

## 🔄 Atualizações

### Deploy Automático
O Railway faz deploy automático quando você faz push para o repositório.

### Deploy Manual
```bash
# Fazer deploy manual
railway up

# Fazer deploy de um branch específico
railway up --branch feature/nova-funcionalidade
```

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs no Railway
2. Verificar variáveis de ambiente
3. Testar localmente com as mesmas configurações
4. Consultar a documentação do Railway

---

**Nota**: Este sistema foi configurado para funcionar como uma aplicação full-stack no Railway, servindo tanto o backend API quanto o frontend React. 