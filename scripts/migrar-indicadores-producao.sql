-- ========================================
-- MIGRAÇÃO SEGURA PARA INDICADORES GERENCIAIS
-- APENAS ADICIONA PERMISSÃO SEM AFETAR O SISTEMA
-- ========================================

-- 1. Verificar se a migração já foi aplicada
DO $$ 
BEGIN
    -- Verificar se algum admin já tem a permissão
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE perfil = 'admin' 
        AND 'indicadores-gerenciais' = ANY(paginas_permitidas)
    ) THEN
        RAISE NOTICE 'Migração já foi aplicada anteriormente. Nenhuma alteração necessária.';
    ELSE
        -- Aplicar a migração apenas se necessário
        RAISE NOTICE 'Aplicando migração para indicadores gerenciais...';
        
        -- Adicionar permissão aos usuários admin
        UPDATE users 
        SET paginas_permitidas = array_append(paginas_permitidas, 'indicadores-gerenciais')
        WHERE perfil = 'admin' 
        AND NOT ('indicadores-gerenciais' = ANY(paginas_permitidas));
        
        RAISE NOTICE 'Migração aplicada com sucesso!';
    END IF;
END $$;

-- 2. Verificar resultado da migração
SELECT 
    'VERIFICAÇÃO DA MIGRAÇÃO' AS status,
    COUNT(*) AS total_admins,
    COUNT(CASE WHEN 'indicadores-gerenciais' = ANY(paginas_permitidas) THEN 1 END) AS admins_com_permissao
FROM users 
WHERE perfil = 'admin';

-- 3. Listar usuários admin e suas permissões
SELECT 
    id,
    email,
    perfil,
    paginas_permitidas,
    'indicadores-gerenciais' = ANY(paginas_permitidas) AS tem_indicadores_gerenciais
FROM users 
WHERE perfil = 'admin'
ORDER BY email;
