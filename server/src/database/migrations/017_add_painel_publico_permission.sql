-- Migração 017: Adicionar permissão 'painel-publico' aos usuários admin existentes
-- Data: 2024-12-19

-- Adicionar permissão 'painel-publico' aos usuários admin existentes
UPDATE users 
SET paginas_permitidas = array_append(paginas_permitidas, 'painel-publico')
WHERE perfil = 'admin' AND NOT ('painel-publico' = ANY(paginas_permitidas));

-- Verificar se a migração foi aplicada corretamente
SELECT 
    id, 
    email, 
    perfil, 
    paginas_permitidas,
    'painel-publico' = ANY(paginas_permitidas) as tem_painel_publico
FROM users 
WHERE perfil = 'admin'; 