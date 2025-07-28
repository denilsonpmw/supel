-- Cria tabela para relatórios personalizados de usuários
CREATE TABLE relatorios_personalizados (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50),
    campos JSONB NOT NULL,
    ordem_colunas JSONB,
    filtros JSONB,
    cor VARCHAR(20),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_relatorios_personalizados_usuario_id ON relatorios_personalizados(usuario_id);
