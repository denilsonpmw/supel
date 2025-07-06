-- Adiciona as colunas 'senha', 'primeiro_acesso' à tabela de usuários.

ALTER TABLE users ADD COLUMN IF NOT EXISTS senha VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT true;

COMMENT ON COLUMN users.senha IS 'Hash da senha do usuário (bcrypt)';
COMMENT ON COLUMN users.primeiro_acesso IS 'Indica se o usuário precisa definir a senha no primeiro acesso (true) ou se já definiu (false)'; 