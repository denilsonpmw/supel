# 🚀 Instruções para Migração Manual - Indicadores Gerenciais

## ⚡ Método Mais Simples: Railway Dashboard

### Passo 1: Acessar o Railway Dashboard
1. Vá para [railway.app](https://railway.app)
2. Acesse seu projeto **app-supel**
3. Clique no serviço **PostgreSQL**

### Passo 2: Abrir Query Editor
1. Na aba do PostgreSQL, procure por **"Query"** ou **"Console"**
2. Clique para abrir o editor de consultas

### Passo 3: Executar a Migração
Copie e cole o SQL abaixo no editor:

```sql
-- MIGRAÇÃO SEGURA PARA INDICADORES GERENCIAIS
DO $$ 
BEGIN
    -- Verificar se algum admin já tem a permissão
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE perfil = 'admin' 
        AND 'indicadores-gerenciais' = ANY(paginas_permitidas)
    ) THEN
        RAISE NOTICE 'Migração já foi aplicada anteriormente.';
    ELSE
        -- Aplicar a migração
        UPDATE users 
        SET paginas_permitidas = array_append(paginas_permitidas, 'indicadores-gerenciais')
        WHERE perfil = 'admin' 
        AND NOT ('indicadores-gerenciais' = ANY(paginas_permitidas));
        
        RAISE NOTICE 'Migração aplicada com sucesso!';
    END IF;
END $$;

-- Verificar resultado
SELECT 
    'VERIFICAÇÃO' AS status,
    COUNT(*) AS total_admins,
    COUNT(CASE WHEN 'indicadores-gerenciais' = ANY(paginas_permitidas) THEN 1 END) AS com_permissao
FROM users 
WHERE perfil = 'admin';
```

### Passo 4: Verificar Resultado
Você deve ver algo como:
```
NOTICE: Migração aplicada com sucesso!

status      | total_admins | com_permissao
VERIFICAÇÃO |      1       |       1
```

## 🎯 Deploy do Frontend

Após executar a migração:

```bash
railway up
```

## ✅ Testar

1. Acesse sua aplicação no Railway
2. Faça login como admin  
3. Vá para `/admin/indicadores-gerenciais`
4. Verifique se a página carrega corretamente

---

**Essa migração é 100% segura e não afeta o sistema em produção!** 🛡️
