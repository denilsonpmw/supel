# 🔒 Migração Segura - Indicadores Gerenciais

Este documento descreve como aplicar a migração para a página de indicadores gerenciais de forma segura em produção.

## 🎯 Objetivo

Adicionar a permissão `indicadores-gerenciais` aos usuários admin existentes no banco de produção, sem afetar o sistema em funcionamento.

## 🛡️ Segurança

- ✅ **Não remove dados**: Apenas adiciona uma permissão
- ✅ **Não altera estruturas**: Não modifica tabelas ou índices
- ✅ **Idempotente**: Pode ser executado múltiplas vezes sem problemas
- ✅ **Verificação automática**: Confirma se a migração já foi aplicada
- ✅ **Rollback simples**: Pode ser revertido facilmente se necessário

## 🚀 Métodos de Execução

### Método 1: Script Automatizado (Recomendado)

```bash
# No diretório do projeto
node scripts/migrar-indicadores-producao.js
```

### Método 2: Railway Dashboard

1. Acesse o Railway Dashboard
2. Vá para o serviço PostgreSQL
3. Abra o **Query Editor**
4. Cole o conteúdo do arquivo `scripts/migrar-indicadores-producao.sql`
5. Execute a query

### Método 3: psql Direto

```bash
# Conectar ao banco e executar
railway run psql $DATABASE_URL -f scripts/migrar-indicadores-producao.sql
```

## 📊 Verificação

Após a execução, você verá:

```
VERIFICAÇÃO DA MIGRAÇÃO
- Total de admins: X
- Admins com permissão: X

Lista de usuários admin com status da permissão
```

## 🔄 Rollback (se necessário)

Se precisar reverter a migração:

```sql
UPDATE users 
SET paginas_permitidas = array_remove(paginas_permitidas, 'indicadores-gerenciais')
WHERE perfil = 'admin';
```

## ✅ Próximos Passos

1. **Executar a migração** (usando um dos métodos acima)
2. **Fazer deploy do frontend** atualizado
3. **Testar o acesso** à página `/admin/indicadores-gerenciais`
4. **Verificar permissões** dos usuários admin

## 🆘 Suporte

Se encontrar algum problema:

1. Verifique os logs da migração
2. Confirme se o usuário tem perfil 'admin'
3. Verifique se a permissão foi adicionada corretamente
4. Teste o acesso local antes do deploy

---

**Importante**: Esta migração é específica apenas para a funcionalidade de indicadores gerenciais e não afeta outras partes do sistema.
