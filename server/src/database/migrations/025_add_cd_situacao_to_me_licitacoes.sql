-- Adicionar coluna cd_situacao à tabela microempresas_licitacoes se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='microempresas_licitacoes' AND column_name='cd_situacao') THEN
        ALTER TABLE microempresas_licitacoes ADD COLUMN cd_situacao INTEGER;
    END IF;
END $$;
