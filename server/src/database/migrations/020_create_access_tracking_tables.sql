-- Migration: Criar tabelas para tracking de acesso independente
-- Arquivo: 020_create_access_tracking_tables.sql

-- Tabela para logs de autenticação (login/logout)
CREATE TABLE IF NOT EXISTS access_auth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    event TEXT NOT NULL, -- login_success, login_fail, logout
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para tracking de páginas visitadas
CREATE TABLE IF NOT EXISTS access_page_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    path TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    enter_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    exit_at TIMESTAMPTZ NULL,
    session_id TEXT,
    -- Constraint para garantir que exit_at seja posterior a enter_at
    CONSTRAINT chk_exit_after_enter CHECK (exit_at IS NULL OR exit_at >= enter_at)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_access_auth_email_created ON access_auth_logs (email, created_at);
CREATE INDEX IF NOT EXISTS idx_access_auth_created ON access_auth_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_access_page_email_enter ON access_page_visits (email, enter_at);
CREATE INDEX IF NOT EXISTS idx_access_page_enter ON access_page_visits (enter_at);
CREATE INDEX IF NOT EXISTS idx_access_page_session_open ON access_page_visits (session_id) WHERE exit_at IS NULL;

-- Comentários para documentação
COMMENT ON TABLE access_auth_logs IS 'Logs independentes de eventos de autenticação (login/logout)';
COMMENT ON TABLE access_page_visits IS 'Tracking independente de páginas visitadas pelos usuários';
COMMENT ON COLUMN access_auth_logs.event IS 'Tipo de evento: login_success, login_fail, logout';
COMMENT ON COLUMN access_page_visits.path IS 'Caminho da página visitada (ex: /dashboard, /processos)';
COMMENT ON COLUMN access_page_visits.exit_at IS 'Hora de saída da página (NULL = ainda visualizando)';
