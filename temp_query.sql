-- Consulta 1: Contagem de registros
SELECT COUNT(*) as total_registros, COUNT(data_sessao) as com_data_sessao FROM processos;

-- Consulta 2: Registros com data_sessao preenchida
SELECT id, data_sessao, created_at FROM processos WHERE data_sessao IS NOT NULL ORDER BY id DESC LIMIT 10;

-- Consulta 3: Verificar formato das datas
SELECT id, data_sessao, LENGTH(data_sessao) as tamanho_data FROM processos WHERE data_sessao IS NOT NULL ORDER BY id DESC LIMIT 5; 