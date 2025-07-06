-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('admin', 'usuario', 'visualizador')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de unidades gestoras
CREATE TABLE unidades_gestoras (
    id SERIAL PRIMARY KEY,
    sigla VARCHAR(20) NOT NULL UNIQUE,
    nome_completo_unidade VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de responsáveis
CREATE TABLE responsaveis (
    id SERIAL PRIMARY KEY,
    primeiro_nome VARCHAR(100) NOT NULL,
    nome_responsavel VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de equipe de apoio
CREATE TABLE equipe_apoio (
    id SERIAL PRIMARY KEY,
    primeiro_nome VARCHAR(100) NOT NULL,
    nome_apoio VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de modalidades
CREATE TABLE modalidades (
    id SERIAL PRIMARY KEY,
    sigla_modalidade VARCHAR(20) NOT NULL UNIQUE,
    nome_modalidade VARCHAR(255) NOT NULL,
    descricao_modalidade TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de situações
CREATE TABLE situacoes (
    id SERIAL PRIMARY KEY,
    nome_situacao VARCHAR(255) NOT NULL UNIQUE,
    descricao_situacao TEXT,
    eh_finalizadora BOOLEAN DEFAULT false,
    cor_hex VARCHAR(7) DEFAULT '#3498db',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de processos
CREATE TABLE processos (
    id SERIAL PRIMARY KEY,
    nup VARCHAR(50) NOT NULL UNIQUE,
    objeto TEXT NOT NULL,
    ug_id INTEGER NOT NULL REFERENCES unidades_gestoras(id),
    data_entrada DATE NOT NULL,
    responsavel_id INTEGER NOT NULL REFERENCES responsaveis(id),
    modalidade_id INTEGER NOT NULL REFERENCES modalidades(id),
    numero_ano VARCHAR(20) NOT NULL,
    rp BOOLEAN DEFAULT false,
    data_sessao DATE,
    data_pncp DATE,
    data_tce_1 DATE,
    valor_estimado DECIMAL(15,2) NOT NULL DEFAULT 0,
    valor_realizado DECIMAL(15,2),
    desagio DECIMAL(15,2),
    percentual_reducao DECIMAL(5,2),
    situacao_id INTEGER NOT NULL REFERENCES situacoes(id),
    data_situacao DATE NOT NULL,
    data_tce_2 DATE,
    conclusao BOOLEAN DEFAULT false,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de permissões
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, resource, action)
);

-- Índices para melhorar performance
CREATE INDEX idx_processos_nup ON processos(nup);
CREATE INDEX idx_processos_ug ON processos(ug_id);
CREATE INDEX idx_processos_responsavel ON processos(responsavel_id);
CREATE INDEX idx_processos_modalidade ON processos(modalidade_id);
CREATE INDEX idx_processos_situacao ON processos(situacao_id);
CREATE INDEX idx_processos_data_entrada ON processos(data_entrada);
CREATE INDEX idx_processos_valor_estimado ON processos(valor_estimado);
CREATE INDEX idx_processos_conclusao ON processos(conclusao);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_permissions_user_resource ON permissions(user_id, resource);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_unidades_gestoras_updated_at BEFORE UPDATE ON unidades_gestoras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_responsaveis_updated_at BEFORE UPDATE ON responsaveis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipe_apoio_updated_at BEFORE UPDATE ON equipe_apoio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modalidades_updated_at BEFORE UPDATE ON modalidades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_situacoes_updated_at BEFORE UPDATE ON situacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_processos_updated_at BEFORE UPDATE ON processos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular deságio e percentual de redução automaticamente
CREATE OR REPLACE FUNCTION calculate_desagio()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.valor_realizado IS NOT NULL AND NEW.valor_estimado > 0 THEN
        NEW.desagio = NEW.valor_estimado - NEW.valor_realizado;
        NEW.percentual_reducao = (NEW.desagio / NEW.valor_estimado) * 100;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_processo_desagio BEFORE INSERT OR UPDATE ON processos FOR EACH ROW EXECUTE FUNCTION calculate_desagio(); 