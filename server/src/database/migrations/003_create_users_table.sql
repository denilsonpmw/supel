-- Migração 003: Criar tabela de usuários simplificada
-- Data: 2024-12-27
-- Descrição: Sistema de permissões enxuto baseado em email

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  perfil VARCHAR(50) DEFAULT 'usuario' CHECK (perfil IN ('admin', 'usuario')),
  paginas_permitidas TEXT[] DEFAULT ARRAY['dashboard', 'processos', 'relatorios'],
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_perfil ON users(perfil);
CREATE INDEX IF NOT EXISTS idx_users_ativo ON users(ativo);

-- Inserir usuário administrador padrão
INSERT INTO users (email, nome, perfil, paginas_permitidas, ativo) 
VALUES (
  'denilson.pmw@gmail.com', 
  'Denilson Maciel', 
  'admin', 
  ARRAY['dashboard', 'processos', 'relatorios', 'modalidades', 'unidades-gestoras', 'responsaveis', 'situacoes', 'equipe-apoio', 'usuarios'],
  true
) ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  perfil = EXCLUDED.perfil,
  paginas_permitidas = EXCLUDED.paginas_permitidas,
  ativo = EXCLUDED.ativo,
  updated_at = NOW();

-- Inserir alguns usuários de teste baseados nos responsáveis existentes
INSERT INTO users (email, nome, perfil, paginas_permitidas, ativo)
SELECT 
  r.email,
  r.nome_responsavel,
  'usuario',
  ARRAY['dashboard', 'processos', 'relatorios'],
  r.ativo
FROM responsaveis r 
WHERE r.email IS NOT NULL 
  AND r.email != '' 
  AND r.email != 'denilson.pmw@gmail.com'
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE users IS 'Tabela de usuários do sistema com permissões simplificadas';
COMMENT ON COLUMN users.email IS 'Email único do usuário (chave de identificação)';
COMMENT ON COLUMN users.perfil IS 'Perfil do usuário: admin (acesso total) ou usuario (acesso restrito)';
COMMENT ON COLUMN users.paginas_permitidas IS 'Array com as páginas que o usuário pode acessar'; 