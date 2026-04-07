CREATE TABLE IF NOT EXISTS microempresas_licitacoes (
    id SERIAL PRIMARY KEY,
    idlicitacao INTEGER NOT NULL,
    numero VARCHAR(50),
    ano INTEGER,
    tipo_licitacao VARCHAR(255),
    objeto TEXT,
    dataaterturard_date DATE,
    dataAbertura_date DATE,
    situacao VARCHAR(100),
    url_portal TEXT,
    cnpj VARCHAR(20),
    razaosocial VARCHAR(255),
    tipoempresa VARCHAR(50),
    declaracaome BOOLEAN DEFAULT FALSE,
    vencedor BOOLEAN DEFAULT FALSE,
    valor_estimado NUMERIC(15,2),
    valor_proposta NUMERIC(15,2),
    valor_negociado NUMERIC(15,2),
    data_sincronizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ug_id INTEGER REFERENCES unidades_gestoras(id)
);

CREATE INDEX idx_me_idlicitacao ON microempresas_licitacoes(idlicitacao);
CREATE INDEX idx_me_cnpj ON microempresas_licitacoes(cnpj);
CREATE INDEX idx_me_ug_id ON microempresas_licitacoes(ug_id);
