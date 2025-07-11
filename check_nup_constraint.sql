-- Script para verificar a constraint UNIQUE do NUP
-- Verificar se a constraint existe
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'processos' 
    AND kcu.column_name = 'nup'
    AND tc.constraint_type = 'UNIQUE';

-- Verificar se há NUP duplicados
SELECT nup, COUNT(*) as quantidade
FROM processos 
GROUP BY nup 
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- Verificar estrutura da tabela processos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'processos' 
    AND column_name = 'nup'; 