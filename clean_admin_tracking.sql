-- Script para limpar dados de tracking de administradores das tabelas

-- 1. Verificar quantos registros de admins existem nas tabelas
SELECT 'access_page_visits' as tabela, COUNT(*) as total_admin_records
FROM access_page_visits apv 
JOIN users u ON apv.email = u.email 
WHERE u.perfil = 'admin'
UNION ALL
SELECT 'access_auth_logs' as tabela, COUNT(*) as total_admin_records  
FROM access_auth_logs aal
JOIN users u ON aal.email = u.email
WHERE u.perfil = 'admin';

-- 2. EXECUTAR: Limpar dados antigos de administradores
BEGIN;

-- Deletar registros de page visits de administradores
DELETE FROM access_page_visits 
WHERE email IN (
    SELECT email FROM users WHERE perfil = 'admin'
);

-- Deletar registros de auth logs de administradores (exceto login_fail para segurança)
DELETE FROM access_auth_logs 
WHERE email IN (
    SELECT email FROM users WHERE perfil = 'admin'  
) AND event != 'login_fail';

COMMIT;

-- 3. Verificar resultado após limpeza
SELECT 'access_page_visits_AFTER' as tabela, COUNT(*) as remaining_admin_records
FROM access_page_visits apv 
JOIN users u ON apv.email = u.email 
WHERE u.perfil = 'admin'
UNION ALL
SELECT 'access_auth_logs_AFTER' as tabela, COUNT(*) as remaining_admin_records  
FROM access_auth_logs aal
JOIN users u ON aal.email = u.email
WHERE u.perfil = 'admin';
