# 🔐 Sistema de Autenticação - SUPEL

## 📋 Visão Geral

O sistema SUPEL utiliza autenticação baseada em JWT (JSON Web Tokens) com suporte para:
- Login com email/senha
- Primeiro acesso (definir senha inicial)
- Redefinição de senha (esqueci minha senha)
- Controle de acesso por perfil (admin/usuario)

## 🔑 Fluxos de Autenticação

### 1. **Login Normal**
```
1. Usuário acessa /login
2. Informa email e senha
3. Sistema valida credenciais
4. Retorna JWT token válido por 24h
5. Redireciona para dashboard
```

### 2. **Primeiro Acesso**
```
1. Admin cria usuário sem senha
2. Usuário acessa /primeiro-acesso
3. Informa email e define nova senha
4. Sistema valida e salva senha
5. Redireciona para login
```

### 3. **Esqueci Senha**
```
1. Usuário acessa /esqueci-senha
2. Informa email cadastrado
3. Sistema gera token temporário (1h)
4. Em desenvolvimento: mostra token no console
5. Em produção: enviará email com link
```

### 4. **Redefinir Senha**
```
1. Usuário acessa /redefinir-senha?token=XXX
2. Informa token e nova senha
3. Sistema valida token e expiração
4. Atualiza senha e limpa token
5. Redireciona para login
```

## 🗄️ Estrutura do Banco de Dados

### Tabela `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  senha VARCHAR(255),
  perfil VARCHAR(50) DEFAULT 'usuario',
  paginas_permitidas TEXT[],
  ativo BOOLEAN DEFAULT true,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Relacionamento com Responsáveis
- Usuários são vinculados aos responsáveis pelo email
- Query de JOIN: `LEFT JOIN responsaveis r ON u.email = r.email`
- Filtros automáticos aplicados para usuários comuns

## 🔒 Segurança

### Senhas
- Mínimo de 6 caracteres
- Hash com bcrypt (10 rounds)
- Nunca armazenadas em texto plano

### Tokens JWT
- Expiração em 24 horas
- Payload contém apenas ID do usuário
- Verificação em todas as rotas protegidas

### Tokens de Reset
- Gerados aleatoriamente (26 caracteres)
- Expiração em 1 hora
- Uso único (limpos após redefinição)

## 🛠️ Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/primeiro-acesso` - Definir primeira senha
- `POST /api/auth/esqueci-senha` - Solicitar redefinição
- `POST /api/auth/redefinir-senha` - Redefinir com token
- `GET /api/auth/verify` - Verificar token atual
- `POST /api/auth/logout` - Fazer logout

### Perfil
- `GET /api/profile` - Dados do usuário atual
- `PUT /api/profile/password` - Alterar própria senha

## 📱 Páginas do Frontend

### `/login`
- Formulário de email/senha
- Links para primeiro acesso e esqueci senha
- Design glassmorphism com animações

### `/primeiro-acesso`
- Formulário para definir primeira senha
- Validação de email existente
- Verificação se já possui senha

### `/esqueci-senha`
- Formulário para solicitar reset
- Mensagem genérica por segurança
- Em dev: mostra token no console

### `/redefinir-senha`
- Formulário com token e nova senha
- Aceita token via URL parameter
- Validação de expiração

## 🔧 Configuração para Produção

### 1. **Email Service**
```javascript
// Adicionar serviço de email (SendGrid, AWS SES, etc.)
const sendResetEmail = async (email, token) => {
  const resetUrl = `https://supel.palmas.to.gov.br/redefinir-senha?token=${token}`;
  // Enviar email com template
};
```

### 2. **Remover Token do Response**
```javascript
// Em solicitarRedefinicaoSenha, remover:
// resetToken: resetToken // Apenas para desenvolvimento/testes
```

### 3. **Variáveis de Ambiente**
```env
JWT_SECRET=chave-secreta-complexa
TOKEN_EXPIRATION=24h
RESET_TOKEN_EXPIRATION=1h
EMAIL_SERVICE_API_KEY=sua-chave
```

## 🧪 Testes

### Criar Usuário de Teste
```sql
INSERT INTO users (email, nome, perfil, ativo, paginas_permitidas)
VALUES ('teste@exemplo.com', 'Usuário Teste', 'usuario', true, 
        ARRAY['dashboard', 'processos', 'relatorios']);
```

### Testar Primeiro Acesso
1. Criar usuário sem senha
2. Acessar /primeiro-acesso
3. Definir senha
4. Fazer login

### Testar Redefinição
1. Acessar /esqueci-senha
2. Informar email
3. Pegar token do console (dev)
4. Acessar /redefinir-senha?token=XXX
5. Definir nova senha

## 📝 Notas Importantes

1. **Desenvolvimento**: Tokens são mostrados no console/response
2. **Produção**: Implementar envio real de emails
3. **Segurança**: Nunca expor se email existe ou não
4. **Performance**: Tokens são limpos após uso
5. **UX**: Mensagens genéricas para evitar enumeration 