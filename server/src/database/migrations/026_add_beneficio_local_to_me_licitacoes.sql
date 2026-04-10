-- Adiciona coluna para sinalizar benefício local do PCP
ALTER TABLE microempresas_licitacoes
ADD COLUMN IF NOT EXISTS cd_boleano_d_beneficio_local BOOLEAN DEFAULT FALSE;
