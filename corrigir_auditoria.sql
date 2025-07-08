-- Script para corrigir a função de auditoria
-- Execute: railway connect e depois copie/cole este script

-- Recriar a função audit_table com tratamento de erro
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

-- Verificar se a função foi atualizada
SELECT 'Função audit_table corrigida com sucesso!' as resultado; 