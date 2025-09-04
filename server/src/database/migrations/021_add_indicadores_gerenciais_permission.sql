-- Migração 021: Adicionar permissão 'indicadores-gerenciais' aos usuários admin existentes
-- Data: 2024-12-21

-- Adicionar permissão 'indicadores-gerenciais' aos usuários admin existentes
UPDATE users 
SET paginas_permitidas = array_append(paginas_permitidas, 'indicadores-gerenciais')
WHERE perfil = 'admin' AND NOT ('indicadores-gerenciais' = ANY(paginas_permitidas));

-- Verificar se a migração foi aplicada corretamente
SELECT 
    id, 
    email, 
    perfil, 
    paginas_permitidas,
    'indicadores-gerenciais' = ANY(paginas_permitidas) as tem_indicadores_gerenciais
FROM users 
WHERE perfil = 'admin';
