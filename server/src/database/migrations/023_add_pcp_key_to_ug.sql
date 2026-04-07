-- Adiciona coluna para a chave pública do Portal de Compras Públicas (PCP)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unidades_gestoras' AND column_name='pcp_public_key') THEN
        ALTER TABLE unidades_gestoras ADD COLUMN pcp_public_key VARCHAR(255);
        COMMENT ON COLUMN unidades_gestoras.pcp_public_key IS 'Chave pública da API do Portal de Compras Públicas (PCP) para esta Unidade Gestora';
    END IF;
END $$;
