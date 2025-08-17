-- Script para diagnosticar problemas de auditoria em localhost

-- Verificar se as tabelas existem
SELECT 'Tabelas existentes:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('auditoria_log', 'access_auth_logs', 'access_page_visits');

-- Verificar dados recentes de auditoria
SELECT 'Logs de auditoria recentes:' as info;
SELECT id, usuario_id, usuario_email, usuario_nome, ip_address, tabela_afetada, operacao, timestamp
FROM auditoria_log 
ORDER BY timestamp DESC 
LIMIT 10;

-- Verificar se há logs com N/A
SELECT 'Logs com N/A:' as info;
SELECT COUNT(*) as total_na
FROM auditoria_log 
WHERE usuario_email = 'N/A' OR usuario_nome = 'N/A';

-- Verificar se há logs com dados válidos
SELECT 'Logs com dados válidos:' as info;
SELECT COUNT(*) as total_validos
FROM auditoria_log 
WHERE usuario_email IS NOT NULL AND usuario_email != 'N/A';

-- Verificar triggers ativos
SELECT 'Triggers na tabela processos:' as info;
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'processos';

-- Verificar função audit_table
SELECT 'Função audit_table existe:' as info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'audit_table' AND routine_schema = 'public';

-- Testar as configurações atuais do PostgreSQL
SELECT 'Configurações de sessão atuais:' as info;
SELECT 
  current_setting('app.current_user_id', true) as user_id,
  current_setting('app.current_user_email', true) as user_email,
  current_setting('app.current_user_nome', true) as user_nome,
  current_setting('app.current_ip_address', true) as ip_address;
