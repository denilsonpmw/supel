-- Migração 016: Permitir datas nulas e responsavel/modalidade opcionais em processos
-- Data: 2024-07-10

ALTER TABLE processos ALTER COLUMN data_entrada DROP NOT NULL;
ALTER TABLE processos ALTER COLUMN data_sessao DROP NOT NULL;
ALTER TABLE processos ALTER COLUMN data_pncp DROP NOT NULL;
ALTER TABLE processos ALTER COLUMN data_tce_1 DROP NOT NULL;
ALTER TABLE processos ALTER COLUMN data_tce_2 DROP NOT NULL;
ALTER TABLE processos ALTER COLUMN data_situacao DROP NOT NULL;

ALTER TABLE processos ALTER COLUMN responsavel_id DROP NOT NULL;
ALTER TABLE processos ALTER COLUMN modalidade_id DROP NOT NULL; 