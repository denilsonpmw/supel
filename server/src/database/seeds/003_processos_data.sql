-- Seed de dados de processos com nova formatação NUP
-- Formato: 00000.0.000001/2025 (completo) -> 000001/2025 (compacto)

-- Limpar dados existentes de processos
DELETE FROM processos;

-- Inserir processos de exemplo com nova formatação NUP
INSERT INTO processos (
    nup, objeto, ug_id, data_entrada, responsavel_id, modalidade_id, 
    numero_ano, rp, valor_estimado, situacao_id, data_situacao, conclusao,
    data_tce_1, data_pncp, data_sessao, valor_realizado, observacoes
) VALUES 
-- Processo 1: Finalizado com economicidade
(
    '00000.0.000001/2025', 
    'Aquisição de material de escritório e informática para a Superintendência de Licitações', 
    1, '2025-01-15', 1, 2, '001/2025', false, 75000.00, 10, '2025-03-20', true,
    '2025-03-10', '2025-02-15', '2025-03-05', 67500.00, 'Processo finalizado com 10% de economicidade'
),
-- Processo 2: Adjudicado
(
    '00000.0.000002/2025', 
    'Contratação de serviços de limpeza e conservação para Secretaria de Educação', 
    2, '2025-01-20', 2, 2, '002/2025', true, 180000.00, 8, '2025-02-15', false,
    '2025-02-10', '2025-01-25', '2025-02-12', NULL, 'Processo adjudicado, aguardando homologação'
),
-- Processo 3: Em Publicação
(
    '00000.0.000003/2025', 
    'Aquisição de equipamentos de informática para Secretaria de Saúde', 
    3, '2025-02-01', 3, 1, '003/2025', false, 120000.00, 6, '2025-02-20', false,
    NULL, '2025-02-18', NULL, NULL, 'Edital em fase de publicação'
),
-- Processo 4: Aprovado
(
    '00000.0.000004/2025', 
    'Contratação de serviços de telefonia e internet para Secretaria de Transportes', 
    4, '2025-02-10', 1, 2, '004/2025', true, 95000.00, 4, '2025-02-25', false,
    NULL, NULL, NULL, NULL, 'Processo aprovado, aguardando publicação'
),
-- Processo 5: Em Análise
(
    '00000.0.000005/2025', 
    'Aquisição de medicamentos básicos para Secretaria de Saúde', 
    3, '2025-02-15', 4, 2, '005/2025', false, 350000.00, 2, '2025-02-20', false,
    NULL, NULL, NULL, NULL, 'Processo em análise técnica'
),
-- Processo 6: Recebido
(
    '00000.0.000006/2025', 
    'Contratação de serviços de manutenção predial para Secretaria da Fazenda', 
    5, '2025-02-20', 5, 2, '006/2025', true, 85000.00, 1, '2025-02-22', false,
    NULL, NULL, NULL, NULL, 'Processo recebido, aguardando análise'
),
-- Processo 7: Cancelado
(
    '00000.0.000007/2025', 
    'Aquisição de uniformes para servidores da SEDUC', 
    2, '2025-01-10', 2, 2, '007/2025', false, 65000.00, 11, '2025-02-05', true,
    NULL, NULL, NULL, NULL, 'Processo cancelado por solicitação da unidade gestora'
),
-- Processo 8: Fracassado
(
    '00000.0.000008/2025', 
    'Contratação de serviços de segurança para SETRAP', 
    4, '2025-01-25', 3, 1, '008/2025', true, 150000.00, 12, '2025-03-01', true,
    '2025-02-20', '2025-02-15', '2025-02-28', NULL, 'Processo fracassado - nenhuma proposta habilitada'
),
-- Processo 9: Em Sessão
(
    '00000.0.000009/2025', 
    'Aquisição de veículos para frota da SUPEL', 
    1, '2025-02-05', 1, 2, '009/2025', false, 250000.00, 7, '2025-03-15', false,
    '2025-03-10', '2025-03-01', '2025-03-15', NULL, 'Processo em sessão de licitação'
),
-- Processo 10: Homologado
(
    '00000.0.000010/2025', 
    'Contratação de serviços de consultoria em TI para SEFAZ', 
    5, '2025-01-30', 4, 2, '010/2025', true, 180000.00, 9, '2025-03-10', false,
    '2025-03-05', '2025-02-20', '2025-03-08', 162000.00, 'Processo homologado com 10% de economicidade'
),
-- Processo 11: Aguardando Documentos
(
    '00000.0.000011/2025', 
    'Aquisição de equipamentos de laboratório para SESAU', 
    3, '2025-02-25', 5, 1, '011/2025', false, 420000.00, 3, '2025-03-01', false,
    NULL, NULL, NULL, NULL, 'Aguardando documentação complementar da unidade gestora'
),
-- Processo 12: Finalizado com alta economicidade
(
    '00000.0.000012/2025', 
    'Contratação de serviços de alimentação escolar para SEDUC', 
    2, '2025-01-05', 2, 2, '012/2025', true, 500000.00, 10, '2025-02-28', true,
    '2025-02-20', '2025-02-10', '2025-02-25', 400000.00, 'Processo finalizado com 20% de economicidade'
),
-- Processo 13: Deserto
(
    '00000.0.000013/2025', 
    'Aquisição de equipamentos de climatização para SETRAP', 
    4, '2025-02-12', 3, 1, '013/2025', false, 280000.00, 13, '2025-03-12', true,
    '2025-03-08', '2025-03-01', '2025-03-12', NULL, 'Processo deserto - nenhuma proposta apresentada'
),
-- Processo 14: Revogado
(
    '00000.0.000014/2025', 
    'Contratação de serviços de assessoria jurídica para SUPEL', 
    1, '2025-01-18', 1, 2, '014/2025', true, 120000.00, 14, '2025-02-10', true,
    NULL, NULL, NULL, NULL, 'Processo revogado por determinação superior'
),
-- Processo 15: Em Análise (mais recente)
(
    '00000.0.000015/2025', 
    'Aquisição de softwares de gestão para SEFAZ', 
    5, '2025-03-01', 4, 2, '015/2025', false, 320000.00, 2, '2025-03-05', false,
    NULL, NULL, NULL, NULL, 'Processo em análise técnica - prioridade alta'
);

-- Atualizar estatísticas das tabelas relacionadas
-- (Os triggers do banco devem atualizar automaticamente, mas podemos forçar uma atualização)
SELECT setval('processos_id_seq', (SELECT MAX(id) FROM processos)); 