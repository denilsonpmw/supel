-- Adiciona coluna para a chave pública do Portal de Compras Públicas (PCP)
ALTER TABLE unidades_gestoras ADD COLUMN pcp_public_key VARCHAR(255);

-- Opcional: Adicionar um comentário na coluna para documentação
COMMENT ON COLUMN unidades_gestoras.pcp_public_key IS 'Chave pública da API do Portal de Compras Públicas (PCP) para esta Unidade Gestora';
