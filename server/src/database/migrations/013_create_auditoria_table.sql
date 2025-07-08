-- Migração 013: Criar tabela de auditoria e funções
-- Data: 2024-12-27
-- Descrição: Cria a tabela auditoria_log e funções para capturar mudanças

-- Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS auditoria_log (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES users(id),
  usuario_email VARCHAR(255),
  usuario_nome VARCHAR(255),
  tabela_afetada VARCHAR(100) NOT NULL,
  operacao VARCHAR(10) NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id INTEGER,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON auditoria_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela_afetada ON auditoria_log(tabela_afetada);
CREATE INDEX IF NOT EXISTS idx_auditoria_operacao ON auditoria_log(operacao);

-- Função para capturar mudanças em tabelas
CREATE OR REPLACE FUNCTION audit_table()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_usuario_id INTEGER;
  v_usuario_email VARCHAR(255);
  v_usuario_nome VARCHAR(255);
  v_ip_address INET;
  v_user_agent TEXT;
BEGIN
  -- Obter informações do usuário atual (se disponível via variáveis de sessão)
  -- Estas informações serão preenchidas pelo middleware do Express
  BEGIN
    v_usuario_id := current_setting('app.current_user_id', true)::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_usuario_id := NULL;
  END;
  
  v_usuario_email := current_setting('app.current_user_email', true);
  v_usuario_nome := current_setting('app.current_user_nome', true);
  
  -- Tentar obter IP e User Agent (se disponível via variáveis de sessão)
  BEGIN
    v_ip_address := current_setting('app.current_ip_address', true)::INET;
  EXCEPTION WHEN OTHERS THEN
    v_ip_address := NULL;
  END;
  
  v_user_agent := current_setting('app.current_user_agent', true);
  
  -- Preparar dados antigos e novos
  IF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  END IF;
  
  -- Inserir log de auditoria
  INSERT INTO auditoria_log (
    usuario_id,
    usuario_email,
    usuario_nome,
    tabela_afetada,
    operacao,
    registro_id,
    dados_anteriores,
    dados_novos,
    ip_address,
    user_agent
  ) VALUES (
    v_usuario_id,
    v_usuario_email,
    v_usuario_nome,
    TG_TABLE_NAME,
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    v_old_data,
    v_new_data,
    v_ip_address,
    v_user_agent
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela processos
DROP TRIGGER IF EXISTS trigger_audit_processos ON processos;
CREATE TRIGGER trigger_audit_processos
  AFTER INSERT OR UPDATE OR DELETE ON processos
  FOR EACH ROW EXECUTE FUNCTION audit_table();

-- Aplicar trigger na tabela users
DROP TRIGGER IF EXISTS trigger_audit_users ON users;
CREATE TRIGGER trigger_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_table();

-- Aplicar trigger na tabela unidades_gestoras
DROP TRIGGER IF EXISTS trigger_audit_unidades_gestoras ON unidades_gestoras;
CREATE TRIGGER trigger_audit_unidades_gestoras
  AFTER INSERT OR UPDATE OR DELETE ON unidades_gestoras
  FOR EACH ROW EXECUTE FUNCTION audit_table();

-- Aplicar trigger na tabela responsaveis
DROP TRIGGER IF EXISTS trigger_audit_responsaveis ON responsaveis;
CREATE TRIGGER trigger_audit_responsaveis
  AFTER INSERT OR UPDATE OR DELETE ON responsaveis
  FOR EACH ROW EXECUTE FUNCTION audit_table();

-- Aplicar trigger na tabela modalidades
DROP TRIGGER IF EXISTS trigger_audit_modalidades ON modalidades;
CREATE TRIGGER trigger_audit_modalidades
  AFTER INSERT OR UPDATE OR DELETE ON modalidades
  FOR EACH ROW EXECUTE FUNCTION audit_table();

-- Aplicar trigger na tabela situacoes
DROP TRIGGER IF EXISTS trigger_audit_situacoes ON situacoes;
CREATE TRIGGER trigger_audit_situacoes
  AFTER INSERT OR UPDATE OR DELETE ON situacoes
  FOR EACH ROW EXECUTE FUNCTION audit_table();

-- Comentários
COMMENT ON TABLE auditoria_log IS 'Tabela para armazenar logs de auditoria de todas as operações CRUD';
COMMENT ON COLUMN auditoria_log.usuario_id IS 'ID do usuário que realizou a operação';
COMMENT ON COLUMN auditoria_log.ip_address IS 'Endereço IP do usuário';
COMMENT ON COLUMN auditoria_log.user_agent IS 'User Agent do navegador';
COMMENT ON COLUMN auditoria_log.dados_anteriores IS 'Dados antes da modificação (JSONB)';
COMMENT ON COLUMN auditoria_log.dados_novos IS 'Dados após a modificação (JSONB)'; 