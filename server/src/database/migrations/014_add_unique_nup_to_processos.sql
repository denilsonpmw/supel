-- Migration: Adiciona restrição UNIQUE ao campo nup na tabela processos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'processos_nup_unique'
  ) THEN
    ALTER TABLE processos ADD CONSTRAINT processos_nup_unique UNIQUE (nup);
  END IF;
END$$; 