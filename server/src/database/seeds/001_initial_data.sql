-- Inserir usuário administrador padrão
INSERT INTO users (email, nome, perfil) VALUES 
('admin@supel.gov.br', 'Administrador do Sistema', 'admin');

-- Inserir algumas unidades gestoras de exemplo
INSERT INTO unidades_gestoras (sigla, nome_completo_unidade) VALUES 
('SUPEL', 'Superintendência de Licitações'),
('SEDUC', 'Secretaria de Educação'),
('SESAU', 'Secretaria de Saúde'),
('SETRAP', 'Secretaria de Transportes'),
('SEFAZ', 'Secretaria da Fazenda');

-- Inserir modalidades padrão de licitação
INSERT INTO modalidades (sigla_modalidade, nome_modalidade, descricao_modalidade) VALUES 
('PP', 'Pregão Presencial', 'Modalidade de licitação para aquisição de bens e serviços comuns'),
('PE', 'Pregão Eletrônico', 'Modalidade de licitação eletrônica para aquisição de bens e serviços comuns'),
('CC', 'Concorrência', 'Modalidade de licitação entre quaisquer interessados'),
('TP', 'Tomada de Preços', 'Modalidade de licitação entre interessados cadastrados'),
('CV', 'Convite', 'Modalidade de licitação entre interessados escolhidos e convidados'),
('CP', 'Compra Direta', 'Aquisição direta sem licitação'),
('DP', 'Dispensa', 'Dispensa de licitação nos casos previstos em lei'),
('IN', 'Inexigibilidade', 'Inexigibilidade de licitação'),
('RDC', 'Regime Diferenciado de Contratações', 'Regime diferenciado aplicável a obras e serviços de engenharia');

-- Inserir situações padrão dos processos
INSERT INTO situacoes (nome_situacao, descricao_situacao, eh_finalizadora, cor_hex) VALUES 
('Recebido', 'Processo recebido na unidade', false, '#3498db'),
('Em Análise', 'Processo em análise técnica', false, '#f39c12'),
('Aguardando Documentos', 'Aguardando documentos complementares', false, '#e74c3c'),
('Aprovado', 'Processo aprovado para prosseguimento', false, '#2ecc71'),
('Em Publicação', 'Processo em fase de publicação', false, '#9b59b6'),
('Publicado', 'Edital publicado', false, '#1abc9c'),
('Em Sessão', 'Processo em sessão de licitação', false, '#f1c40f'),
('Adjudicado', 'Processo adjudicado ao vencedor', false, '#34495e'),
('Homologado', 'Processo homologado', false, '#27ae60'),
('Finalizado', 'Processo finalizado com sucesso', true, '#2ecc71'),
('Cancelado', 'Processo cancelado', true, '#95a5a6'),
('Fracassado', 'Processo fracassado', true, '#e74c3c'),
('Deserto', 'Processo deserto', true, '#bdc3c7'),
('Revogado', 'Processo revogado', true, '#7f8c8d');

-- Inserir alguns responsáveis de exemplo
INSERT INTO responsaveis (primeiro_nome, nome_responsavel, email) VALUES 
('João', 'João Silva Santos', 'joao.silva@supel.gov.br'),
('Maria', 'Maria Oliveira Costa', 'maria.oliveira@supel.gov.br'),
('Carlos', 'Carlos Pereira Lima', 'carlos.pereira@supel.gov.br'),
('Ana', 'Ana Souza Ferreira', 'ana.souza@supel.gov.br'),
('Pedro', 'Pedro Rodrigues Alves', 'pedro.rodrigues@supel.gov.br');

-- Inserir equipe de apoio de exemplo
INSERT INTO equipe_apoio (primeiro_nome, nome_apoio, email) VALUES 
('Lucas', 'Lucas Mendes Silva', 'lucas.mendes@supel.gov.br'),
('Juliana', 'Juliana Castro Rocha', 'juliana.castro@supel.gov.br'),
('Ricardo', 'Ricardo Santos Lima', 'ricardo.santos@supel.gov.br'),
('Fernanda', 'Fernanda Alves Costa', 'fernanda.alves@supel.gov.br'),
('Paulo', 'Paulo Henrique Dias', 'paulo.henrique@supel.gov.br');

-- NOTA: Os dados de processos foram movidos para o arquivo 003_processos_data.sql
-- para seguir a nova regra de formatação do NUP 