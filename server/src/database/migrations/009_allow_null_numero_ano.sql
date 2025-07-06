-- Migração 009: Permitir que numero_ano seja nulo
-- Data: 2025-01-19
-- Descrição: Alterar a coluna numero_ano para aceitar valores NULL

-- Alterar a coluna numero_ano para permitir NULL
ALTER TABLE processos 
ALTER COLUMN numero_ano DROP NOT NULL;

COMMENT ON COLUMN processos.numero_ano IS 'Número/Ano do processo (opcional)'; 