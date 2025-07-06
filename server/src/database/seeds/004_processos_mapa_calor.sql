-- Inserir mais processos para testar o mapa de calor
-- Distribuindo em diferentes situações e prazos (críticos, medianos e baixos)

INSERT INTO processos (
  nup, objeto, ug_id, data_entrada, responsavel_id, modalidade_id, 
  numero_ano, valor_estimado, situacao_id, data_situacao
) VALUES 

-- PROCESSOS RECENTES (1-4 dias) - Baixa criticidade
('00000.0.000016/2025', 'Aquisição de material de escritório para SEDUC', 2, '2025-06-21', 1, 1, '001/2025', 15000, 1, '2025-06-21'),
('00000.0.000017/2025', 'Contratação de serviços de jardinagem para SUPEL', 1, '2025-06-22', 2, 2, '002/2025', 25000, 2, '2025-06-22'),
('00000.0.000018/2025', 'Aquisição de equipamentos de segurança para SESAU', 3, '2025-06-23', 3, 1, '003/2025', 35000, 1, '2025-06-23'),

-- PROCESSOS MEDIANOS (5-15 dias) - Criticidade média
('00000.0.000019/2025', 'Contratação de serviços de catering para eventos SUPEL', 1, '2025-06-10', 1, 2, '004/2025', 45000, 2, '2025-06-10'),
('00000.0.000020/2025', 'Aquisição de mobiliário escolar para SEDUC', 2, '2025-06-12', 2, 1, '005/2025', 85000, 3, '2025-06-12'),
('00000.0.000021/2025', 'Contratação de serviços de vigilância para SEFAZ', 4, '2025-06-08', 3, 2, '006/2025', 120000, 6, '2025-06-08'),
('00000.0.000022/2025', 'Aquisição de combustível para frota SETRAP', 5, '2025-06-14', 4, 1, '007/2025', 75000, 4, '2025-06-14'),
('00000.0.000023/2025', 'Contratação de serviços de limpeza hospitalar SESAU', 3, '2025-06-09', 1, 2, '008/2025', 95000, 2, '2025-06-09'),

-- PROCESSOS EM ATENÇÃO (16-30 dias) - Criticidade alta
('00000.0.000024/2025', 'Aquisição de equipamentos médicos para SESAU', 3, '2025-05-25', 2, 1, '009/2025', 450000, 3, '2025-05-25'),
('00000.0.000025/2025', 'Contratação de obras de reforma da SEDUC', 2, '2025-05-28', 3, 3, '010/2025', 380000, 6, '2025-05-28'),
('00000.0.000026/2025', 'Aquisição de veículos para SETRAP', 5, '2025-05-30', 4, 1, '011/2025', 280000, 7, '2025-05-30'),
('00000.0.000027/2025', 'Contratação de sistema de gestão para SEFAZ', 4, '2025-05-26', 1, 4, '012/2025', 320000, 2, '2025-05-26'),

-- PROCESSOS CRÍTICOS (31+ dias) - Criticidade muito alta
('00000.0.000028/2025', 'Contratação de serviços de engenharia para SUPEL', 1, '2025-04-15', 2, 3, '013/2025', 850000, 3, '2025-04-15'),
('00000.0.000029/2025', 'Aquisição de equipamentos de laboratório SESAU', 3, '2025-04-20', 3, 1, '014/2025', 680000, 2, '2025-04-20'),
('00000.0.000030/2025', 'Contratação de consultoria educacional SEDUC', 2, '2025-04-10', 4, 4, '015/2025', 420000, 6, '2025-04-10'),
('00000.0.000031/2025', 'Aquisição de software de gestão fiscal SEFAZ', 4, '2025-04-25', 1, 4, '016/2025', 520000, 3, '2025-04-25'),
('00000.0.000032/2025', 'Contratação de pavimentação de vias SETRAP', 5, '2025-04-05', 2, 3, '017/2025', 1200000, 7, '2025-04-05'),

-- PROCESSOS MUITO CRÍTICOS (45+ dias) - Emergenciais
('00000.0.000033/2025', 'Contratação de reforma do hospital central SESAU', 3, '2025-03-10', 3, 3, '018/2025', 2500000, 2, '2025-03-10'),
('00000.0.000034/2025', 'Aquisição de equipamentos de informática SEDUC', 2, '2025-03-15', 4, 1, '019/2025', 380000, 3, '2025-03-15'),
('00000.0.000035/2025', 'Contratação de auditoria externa SEFAZ', 4, '2025-03-05', 1, 4, '020/2025', 180000, 6, '2025-03-05'),

-- PROCESSOS EM DIFERENTES SITUAÇÕES - Para variar o mapa
('00000.0.000036/2025', 'Aquisição de uniformes escolares SEDUC', 2, '2025-05-20', 2, 1, '021/2025', 65000, 4, '2025-05-20'),
('00000.0.000037/2025', 'Contratação de transporte escolar SEDUC', 2, '2025-05-15', 3, 2, '022/2025', 240000, 7, '2025-05-15'),
('00000.0.000038/2025', 'Aquisição de medicamentos SESAU', 3, '2025-05-10', 4, 1, '023/2025', 150000, 8, '2025-05-10'),
('00000.0.000039/2025', 'Contratação de manutenção predial SUPEL', 1, '2025-05-05', 1, 2, '024/2025', 95000, 9, '2025-05-05'),
('00000.0.000040/2025', 'Aquisição de combustível para geradores SESAU', 3, '2025-04-30', 2, 1, '025/2025', 45000, 1, '2025-04-30'),

-- PROCESSOS AGUARDANDO DOCUMENTOS (situação crítica)
('00000.0.000041/2025', 'Contratação de segurança eletrônica SEFAZ', 4, '2025-04-18', 3, 2, '026/2025', 180000, 3, '2025-04-18'),
('00000.0.000042/2025', 'Aquisição de material hospitalar SESAU', 3, '2025-04-22', 4, 1, '027/2025', 220000, 3, '2025-04-22'),
('00000.0.000043/2025', 'Contratação de limpeza urbana SETRAP', 5, '2025-04-12', 1, 2, '028/2025', 320000, 3, '2025-04-12'),

-- PROCESSOS EM SESSÃO (situação ativa)
('00000.0.000044/2025', 'Aquisição de livros didáticos SEDUC', 2, '2025-05-08', 2, 1, '029/2025', 280000, 7, '2025-05-08'),
('00000.0.000045/2025', 'Contratação de obras de drenagem SETRAP', 5, '2025-05-12', 3, 3, '030/2025', 890000, 7, '2025-05-12'),

-- PROCESSOS PUBLICADOS (situação intermediária)
('00000.0.000046/2025', 'Aquisição de equipamentos de TI SUPEL', 1, '2025-05-18', 4, 1, '031/2025', 165000, 6, '2025-05-18'),
('00000.0.000047/2025', 'Contratação de consultoria jurídica SEFAZ', 4, '2025-05-22', 1, 4, '032/2025', 125000, 6, '2025-05-22'); 