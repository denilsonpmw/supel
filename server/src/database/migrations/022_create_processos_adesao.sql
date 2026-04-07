-- Criação da tabela processos_adesao
CREATE TABLE IF NOT EXISTS processos_adesao (
    id SERIAL PRIMARY KEY,
    nup VARCHAR(50) NOT NULL UNIQUE,
    objeto TEXT NOT NULL,
    ug_id INTEGER NOT NULL REFERENCES unidades_gestoras(id),
    valor DECIMAL(15,2) NOT NULL DEFAULT 0,
    fornecedor VARCHAR(255) NOT NULL,
    situacao_id INTEGER NOT NULL REFERENCES situacoes(id),
    data_entrada DATE NOT NULL,
    data_situacao DATE NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_processos_adesao_nup ON processos_adesao(nup);
CREATE INDEX IF NOT EXISTS idx_processos_adesao_ug ON processos_adesao(ug_id);
CREATE INDEX IF NOT EXISTS idx_processos_adesao_situacao ON processos_adesao(situacao_id);
CREATE INDEX IF NOT EXISTS idx_processos_adesao_data_entrada ON processos_adesao(data_entrada);

-- Aplicar trigger de updated_at
-- Nota: O trigger agora usa IF NOT EXISTS embutido ou apenas ignoramos o erro se já existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_processos_adesao_updated_at') THEN
        CREATE TRIGGER update_processos_adesao_updated_at 
        BEFORE UPDATE ON processos_adesao 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Adicionar permissão 'adesoes' aos usuários admin existentes
UPDATE users 
SET paginas_permitidas = array_append(paginas_permitidas, 'adesoes')
WHERE perfil = 'admin' AND NOT ('adesoes' = ANY(paginas_permitidas));
