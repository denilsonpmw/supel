-- Script para corrigir a função de auditoria no ambiente local
-- Execute este script no banco local para corrigir o problema dos N/A

-- Primeiro, verificar se a função existe e o que ela contém
SELECT proname, prosrc FROM pg_proc WHERE proname = 'audit_table';

-- Recriar a função audit_table corretamente
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
  -- Obter informações do usuário atual das variáveis de sessão
  BEGIN
    v_usuario_id := current_setting('app.current_user_id', true)::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_usuario_id := NULL;
  END;
  
  BEGIN
    v_usuario_email := current_setting('app.current_user_email', true);
  EXCEPTION WHEN OTHERS THEN
    v_usuario_email := NULL;
  END;
  
  BEGIN
    v_usuario_nome := current_setting('app.current_user_nome', true);
  EXCEPTION WHEN OTHERS THEN
    v_usuario_nome := NULL;
  END;
  
  BEGIN
    v_ip_address := current_setting('app.current_ip_address', true)::INET;
  EXCEPTION WHEN OTHERS THEN
    v_ip_address := NULL;
  END;
  
  BEGIN
    v_user_agent := current_setting('app.current_user_agent', true);
  EXCEPTION WHEN OTHERS THEN
    v_user_agent := NULL;
  END;
  
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
  
  -- Retornar o registro apropriado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, não falhar a operação principal
    RAISE NOTICE 'Erro na auditoria: %', SQLERRM;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Verificar se o trigger existe e está ativo na tabela processos
SELECT 
  schemaname, 
  tablename, 
  triggername, 
  triggerfunc
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'processos'
AND n.nspname = 'public';

-- Se o trigger não existir, criar ele
DROP TRIGGER IF EXISTS processos_audit_trigger ON processos;
CREATE TRIGGER processos_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON processos
  FOR EACH ROW EXECUTE FUNCTION audit_table();

-- Testar as configurações atuais
SELECT 
  'Configurações de sessão:' as info,
  current_setting('app.current_user_id', true) as user_id,
  current_setting('app.current_user_email', true) as user_email,
  current_setting('app.current_user_nome', true) as user_nome;

-- Mostrar os últimos logs para verificar
SELECT 'Últimos logs de auditoria:' as info;
SELECT id, usuario_id, usuario_email, usuario_nome, tabela_afetada, operacao, timestamp
FROM auditoria_log 
ORDER BY timestamp DESC 
LIMIT 5;
