-- Migration: Criação das tabelas para sistema de analytics
-- Data: 2025-08-06
-- Descrição: Sistema completo de monitoramento de atividades de usuários

-- Tabela principal de eventos de analytics
CREATE TABLE IF NOT EXISTS user_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'page_view', 'click', 'search', 'report_generated', etc.
    event_category VARCHAR(100) NOT NULL, -- 'navigation', 'interaction', 'report', 'authentication'
    event_action VARCHAR(100) NOT NULL, -- 'login', 'view_dashboard', 'search_process', 'export_pdf'
    event_label VARCHAR(255), -- Informação adicional sobre o evento
    page_url VARCHAR(500),
    page_title VARCHAR(255),
    referrer VARCHAR(500),
    user_agent TEXT,
    ip_address INET,
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    screen_resolution VARCHAR(20),
    viewport_size VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Dados específicos do evento (JSON para flexibilidade)
    event_data JSONB,
    
    -- Métricas de performance
    page_load_time INTEGER, -- em milissegundos
    time_on_page INTEGER, -- em segundos
    
    -- Localização (se disponível)
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100)
);

-- Criando índices para user_analytics
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_session_id ON user_analytics (session_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics (event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_timestamp ON user_analytics (timestamp);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_category ON user_analytics (event_category);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_data_gin ON user_analytics USING GIN (event_data);

-- Tabela de sessões de usuários
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration INTEGER, -- em segundos, calculado quando a sessão termina
    page_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    user_agent TEXT,
    ip_address INET,
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    os_name VARCHAR(100),
    device_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- Criando índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start_time ON user_sessions (start_time);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions (is_active);

-- Tabela de métricas agregadas por usuário
CREATE TABLE IF NOT EXISTS user_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Métricas de atividade
    total_sessions INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- em segundos
    
    -- Métricas específicas do sistema
    reports_generated INTEGER DEFAULT 0,
    processes_viewed INTEGER DEFAULT 0,
    searches_performed INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    
    -- Horários de uso
    peak_hour INTEGER, -- hora do dia com mais atividade (0-23)
    
    -- Performance
    avg_page_load_time DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criando índices e constraint para user_metrics
CREATE UNIQUE INDEX IF NOT EXISTS uk_user_metrics_user_date ON user_metrics (user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_metrics_date ON user_metrics (date);
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_id ON user_metrics (user_id);

-- Tabela de eventos de relatórios (específica para o SUPEL)
CREATE TABLE IF NOT EXISTS report_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    report_type VARCHAR(100) NOT NULL, -- 'processos', 'usuarios', 'auditoria', etc.
    report_format VARCHAR(50), -- 'pdf', 'excel', 'csv'
    filters_used JSONB, -- Filtros aplicados no relatório
    total_records INTEGER, -- Número de registros no relatório
    generation_time INTEGER, -- Tempo para gerar o relatório (ms)
    file_size INTEGER, -- Tamanho do arquivo gerado (bytes)
    download_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criando índices para report_analytics
CREATE INDEX IF NOT EXISTS idx_report_analytics_user_id ON report_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_report_analytics_report_type ON report_analytics (report_type);
CREATE INDEX IF NOT EXISTS idx_report_analytics_created_at ON report_analytics (created_at);
CREATE INDEX IF NOT EXISTS idx_report_analytics_filters_gin ON report_analytics USING GIN (filters_used);

-- Tabela de pesquisas realizadas
CREATE TABLE IF NOT EXISTS search_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    search_query TEXT NOT NULL,
    search_context VARCHAR(100), -- 'processos', 'usuarios', 'global'
    results_count INTEGER,
    search_time INTEGER, -- Tempo da pesquisa (ms)
    clicked_result_position INTEGER, -- Posição do resultado clicado (se houver)
    no_results BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criando índices para search_analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_search_query ON search_analytics (search_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_search_context ON search_analytics (search_context);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics (created_at);

-- View para relatório consolidado de analytics
CREATE OR REPLACE VIEW analytics_dashboard AS
SELECT 
    -- Métricas gerais
    COUNT(DISTINCT ua.user_id) as total_active_users,
    COUNT(DISTINCT ua.session_id) as total_sessions,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE ua.event_type = 'page_view') as total_page_views,
    COUNT(*) FILTER (WHERE ua.event_type = 'click') as total_clicks,
    
    -- Métricas por período
    DATE_TRUNC('hour', ua.timestamp) as hour_bucket,
    DATE_TRUNC('day', ua.timestamp) as day_bucket,
    
    -- Métricas de relatórios
    COUNT(*) FILTER (WHERE ua.event_category = 'report') as reports_generated,
    
    -- Métricas de pesquisa
    COUNT(*) FILTER (WHERE ua.event_category = 'search') as searches_performed,
    
    -- Performance
    AVG(ua.page_load_time) as avg_page_load_time,
    AVG(ua.time_on_page) as avg_time_on_page,
    
    -- Dispositivos
    ua.device_type,
    ua.browser_name,
    ua.os_name
    
FROM user_analytics ua
WHERE ua.timestamp >= NOW() - INTERVAL '30 days'
GROUP BY 
    DATE_TRUNC('hour', ua.timestamp),
    DATE_TRUNC('day', ua.timestamp),
    ua.device_type,
    ua.browser_name,
    ua.os_name;

-- Função para limpar dados antigos (manter apenas últimos 90 dias para performance)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
    -- Remove eventos mais antigos que 90 dias
    DELETE FROM user_analytics 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Remove sessões mais antigas que 90 dias
    DELETE FROM user_sessions 
    WHERE start_time < NOW() - INTERVAL '90 days';
    
    -- Mantém métricas agregadas por mais tempo (1 ano)
    DELETE FROM user_metrics 
    WHERE date < NOW() - INTERVAL '1 year';
    
    -- Remove relatórios antigos (60 dias)
    DELETE FROM report_analytics 
    WHERE created_at < NOW() - INTERVAL '60 days';
    
    -- Remove pesquisas antigas (30 dias)
    DELETE FROM search_analytics 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE 'Limpeza de analytics concluída';
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE user_analytics IS 'Eventos detalhados de analytics dos usuários';
COMMENT ON TABLE user_sessions IS 'Sessões de usuários com métricas agregadas';
COMMENT ON TABLE user_metrics IS 'Métricas diárias agregadas por usuário';
COMMENT ON TABLE report_analytics IS 'Analytics específicos para geração de relatórios';
COMMENT ON TABLE search_analytics IS 'Analytics de pesquisas realizadas no sistema';
