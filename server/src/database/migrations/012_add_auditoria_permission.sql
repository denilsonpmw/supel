-- Migração 012: Adicionar permissão de auditoria para usuários admin
-- Data: 2024-12-27
-- Descrição: Adiciona a permissão 'auditoria' na lista de páginas permitidas dos usuários admin

-- Adiciona a permissão 'auditoria' na lista de páginas permitidas dos admins
UPDATE users
SET paginas_permitidas =
  CASE
    WHEN 'auditoria' = ANY(paginas_permitidas) THEN paginas_permitidas
    ELSE array_append(paginas_permitidas, 'auditoria')
  END
WHERE perfil = 'admin';

-- Comentário explicativo
COMMENT ON COLUMN users.paginas_permitidas IS 'Array com as páginas que o usuário pode acessar (incluindo auditoria para admins)'; 