-- Migração 015: Adicionar campo acoes_permitidas na tabela users
-- Data: 2024-12-27
-- Descrição: Adiciona controle granular de ações permitidas para cada usuário

-- Adicionar coluna para ações permitidas
ALTER TABLE users ADD COLUMN IF NOT EXISTS acoes_permitidas TEXT[] DEFAULT ARRAY['ver_estatisticas', 'editar', 'excluir'];

-- Atualizar usuários admin para ter todas as ações permitidas
UPDATE users 
SET acoes_permitidas = ARRAY['ver_estatisticas', 'editar', 'excluir']
WHERE perfil = 'admin';

-- Atualizar usuários comuns para ter ver estatísticas e editar por padrão
UPDATE users 
SET acoes_permitidas = ARRAY['ver_estatisticas', 'editar']
WHERE perfil = 'usuario' AND acoes_permitidas IS NULL;

-- Comentário explicativo
COMMENT ON COLUMN users.acoes_permitidas IS 'Array com as ações que o usuário pode executar (ver_estatisticas, editar, excluir)'; 