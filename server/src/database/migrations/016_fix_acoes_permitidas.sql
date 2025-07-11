-- Migração 016: Corrigir acoes_permitidas para usuários existentes
-- Data: 2024-12-27
-- Descrição: Garantir que todos os usuários tenham acoes_permitidas definidas

-- Atualizar usuários admin que não têm acoes_permitidas
UPDATE users 
SET acoes_permitidas = ARRAY['ver_estatisticas', 'editar', 'excluir']
WHERE perfil = 'admin' AND (acoes_permitidas IS NULL OR array_length(acoes_permitidas, 1) = 0);

-- Atualizar usuários comuns que não têm acoes_permitidas
UPDATE users 
SET acoes_permitidas = ARRAY['ver_estatisticas', 'editar']
WHERE perfil = 'usuario' AND (acoes_permitidas IS NULL OR array_length(acoes_permitidas, 1) = 0);

-- Atualizar usuários visualizadores que não têm acoes_permitidas
UPDATE users 
SET acoes_permitidas = ARRAY['ver_estatisticas']
WHERE perfil = 'visualizador' AND (acoes_permitidas IS NULL OR array_length(acoes_permitidas, 1) = 0);

-- Garantir que o campo tenha valor padrão para novos usuários
ALTER TABLE users ALTER COLUMN acoes_permitidas SET DEFAULT ARRAY['ver_estatisticas', 'editar'];

-- Comentário explicativo
COMMENT ON COLUMN users.acoes_permitidas IS 'Array com as ações que o usuário pode executar (ver_estatisticas, editar, excluir)'; 