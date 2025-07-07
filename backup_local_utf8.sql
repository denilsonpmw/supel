--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: audit_table(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_table() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_usuario_id INTEGER := NULL;
    v_usuario_email VARCHAR(255) := NULL;
    v_usuario_nome VARCHAR(255) := NULL;
    v_ip_address INET := NULL;
    v_user_agent TEXT := NULL;
    v_tabela_nome VARCHAR(50);
BEGIN
    -- Captura das vari├íveis de sess├úo (se existirem)
    BEGIN
        v_usuario_id := current_setting('app.user_id', true)::INTEGER;
    EXCEPTION WHEN OTHERS THEN
        v_usuario_id := NULL;
    END;
    BEGIN
        v_usuario_email := current_setting('app.user_email', true);
    EXCEPTION WHEN OTHERS THEN
        v_usuario_email := NULL;
    END;
    BEGIN
        v_usuario_nome := current_setting('app.user_nome', true);
    EXCEPTION WHEN OTHERS THEN
        v_usuario_nome := NULL;
    END;
    BEGIN
        v_ip_address := current_setting('app.ip_address', true);
    EXCEPTION WHEN OTHERS THEN
        v_ip_address := NULL;
    END;
    BEGIN
        v_user_agent := current_setting('app.user_agent', true);
    EXCEPTION WHEN OTHERS THEN
        v_user_agent := NULL;
    END;

    v_tabela_nome := TG_TABLE_NAME;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria_log (
            usuario_id, usuario_email, usuario_nome,
            tabela_afetada, operacao, registro_id,
            dados_novos, ip_address, user_agent
        ) VALUES (
            v_usuario_id, v_usuario_email, v_usuario_nome,
            v_tabela_nome, 'INSERT', NEW.id,
            to_jsonb(NEW), v_ip_address, v_user_agent
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria_log (
            usuario_id, usuario_email, usuario_nome,
            tabela_afetada, operacao, registro_id,
            dados_anteriores, dados_novos, ip_address, user_agent
        ) VALUES (
            v_usuario_id, v_usuario_email, v_usuario_nome,
            v_tabela_nome, 'UPDATE', NEW.id,
            to_jsonb(OLD), to_jsonb(NEW), v_ip_address, v_user_agent
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria_log (
            usuario_id, usuario_email, usuario_nome,
            tabela_afetada, operacao, registro_id,
            dados_anteriores, ip_address, user_agent
        ) VALUES (
            v_usuario_id, v_usuario_email, v_usuario_nome,
            v_tabela_nome, 'DELETE', OLD.id,
            to_jsonb(OLD), v_ip_address, v_user_agent
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: calculate_desagio(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_desagio() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    IF NEW.valor_realizado IS NOT NULL AND NEW.valor_estimado > 0 THEN

        NEW.desagio = NEW.valor_estimado - NEW.valor_realizado;

        NEW.percentual_reducao = (NEW.desagio / NEW.valor_estimado) * 100;

    END IF;

    RETURN NEW;

END;

$$;


--
-- Name: get_current_user_info(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_user_info() RETURNS TABLE(user_id integer, user_email character varying, user_nome character varying)
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- Por enquanto retorna NULL, ser├â┬í implementado via contexto da aplica├â┬º├â┬úo

    RETURN QUERY SELECT NULL::INTEGER, NULL::VARCHAR(255), NULL::VARCHAR(255);

END;

$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auditoria_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditoria_log (
    id integer NOT NULL,
    usuario_id integer,
    usuario_email character varying(255),
    usuario_nome character varying(255),
    tabela_afetada character varying(50) NOT NULL,
    operacao character varying(20) NOT NULL,
    registro_id integer,
    dados_anteriores jsonb,
    dados_novos jsonb,
    ip_address inet,
    user_agent text,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: auditoria_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditoria_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditoria_log_id_seq OWNED BY public.auditoria_log.id;


--
-- Name: equipe_apoio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipe_apoio (
    id integer NOT NULL,
    primeiro_nome character varying(100) NOT NULL,
    nome_apoio character varying(255) NOT NULL,
    email character varying(255),
    telefone character varying(20),
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: equipe_apoio_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipe_apoio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipe_apoio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipe_apoio_id_seq OWNED BY public.equipe_apoio.id;


--
-- Name: modalidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modalidades (
    id integer NOT NULL,
    sigla_modalidade character varying(20) NOT NULL,
    nome_modalidade character varying(255) NOT NULL,
    descricao_modalidade text,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cor_hex character varying(7) DEFAULT '#3498db'::character varying
);


--
-- Name: modalidades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.modalidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modalidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.modalidades_id_seq OWNED BY public.modalidades.id;


--
-- Name: processos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processos (
    id integer NOT NULL,
    nup character varying(50) NOT NULL,
    objeto text NOT NULL,
    ug_id integer NOT NULL,
    data_entrada date NOT NULL,
    responsavel_id integer NOT NULL,
    modalidade_id integer NOT NULL,
    numero_ano character varying(20),
    rp boolean DEFAULT false,
    data_sessao date,
    data_pncp date,
    data_tce_1 date,
    valor_estimado numeric(15,2) DEFAULT 0 NOT NULL,
    valor_realizado numeric(15,2),
    desagio numeric(15,2),
    percentual_reducao double precision,
    situacao_id integer NOT NULL,
    data_situacao date NOT NULL,
    data_tce_2 date,
    conclusao boolean DEFAULT false,
    observacoes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: COLUMN processos.numero_ano; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.processos.numero_ano IS 'N├║mero/Ano do processo (opcional)';


--
-- Name: processos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.processos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: processos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.processos_id_seq OWNED BY public.processos.id;


--
-- Name: responsaveis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.responsaveis (
    id integer NOT NULL,
    primeiro_nome character varying(100) NOT NULL,
    nome_responsavel character varying(255) NOT NULL,
    email character varying(255),
    telefone character varying(20),
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: responsaveis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.responsaveis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: responsaveis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.responsaveis_id_seq OWNED BY public.responsaveis.id;


--
-- Name: situacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.situacoes (
    id integer NOT NULL,
    nome_situacao character varying(255) NOT NULL,
    descricao_situacao text,
    eh_finalizadora boolean DEFAULT false,
    cor_hex character varying(7) DEFAULT '#3498db'::character varying,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: situacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.situacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: situacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.situacoes_id_seq OWNED BY public.situacoes.id;


--
-- Name: unidades_gestoras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades_gestoras (
    id integer NOT NULL,
    sigla character varying(20) NOT NULL,
    nome_completo_unidade character varying(255) NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: unidades_gestoras_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unidades_gestoras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unidades_gestoras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unidades_gestoras_id_seq OWNED BY public.unidades_gestoras.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    nome character varying(255) NOT NULL,
    google_id character varying(255),
    perfil character varying(20) NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    senha character varying(255),
    paginas_permitidas text[],
    reset_token character varying(255),
    reset_token_expires timestamp without time zone,
    primeiro_acesso boolean DEFAULT true,
    CONSTRAINT users_perfil_check CHECK (((perfil)::text = ANY ((ARRAY['admin'::character varying, 'usuario'::character varying, 'visualizador'::character varying])::text[])))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'Atualiza├º├úo para incluir permiss├úo de configuracoes aos administradores';


--
-- Name: COLUMN users.senha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.senha IS 'Hash da senha do usu├írio (bcrypt)';


--
-- Name: COLUMN users.paginas_permitidas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.paginas_permitidas IS 'Array com as p├íginas que o usu├írio pode acessar (incluindo auditoria para admins)';


--
-- Name: COLUMN users.primeiro_acesso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.primeiro_acesso IS 'Indica se o usu├írio precisa definir a senha no primeiro acesso (true) ou se j├í definiu (false)';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: auditoria_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_log ALTER COLUMN id SET DEFAULT nextval('public.auditoria_log_id_seq'::regclass);


--
-- Name: equipe_apoio id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipe_apoio ALTER COLUMN id SET DEFAULT nextval('public.equipe_apoio_id_seq'::regclass);


--
-- Name: modalidades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modalidades ALTER COLUMN id SET DEFAULT nextval('public.modalidades_id_seq'::regclass);


--
-- Name: processos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos ALTER COLUMN id SET DEFAULT nextval('public.processos_id_seq'::regclass);


--
-- Name: responsaveis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsaveis ALTER COLUMN id SET DEFAULT nextval('public.responsaveis_id_seq'::regclass);


--
-- Name: situacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.situacoes ALTER COLUMN id SET DEFAULT nextval('public.situacoes_id_seq'::regclass);


--
-- Name: unidades_gestoras id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_gestoras ALTER COLUMN id SET DEFAULT nextval('public.unidades_gestoras_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: auditoria_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auditoria_log (id, usuario_id, usuario_email, usuario_nome, tabela_afetada, operacao, registro_id, dados_anteriores, dados_novos, ip_address, user_agent, "timestamp") FROM stdin;
1	11	denilson@supel.gov	Denilson Alves Maciel	processos	UPDATE	508	{"id": 508, "rp": false, "nup": "00001.0.011291/2025", "ug_id": 3, "objeto": "AQUISI├ç├âO DE MATERIAIS DE COPA E COZINHA", "desagio": null, "conclusao": false, "data_pncp": "2025-06-11", "created_at": "2025-07-04T00:35:53.20343", "data_tce_1": null, "data_tce_2": null, "numero_ano": "061/2025", "updated_at": "2025-07-05T14:57:54.037543", "data_sessao": "2025-06-16", "observacoes": "", "situacao_id": 10, "data_entrada": "2025-06-03", "data_situacao": "2025-06-27", "modalidade_id": 12, "responsavel_id": 8, "valor_estimado": 59630.00, "valor_realizado": null, "percentual_reducao": null}	{"id": 508, "rp": false, "nup": "00001.0.011291/2025", "ug_id": 3, "objeto": "AQUISI├ç├âO DE MATERIAIS DE COPA E COZINHA", "desagio": null, "conclusao": false, "data_pncp": "2025-06-11", "created_at": "2025-07-04T00:35:53.20343", "data_tce_1": null, "data_tce_2": null, "numero_ano": "061/2025", "updated_at": "2025-07-05T15:10:28.31029", "data_sessao": "2025-06-16", "observacoes": "", "situacao_id": 7, "data_entrada": "2025-06-03", "data_situacao": "2025-06-27", "modalidade_id": 12, "responsavel_id": 8, "valor_estimado": 59630.00, "valor_realizado": null, "percentual_reducao": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-07-05 15:10:28.31029
2	2	denilson.pmw@gmail.com	Denilson Maciel	processos	UPDATE	479	{"id": 479, "rp": false, "nup": "00000.0.046622/2025", "ug_id": 3, "objeto": "REALIZA├ç├âO DO EXAME HISTEROSCOPIA (DIAGNOSTICA COM BIOPSIA), PARA ATENDER A DECIS├âO JUDICIAL", "desagio": null, "conclusao": false, "data_pncp": "2025-07-01", "created_at": "2025-07-04T00:28:16.845878", "data_tce_1": "2025-07-01", "data_tce_2": null, "numero_ano": "076/2025", "updated_at": "2025-07-04T00:28:16.845878", "data_sessao": "2025-07-04", "observacoes": null, "situacao_id": 8, "data_entrada": "2025-06-27", "data_situacao": "2025-07-01", "modalidade_id": 12, "responsavel_id": 19, "valor_estimado": 1400.00, "valor_realizado": null, "percentual_reducao": null}	{"id": 479, "rp": false, "nup": "00001.0.046622/2025", "ug_id": 3, "objeto": "REALIZA├ç├âO DO EXAME HISTEROSCOPIA (DIAGNOSTICA COM BIOPSIA), PARA ATENDER A DECIS├âO JUDICIAL", "desagio": null, "conclusao": false, "data_pncp": "2025-07-01", "created_at": "2025-07-04T00:28:16.845878", "data_tce_1": "2025-07-01", "data_tce_2": null, "numero_ano": "076/2025", "updated_at": "2025-07-05T15:52:46.808463", "data_sessao": "2025-07-04", "observacoes": "", "situacao_id": 3, "data_entrada": "2025-06-27", "data_situacao": "2025-07-04", "modalidade_id": 12, "responsavel_id": 19, "valor_estimado": 1400.00, "valor_realizado": null, "percentual_reducao": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-07-05 15:52:46.808463
\.


--
-- Data for Name: equipe_apoio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipe_apoio (id, primeiro_nome, nome_apoio, email, telefone, ativo, created_at, updated_at) FROM stdin;
6	Hildegardis	Hildegardis Mendes de Ara├║jo	\N	\N	t	2025-06-29 22:00:33.959889	2025-06-29 22:00:33.959889
7	Pedro Wilson	Pedro Wilson Nascimento Silva	\N	\N	t	2025-06-29 22:00:55.051098	2025-06-29 22:00:55.051098
\.


--
-- Data for Name: modalidades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modalidades (id, sigla_modalidade, nome_modalidade, descricao_modalidade, ativo, created_at, updated_at, cor_hex) FROM stdin;
10	CC	Concorr├¬ncia	Modalidade mais ampla, podendo ser utilizada para contrata├º├úo de bens, servi├ºos, obras e aliena├º├Áes de qualquer valor	t	2025-06-29 21:52:35.190611	2025-07-03 18:46:46.004653	#e74c3c
11	CR	Credenciamento	Procedimento auxiliar para cadastrar e habilitar potenciais fornecedores que atendam a determinados requisitos	t	2025-06-29 21:54:46.170123	2025-07-03 18:46:52.475651	#9b59b6
13	PE	Preg├úo Eletr├┤nico	Modalidade utilizada para aquisi├º├úo de bens e servi├ºos comuns, ou seja, aqueles cujos padr├Áes de desempenho e qualidade podem ser objetivamente definidos no edital	t	2025-06-29 21:58:44.113372	2025-07-03 18:47:12.348507	#f1c40f
12	DE	Dispensa Eletr├┤nica	Procedimento cujo tem a possibilidade de contratar sem realizar um processo licitat├│rio, quando a lei permite. 	t	2025-06-29 21:57:51.748789	2025-07-03 18:51:52.00992	#2ecc71
\.


--
-- Data for Name: processos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.processos (id, nup, objeto, ug_id, data_entrada, responsavel_id, modalidade_id, numero_ano, rp, data_sessao, data_pncp, data_tce_1, valor_estimado, valor_realizado, desagio, percentual_reducao, situacao_id, data_situacao, data_tce_2, conclusao, observacoes, created_at, updated_at) FROM stdin;
408	00000.0.018493/2024	CONSTRU├ç├âO DE CAMPO DE FUTEBOL GRAMADO NO DISTRITO DE TAQUARU├çU - PALMAS -TO	11	2024-08-16	12	10	002/2024	f	2024-06-21	\N	\N	1070063.00	1011590.00	58473.00	5.4644446168122816	7	2025-05-29	\N	f	\N	2025-07-04 00:28:16.177557	2025-07-04 00:28:16.177557
409	00000.0.049962/2024	AQUISI├ç├âO DE EQUIPAMENTOS DE INFORM├üTICA	25	2024-09-18	9	13	031/2024	f	2024-10-31	2024-10-11	\N	456061.00	280512.00	175549.00	38.492438511514905	2	2025-06-06	\N	f	\N	2025-07-04 00:28:16.212104	2025-07-04 00:28:16.212104
410	00000.0.005916/2025	AQUISI├ç├âO  DE A├çUCAR, CAF├ë, ADO├çANTE E OUTROS	12	2025-02-06	18	12	003/2025	f	2025-02-14	2025-02-11	2025-02-11	41317.00	33835.00	7482.00	18.108768787666094	10	2025-02-20	2025-02-19	t	\N	2025-07-04 00:28:16.2398	2025-07-04 00:28:16.2398
411	00000.0.037643/2024	AQUISI├ç├âO E RECARGA DE G├üS GLP DE 13 KG E 45 KG	3	2025-01-28	9	13	002/2025	t	2025-02-19	2025-02-06	2025-02-07	364065.00	303389.00	60676.00	16.66625465232857	10	2025-04-23	2025-04-23	t	\N	2025-07-04 00:28:16.248569	2025-07-04 00:28:16.248569
412	00000.0.002317/2025	AQUISI├ç├âO DE ├üGUA MINERAL, GELO E G├üS	12	2025-02-07	20	12	004/2025	f	2025-02-19	2025-02-14	2025-02-17	27707.00	18180.00	9527.00	34.38481250225575	10	2025-03-07	2025-03-06	t	\N	2025-07-04 00:28:16.256642	2025-07-04 00:28:16.256642
413	00000.0.061831/2025	AQUISI├ç├âO DE MOBILI├üRIO - CASA DA MULHER BRASILEIRA, TIPOLOGIA II	23	2025-01-14	9	13	050/2024	t	2025-02-21	2025-02-10	2025-02-10	706662.00	660861.00	45801.00	6.481316386051606	10	2025-03-28	2025-03-28	t	\N	2025-07-04 00:28:16.265565	2025-07-04 00:28:16.265565
414	00000.0.080592/2024	AQUISI├ç├âO DE ARTEFATOS DE CONCRETO (TUBOS, GRELHAS, BOCA DE LOBO, CANALETA, ADUELAS	22	2025-01-23	10	13	003/2025	t	2025-02-21	2025-02-10	2025-02-10	2258526.00	1750385.00	508141.00	22.4987890332013	10	2025-05-02	2025-05-02	t	\N	2025-07-04 00:28:16.273676	2025-07-04 00:28:16.273676
415	00000.0.032231/2024	AQUISI├ç├âO DE PRODUTOS DE HIGIENE PESSOAL	23	2025-01-14	9	13	001/2025	t	2025-02-24	2025-02-12	2025-02-12	440899.00	108719.00	332180.00	75.34151812546638	10	2025-05-19	2025-05-09	t	\N	2025-07-04 00:28:16.282051	2025-07-04 00:28:16.282051
416	00000.0.008099/2025	AQUISI├ç├âO DE ELETRODOM├ëSTICOS - BEBEDOUROS, FRIGOBAR, GLADEIRA, FOG├âO, MICROONDAS E OUTROS	12	2025-02-13	20	12	005/2025	f	2025-02-27	2025-02-24	2025-02-24	58372.00	53143.00	5229.00	8.95806208456109	10	2025-03-06	2025-03-06	t	\N	2025-07-04 00:28:16.292026	2025-07-04 00:28:16.292026
417	00000.0.009047/2025	FORNECIMENTO DE COFFE BREAK	25	2025-02-24	18	12	006/2025	f	2025-03-06	2025-05-26	2025-02-26	60735.00	59925.00	810.00	1.3336626327488268	10	2025-03-12	2025-03-12	t	\N	2025-07-04 00:28:16.301042	2025-07-04 00:28:16.301042
418	00000.0.064076/2024	AQUISI├ç├âO DE G├èNEROS ALIMENT├ìCIOS PEREC├ìVEIS E N├âO PEREC├ìVEIS DESTINADOS AO SUPRIMENTO DE PROGRAMAS	23	2025-01-17	14	13	004/2025	f	2025-03-07	2025-02-19	2025-02-20	1062970.00	949459.00	113511.00	10.67866449664619	10	2025-05-22	2025-05-08	t	\N	2025-07-04 00:28:16.315897	2025-07-04 00:28:16.315897
419	00000.0.067252/2024	AQUISI├ç├âO DE MATERIAL ESCOLAR E PEDAG├ôGICO	23	2025-01-17	12	13	005/2025	f	2025-03-10	2025-02-21	2025-02-21	105649.00	\N	\N	\N	2	2025-07-02	\N	f	\N	2025-07-04 00:28:16.325647	2025-07-04 00:28:16.325647
420	00000.0.006904/2025	AQUISI├ç├âO DE CERTIFICADO DIGITAL A3	15	2025-03-17	18	12	009/2025	f	2025-03-10	2025-02-28	2025-02-28	3645.00	3642.00	3.00	0.0823045267489712	10	2025-03-26	2025-03-26	t	\N	2025-07-04 00:28:16.336481	2025-07-04 00:28:16.336481
421	00000.0.047896/2024	REFORMA DAS HORTAS COMUNITARIAS DO TAQUARI, AURENY II, 1006 SUL E OUTRAS	24	2025-02-12	12	13	006/2025	f	2025-03-11	2025-02-21	2025-02-21	281592.00	211194.00	70398.00	25	10	2025-06-05	2025-06-05	t	\N	2025-07-04 00:28:16.344642	2025-07-04 00:28:16.344642
422	00000.0.010821/2025	AQUISI├ç├âO DE ├üGUA MINERAL.	24	2025-03-06	18	12	012/2025	f	2025-03-14	2025-03-11	2025-03-11	19952.00	16216.00	3736.00	18.72493985565357	10	2025-03-25	2025-03-25	t	\N	2025-07-04 00:28:16.361247	2025-07-04 00:28:16.361247
423	00000.0.012813/2025	AQUISI├ç├âO DE ├üGUA MINERAL E G├üS GLP	1	2025-03-17	20	12	015/2025	f	2025-03-27	2025-03-21	2025-03-21	7612.00	4590.00	3022.00	39.700472937467154	10	2025-04-09	2025-04-09	t	\N	2025-07-04 00:28:16.386072	2025-07-04 00:28:16.386072
424	00000.0.013472/2025	AQUISI├ç├âO DE AR CONDICIONADO, GELADEIRA, FRIGOBAR FORNO, MAT. COPA	26	2025-03-24	19	12	021/2025	f	2025-03-31	2025-03-26	2025-03-26	57893.00	41791.00	16102.00	27.813379855941132	10	2025-04-08	2025-04-08	t	\N	2025-07-04 00:28:16.395649	2025-07-04 00:28:16.395649
425	00000.0.008429/2025	MANUTEN├ç├âO PREVENTIVA E CORRETIVA EM PURIFICADORES DE AGUA	4	2025-03-24	18	12	022/2025	f	2025-03-31	2025-03-26	2025-03-27	32560.00	25944.00	6616.00	20.31941031941032	10	2025-04-22	2025-04-22	t	\N	2025-07-04 00:28:16.400337	2025-07-04 00:28:16.400337
426	00000.0.004978/2025	AQUISI├ç├âO DE CIMENTO E CAL	22	2025-02-24	11	13	008/2025	t	2025-04-01	2025-03-20	2025-03-20	220545.00	162328.00	58217.00	26.396880455235895	10	2025-05-09	2025-05-09	t	\N	2025-07-04 00:28:16.406438	2025-07-04 00:28:16.406438
427	00000.0.033169/2024	SERVI├çOS DE MANUTEN├ç├âO PREVENTIVA E CORRETIVA E CONDICIONADORES AR	28	2025-02-11	10	13	053/2024	t	2025-04-03	2025-02-25	2025-03-18	3562053.00	1118040.00	2444013.00	68.6124827452034	10	2025-06-03	2025-06-03	t	\N	2025-07-04 00:28:16.411844	2025-07-04 00:28:16.411844
428	00000.0.016165/2025	AQUISI├ç├âO DE CAF├ë MOIDO	7	2025-03-28	19	12	024/2025	f	2025-04-04	2025-03-31	2025-04-01	8316.00	\N	\N	\N	12	2025-05-15	\N	f	\N	2025-07-04 00:28:16.417238	2025-07-04 00:28:16.417238
429	00000.0.018579/2025	AQUISI├ç├âO DE CAF├ë, A├çUCAR, ADO├çANTE, LEITE EM P├ô E OUTROS	25	2025-04-04	19	12	027/2025	f	2025-04-09	2025-04-04	2025-04-04	58249.00	48396.00	9853.00	16.915311850847225	10	2025-04-23	2025-04-23	t	\N	2025-07-04 00:28:16.427863	2025-07-04 00:28:16.427863
430	00000.0.011337/2025	SERVI├çOS DE AN├üLISE DE SOLOS	24	2025-03-31	19	12	026/2025	f	2025-04-09	2025-04-03	2025-04-04	49796.00	42600.00	7196.00	14.450959916459153	10	2025-04-25	2025-04-25	t	\N	2025-07-04 00:28:16.434922	2025-07-04 00:28:16.434922
431	00000.0.012380/2025	AQUISI├ç├âO DE MATERIAIS DE LIMPEZA E HIGIENE	24	2025-04-07	19	12	029/2025	f	2025-04-14	2025-04-08	2025-04-08	24407.00	12380.00	12027.00	49.27684680624411	10	2025-04-24	2025-04-24	t	\N	2025-07-04 00:28:16.442145	2025-07-04 00:28:16.442145
432	00000.0.020570/2025	AQUISI├ç├âO E INSTALA├ç├âO DE AR CONDICIONADO	5	2025-04-01	18	12	030/2025	f	2025-04-16	2025-04-11	2025-04-11	23840.00	21717.00	2123.00	8.90520134228188	10	2025-05-06	2025-05-06	t	\N	2025-07-04 00:28:16.451696	2025-07-04 00:28:16.451696
433	00000.0.020966/2025	LOCA├ç├âO DE EQUIPAMENTOS PARA FESTIVIDADES	12	2025-04-25	20	12	032/2025	f	2025-04-23	2025-04-15	2025-04-15	52200.00	47265.00	4935.00	9.454022988505747	10	2025-04-15	2025-04-24	t	\N	2025-07-04 00:28:16.464295	2025-07-04 00:28:16.464295
434	00000.0.007947/2025	AQUISI├ç├âO DE INSUMOS DE ENFERMAGEM	3	2025-03-27	15	13	010/2025	t	2025-04-24	2025-04-09	2025-04-09	7379015.00	3847958.00	3531057.00	47.85268765546621	10	2025-07-01	2025-07-01	t	\N	2025-07-04 00:28:16.469868	2025-07-04 00:28:16.469868
435	00000.0.007959/2025	AQUISI├ç├âO DE INSULINAS	3	2025-04-03	12	13	012/2025	t	2025-04-28	2025-04-11	2025-04-11	1118222.00	\N	\N	\N	9	2025-06-23	\N	f	\N	2025-07-04 00:28:16.476942	2025-07-04 00:28:16.476942
436	00000.0.006090/2025	AQUISC├âO DE MEDICAMENTOS REMUNE - CAPS - CONTROLADOS - AZITROMICINA, BECLOMETASONA, DIPIRONA S├ôDICA E OUTROS.	3	2025-04-08	14	13	014/2025	t	2025-04-30	2025-04-15	2025-04-15	821441.00	\N	\N	\N	7	2025-06-02	\N	f	\N	2025-07-04 00:28:16.487914	2025-07-04 00:28:16.487914
437	00000.0.020305/2025	AQUISI├ç├âO DE MATERIAIS DE EXPEDIENTES (CANETAS, GRAMPEADOR ETC.)	10	2025-04-25	18	12	039/2025	f	2025-05-05	2025-04-29	2025-04-30	6736.00	6132.00	604.00	8.966745843230404	10	2025-05-15	2025-05-15	t	\N	2025-07-04 00:28:16.499342	2025-07-04 00:28:16.499342
438	00000.0.023831/2025	AQUISI├ç├âO DE A├çUCAR, CAF├ë E AGUA MINERAL	27	2025-04-28	18	12	041/2025	f	2025-05-07	2025-05-02	2025-05-02	27762.00	20789.00	6973.00	25.117066493768462	10	2025-05-19	2025-05-19	t	\N	2025-07-04 00:28:16.508417	2025-07-04 00:28:16.508417
439	00000.0.007042/2025	AQUISI├ç├âO DE UNIFORMES PARA ELETRICISTAS	22	2025-04-16	11	13	009/2025	t	2025-05-13	2025-03-31	2025-03-28	115828.00	\N	\N	\N	7	2025-06-26	\N	f	\N	2025-07-04 00:28:16.519075	2025-07-04 00:28:16.519075
440	00000.0.010763/2025	AQUISI├ç├âO DE INSUMOS DE ENFERMAGEM (AVENTAL, TUBO DE SILICONE, CAMPO CIRURGICO)	3	2025-04-15	14	13	016/2025	t	2025-05-14	2025-04-29	2025-04-29	3510473.00	\N	\N	\N	7	2025-06-26	\N	f	\N	2025-07-04 00:28:16.526369	2025-07-04 00:28:16.526369
441	00000.0.026212/2025	AQUISI├ç├âO DE BANDEIRAS OFICIAIS PALMAS, TOCANTINS, BRASIL E MASTRO PARA	12	2025-05-08	18	12	046/2025	f	2025-05-14	2025-05-09	2025-05-13	30586.00	\N	\N	\N	13	2025-05-14	2025-05-14	f	\N	2025-07-04 00:28:16.534485	2025-07-04 00:28:16.534485
442	00000.0.029447/2025	AQUISI├ç├âO DE CAMISAS, CANETAS, ECOBAGS E COPOS DESCART├üVEIS	12	2025-05-09	19	12	047/2025	f	2025-05-15	2025-05-12	2025-05-12	8921.00	8160.00	761.00	8.530433807869073	10	2025-05-16	\N	t	\N	2025-07-04 00:28:16.541058	2025-07-04 00:28:16.541058
443	00000.0.008069/2025	LOCA├ç├âO LICEN├çA DE DIREITO DE USO  DE SOFTWARE ESPECIFICO EM GEST├âO PREVIDENCIARIA	14	2025-04-08	11	13	018/2025	f	2025-05-23	2025-05-07	2025-05-07	3907858.00	\N	\N	\N	7	2025-06-30	\N	f	\N	2025-07-04 00:28:16.549375	2025-07-04 00:28:16.549375
444	00000.0.007795/2025	SERVI├çOS DE MUDAN├çA PARA NOVA SEDE DA SEMOB	4	2025-05-12	19	12	050/2025	f	2025-05-26	2025-05-19	2025-05-21	45343.00	45000.00	343.00	0.7564563438678517	10	2025-06-23	2025-06-23	t	\N	2025-07-04 00:28:16.554444	2025-07-04 00:28:16.554444
445	00000.0.023756/2025	AQUISI├ç├âO DE GRAMA ESMERALDA	26	2025-04-30	11	13	017/2025	t	2025-05-28	2025-05-09	2025-05-09	3897500.00	\N	\N	\N	2	2025-06-23	\N	f	\N	2025-07-04 00:28:16.560874	2025-07-04 00:28:16.560874
446	00000.0.015586/2025	AQUISI├ç├âO DE UNIFORMES PARA AGENTES DE TR├éNSITO	4	2025-04-16	15	13	019/2025	t	2025-05-28	2025-05-09	2025-05-09	1784246.00	\N	\N	\N	2	2025-06-11	\N	f	\N	2025-07-04 00:28:16.56529	2025-07-04 00:28:16.56529
447	00000.0.027146/2025	SERVI├çOS DE BUFFET E COFFE BREAK	19	2025-05-08	10	13	021/2025	t	2025-05-30	2025-05-14	2025-05-14	828847.00	\N	\N	\N	9	2025-06-11	\N	f	\N	2025-07-04 00:28:16.575851	2025-07-04 00:28:16.575851
448	00000.0.016658/2025	LOCA├ç├âO DE BANHEIROS QUIMICOS TIPO TRAILLER	4	2025-05-12	12	13	020/2025	t	2025-05-30	2025-05-14	2025-05-14	3766488.00	\N	\N	\N	17	2025-06-05	\N	f	\N	2025-07-04 00:28:16.58087	2025-07-04 00:28:16.58087
449	00000.0.030185/2025	AQUISI├ç├âO DE CERTIFICADOS DIGITAIS PARA PESSOA F├ìSICA, MODELO A3 C/ TOKEN	18	2025-05-29	19	12	052/2025	f	2025-06-05	2025-05-30	2025-06-02	2662.00	2237.00	425.00	15.965439519158528	10	2025-06-09	2025-06-09	t	\N	2025-07-04 00:28:16.588786	2025-07-04 00:28:16.588786
450	00000.0.028836/2025	AQUISI├ç├âO DE CAF├ë, A├ç├ÜCAR, COPO DESCART├üVEL E ├üGUA MINERAL	26	2025-05-22	18	12	054/2025	f	2025-06-05	2025-06-02	2025-06-04	23636.00	17896.00	5740.00	24.284988999830766	10	2025-06-11	2025-06-10	t	\N	2025-07-04 00:28:16.597133	2025-07-04 00:28:16.597133
451	00000.0.014390/2025	AQUISI├ç├âO DE DE TOKENS DIGITAIS	27	2025-05-14	20	12	057/2025	f	2025-06-09	2025-06-09	2025-06-04	962.00	962.00	0.00	0	10	2025-06-26	2025-06-26	t	\N	2025-07-04 00:28:16.610627	2025-07-04 00:28:16.610627
452	00000.0.006437/2025	AQUISI├ç├âO DE MATERIAS DE (BOLSA, C├éNULA, CATETER) PARA O SAMU	3	2025-04-15	9	13	022/2025	t	2025-06-16	2025-06-04	2025-06-05	2788647.00	\N	\N	\N	15	2025-06-10	\N	f	\N	2025-07-04 00:28:16.625136	2025-07-04 00:28:16.625136
453	00000.0.010765/2025	AQUISI├ç├âO DE INSUMOS DE ENFERMAGEM (ABAIXADOR DE LINGUA, VASELINA LIQUIDA)	3	2025-04-15	10	13	023/2025	t	2025-06-16	2025-06-03	2025-06-03	10791431.00	\N	\N	\N	2	2025-06-26	\N	f	\N	2025-07-04 00:28:16.63082	2025-07-04 00:28:16.63082
454	00000.0.001123/2025	AQUISI├ç├âO DE COMPUTADORES, NOTE BOOKS E TELEVIS├âO	19	2025-03-25	10	13	024/2025	f	2025-06-18	2025-06-03	2025-06-03	1171715.00	\N	\N	\N	20	2025-06-18	\N	f	\N	2025-07-04 00:28:16.644874	2025-07-04 00:28:16.644874
455	00000.0.024247/2025	SERVI├ç├çOS DE BUFFET, COFFE BREAK E FORNECIMENTO DE LANCHES.	12	2025-05-08	11	13	025/2025	t	2025-06-23	2025-06-06	2025-06-06	1488935.00	\N	\N	\N	2	2025-07-01	\N	f	\N	2025-07-04 00:28:16.649414	2025-07-04 00:28:16.649414
456	00000.0.026359/2025	CONTRATA├ç├âO DE EMPRESA PARA SERVI├çOS DE CERIMONIAL	12	2025-05-09	14	13	026/2025	t	2025-06-23	2025-06-05	2025-06-05	970500.00	\N	\N	\N	2	2025-07-02	\N	f	\N	2025-07-04 00:28:16.653219	2025-07-04 00:28:16.653219
457	00000.0.029559/2025	REGISTRO DE PRE├çOS PARA AQUISI├ç├âO DE MEIO FIO PR├ë MOLDADO DE CONCRETO	26	2025-05-14	15	13	029/2025	t	2025-06-23	2025-06-06	2025-06-06	1902744.00	\N	\N	\N	4	2025-06-27	\N	f	\N	2025-07-04 00:28:16.660529	2025-07-04 00:28:16.660529
458	00000.0.006664/2025	AQUISI├ç├âO DE MATERIAIS ELETRICOS PARA MANUTEN├ç├âO DA ILUMINA├ç├âO PUBLICA.	22	2024-06-04	10	13	015/2025	t	2025-06-24	2025-04-28	2025-04-28	7749065.00	\N	\N	\N	4	2025-06-26	\N	f	\N	2025-07-04 00:28:16.665702	2025-07-04 00:28:16.665702
459	00000.0.027549/2025	AQUISI├ç├âO DE CONCRETO USINADO PARA A CONSTRU├ç├âO DE RECUO DE CAL├çADAS	22	2025-05-15	15	13	030/2025	t	2025-06-24	2025-06-06	2025-06-06	1518251.00	\N	\N	\N	2	2025-06-26	\N	f	\N	2025-07-04 00:28:16.670791	2025-07-04 00:28:16.670791
460	00000.0.011528/2025	AQUISI├ç├âO DE MOTOS (EMENDA PARLAMENTAR DEPUTADO LEO BARBOSA)	3	2025-04-03	11	13	013/2025	f	2025-06-25	2025-06-06	2025-06-09	123287.00	\N	\N	\N	2	2025-06-26	\N	f	\N	2025-07-04 00:28:16.679415	2025-07-04 00:28:16.679415
461	00000.0.037750/2024	LICEN├çA INTEGRADA DE SOLU├ç├âO DE SOFTWARE	18	2025-04-16	12	13	\N	f	\N	\N	\N	13229697.00	\N	\N	\N	16	2025-05-15	\N	f	\N	2025-07-04 00:28:16.690386	2025-07-04 00:28:16.690386
462	00000.0.055926/2024	AQUISI├ç├âO DE CBUQ - A FRIO	22	2025-04-08	9	13	\N	t	\N	\N	\N	9542000.00	\N	\N	\N	16	2025-05-06	\N	f	\N	2025-07-04 00:28:16.696515	2025-07-04 00:28:16.696515
463	00000.0.008048/2025	SERVI├çOS DE SOLO, CONCRETO ENSAIOS DE LABORATORIOS E SERVI├çOS DE TOPOGRAFIA	22	2025-04-25	15	13	\N	t	\N	\N	\N	13468518.00	\N	\N	\N	6	2025-06-03	\N	f	\N	2025-07-04 00:28:16.704722	2025-07-04 00:28:16.704722
464	00000.0.005981/2025	CONCESS├âO DE TRANSPORTE COLETIVO	6	2025-03-21	15	10	\N	f	\N	\N	\N	4112532555.00	\N	\N	\N	16	2025-06-03	\N	f	\N	2025-07-04 00:28:16.712404	2025-07-04 00:28:16.712404
465	00000.0.012444/2025	CONTRATA├ç├âO DE EMPRESA PARA ELABORA├ç├âO DE ESTUDOS T├ëCNICOS PARA LICENCIAMENTO AMBIENTAL DE OBRAS DE INFRAESTRUTURA URBANA.	22	2025-06-25	20	12	\N	f	\N	\N	\N	125335.00	\N	\N	\N	19	2025-06-26	\N	f	\N	2025-07-04 00:28:16.716509	2025-07-04 00:28:16.716509
466	00000.0.015176/2025	AQUISI├ç├âO DE COMPUTADORES, TABLETES E NOBREAK	27	2025-06-13	9	13	032/2025	f	2025-07-01	\N	\N	419462.00	\N	\N	\N	8	2025-06-30	\N	f	\N	2025-07-04 00:28:16.725218	2025-07-04 00:28:16.725218
467	00000.0.029688/2025	SERVI├çOS DE ESTERILIZA├ç├âO DE ANIMAIS - CASTRAMOVEL - MICROCHIPAGEM	27	2025-06-11	12	13	\N	f	\N	\N	\N	6974120.00	\N	\N	\N	17	2025-06-25	\N	f	\N	2025-07-04 00:28:16.734504	2025-07-04 00:28:16.734504
468	00000.0.064087/2024	CONTRATA├ç├âO DE PARA ELABORA├ç├âO DE OFICINAS - ACESSUS	23	2025-06-03	9	13	\N	f	\N	\N	\N	362128.00	\N	\N	\N	6	2025-06-06	\N	f	\N	2025-07-04 00:28:16.740824	2025-07-04 00:28:16.740824
469	00000.0.000678/2025	AQUISI├ç├âO DE NATERIAIS ODONTOLOGICOS	3	2025-06-03	12	13	\N	t	\N	\N	\N	2950289.00	\N	\N	\N	16	2025-06-06	\N	f	\N	2025-07-04 00:28:16.745361	2025-07-04 00:28:16.745361
470	00000.0.015039/2025	AQUISI├ç├âO DE INSUMOS DE ENFERMAGEM (C├éNULA)	3	2025-06-12	9	13	\N	t	\N	\N	\N	1627747.00	\N	\N	\N	19	2025-06-12	\N	f	\N	2025-07-04 00:28:16.749411	2025-07-04 00:28:16.749411
471	00000.0.068698/2024	SERVI├çOS DE EXECU├ç├âO DE DRENAGEM PLUVIA, TERRAPLENAGEM PAVIMENTA├ç├âO ASFALTICA NO JARDIM AURENY III E LOTEAMENTO MACHADO.	22	2025-06-04	12	10	\N	f	\N	\N	\N	28485859.00	\N	\N	\N	16	2025-06-10	\N	f	\N	2025-07-04 00:28:16.756576	2025-07-04 00:28:16.756576
472	00000.0.027464/2025	AQUISI├ç├âO DE MATERIAIS HOSPITALRES LABORATORIAIS	27	2025-06-12	19	12	066/2025	f	2025-06-20	2025-06-16	2025-06-16	47422.00	\N	\N	\N	12	2025-06-24	2025-06-24	f	\N	2025-07-04 00:28:16.773111	2025-07-04 00:28:16.773111
473	00000.0.028542/2025	AQUISI├ç├âO DE UNIFORMES PARA OS COLABORADORES DO VIVEIROS	10	2025-06-17	18	12	068/2025	f	2025-06-27	2025-06-17	2025-06-17	13248.00	\N	\N	\N	2	2025-07-01	\N	f	\N	2025-07-04 00:28:16.782891	2025-07-04 00:28:16.782891
474	00000.0.030110/2025	SERVI├çOS DE OUTSOURCING  DE IMPRESS├âO DEPARTAMENTAL COM IMPRESSORA	12	2025-06-13	18	12	067/2025	f	2025-06-24	2025-06-18	2025-06-18	20652.00	20651.00	1.00	0.00484214603912454	10	2025-07-01	2025-07-01	t	\N	2025-07-04 00:28:16.792272	2025-07-04 00:28:16.792272
475	00000.0.011658/2024	SERVI├çOS DE REMO├ç├âO E ARMAZENAMENTO DE TOTENS, SERV. PRODU├ç├âO DE NOVOS DE ENTRADA NAS QUADRAS, SERVI├çOS DE CONSTRU├ç├âO DE FUNDA├ç├âO PARA TOTENS	18	2025-07-01	15	13	\N	t	\N	\N	\N	44820704.00	\N	\N	\N	19	2025-07-01	\N	f	\N	2025-07-04 00:28:16.813711	2025-07-04 00:28:16.813711
476	00000.0.027296/2025	AQUISI├ç├âO DE CASCALHO E ARGILA	22	2025-06-25	15	13	034/2025	t	2025-07-10	2026-06-30	2026-06-30	6920040.00	\N	\N	\N	8	2025-06-30	\N	f	\N	2025-07-04 00:28:16.825063	2025-07-04 00:28:16.825063
478	00000.0.035853/2025	AQUISI├ç├âO DE CAL HIDRATADA	26	2025-06-16	11	13	033/2025	t	2025-07-09	2025-06-26	2025-06-26	497112.00	\N	\N	\N	8	2025-06-27	\N	f	\N	2025-07-04 00:28:16.840871	2025-07-04 00:28:16.840871
480	00000.0.076441/2024	AQUISI├ç├âO DE CERTIFIFCADO DIGITAL TIPO TOKEN	4	2025-01-08	17	12	001/2025	f	2025-02-04	2025-01-30	2025-01-30	3379.00	\N	\N	\N	13	2025-02-05	2025-02-05	f	\N	2025-07-04 00:35:53.004386	2025-07-04 00:35:53.004386
481	00000.0.002472/2025	SERVI├çOS DE BUFFET, ALMO├çO E JANTAR	18	2025-02-28	17	12	010/2025	f	2025-03-11	2025-03-05	2025-03-05	55458.00	54472.00	986.00	1.777922031086588	10	2025-03-21	2025-03-21	t	\N	2025-07-04 00:35:53.039205	2025-07-04 00:35:53.039205
482	00000.0.007955/2025	AQUISI├ç├âO DE CAF├ë	24	2025-03-05	17	12	013/2025	f	2025-03-18	2025-03-16	2025-03-17	22776.00	18828.00	3948.00	17.33403582718651	10	2025-03-27	2025-03-27	t	\N	2025-07-04 00:35:53.051105	2025-07-04 00:35:53.051105
483	00000.0.011654/2025	AQUISI├ç├âO DE ├üGUA MINERAL E GELO	28	2025-03-10	17	12	016/2025	f	2025-03-26	2025-03-21	2025-03-21	21415.00	15912.00	5503.00	25.696941396217603	10	2025-04-11	2025-04-11	t	\N	2025-07-04 00:35:53.063156	2025-07-04 00:35:53.063156
484	00000.0.011619/2025	AQUISI├ç├âO DE ├üGUA MINIERAL E G├üS GLP 13	15	2025-03-17	17	12	020/2025	f	2025-03-27	2025-03-27	2025-03-27	24500.00	18255.00	6245.00	25.489795918367346	10	2025-05-09	2025-05-09	t	\N	2025-07-04 00:35:53.067782	2025-07-04 00:35:53.067782
485	00000.0.013574/2025	AQUISI├ç├âO DE A├ç├ÜCAR, CAF├ë, AGUA MINERAL .	22	2025-03-24	17	12	019/2025	f	2025-03-31	2025-03-26	2025-03-27	60545.00	43360.00	17185.00	28.383846725576017	10	2025-04-08	2025-04-08	t	\N	2025-07-04 00:35:53.075766	2025-07-04 00:35:53.075766
486	00000.0.012104/2025	AQUISI├ç├âO DE UNIFORMES PARA A GMP	12	2025-03-28	15	13	011/2025	t	2025-04-16	2025-04-02	2025-04-02	2144361.00	\N	\N	\N	4	2025-07-02	\N	f	\N	2025-07-04 00:35:53.093993	2025-07-04 00:35:53.093993
479	00001.0.046622/2025	REALIZA├ç├âO DO EXAME HISTEROSCOPIA (DIAGNOSTICA COM BIOPSIA), PARA ATENDER A DECIS├âO JUDICIAL	3	2025-06-27	19	12	076/2025	f	2025-07-04	2025-07-01	2025-07-01	1400.00	\N	\N	\N	3	2025-07-04	\N	f		2025-07-04 00:28:16.845878	2025-07-05 15:52:46.808463
487	00000.0.012153/2025	AQUISI├ç├âO DE UNIFORMES PARA COMBATE A INCENDIOS	4	2025-04-10	16	12	033/2025	f	2025-04-22	2025-04-14	2025-04-14	9798.00	\N	\N	\N	13	2025-04-23	2025-04-23	f	\N	2025-07-04 00:35:53.09822	2025-07-04 00:35:53.09822
488	00000.0.007781/2025	AQUISI├ç├âO DE MATERIAIS DE EXPEDIENTES (CANETAS, GRAMPEADOR ETC.)	24	2025-04-11	17	12	034/2025	f	2025-04-23	2025-04-23	2025-04-23	9952.00	9646.00	306.00	3.07475884244373	10	2025-05-08	2025-05-08	t	\N	2025-07-04 00:35:53.101596	2025-07-04 00:35:53.101596
489	00000.0.007974/2025	AQUISI├ç├âO DE CAVALETES	22	2025-04-15	8	12	035/2025	f	2025-04-28	2025-04-23	2025-04-23	56000.00	42500.00	13500.00	24.107142857142858	10	2025-06-11	2025-06-11	t	\N	2025-07-04 00:35:53.108122	2025-07-04 00:35:53.108122
490	00000.0.021576/2025	CONFEC├ç├âO DE CARIMBOS E BORRACHAS	18	2025-04-09	16	12	036/20025	f	2025-04-29	2025-04-25	2025-04-25	6027.00	6027.00	0.00	0	10	2025-05-13	2025-05-13	t	\N	2025-07-04 00:35:53.113275	2025-07-04 00:35:53.113275
491	00000.0.017087/2025	AQUISI├ç├âO DE CAF├ë, A├çUCAR, COPOS DESCART├üVEIS E OUTROS	21	2025-04-16	8	12	037/2025	f	2025-04-30	2025-04-25	2025-04-25	27890.00	19705.00	8185.00	29.347436357117246	10	2025-05-09	2025-05-09	t	\N	2025-07-04 00:35:53.117616	2025-07-04 00:35:53.117616
492	00000.0.009296/2025	AMPLIA├ç├âO DO ATERRO SANIT├üRIO - S├ëTIMA C├ëLULA DE DEPOSI├ç├âO DE DEGETOS	22	2025-04-10	13	10	001/2025	f	2025-05-05	2025-04-16	2025-04-16	9401288.00	\N	\N	\N	2	2025-06-24	\N	f	\N	2025-07-04 00:35:53.122172	2025-07-04 00:35:53.122172
493	00000.0.005815/2025	AQUISI├ç├âO DE ├üGUA MINERAL E G├üS GLP 13 KG	20	2025-04-23	16	12	038/2025	f	2025-05-05	2025-04-30	2025-04-30	26076.00	16270.00	9806.00	37.60546096026998	10	2025-05-29	2025-05-29	t	\N	2025-07-04 00:35:53.127482	2025-07-04 00:35:53.127482
494	00000.0.020986/2025	AQUISI├ç├âO DE ├üGUA MINERAL, GELO E G├üS	8	2025-04-29	8	12	042/2025	f	2025-05-08	2025-05-05	2025-05-06	26229.00	18473.00	7756.00	29.57032292500667	10	2025-05-21	2025-05-21	t	\N	2025-07-04 00:35:53.133664	2025-07-04 00:35:53.133664
495	00000.0.021568/2025	CONFEC├ç├âO DE UNIFORME PARA ALUNOS DA ESCOLA DE MUSICA DA GMP	12	2025-04-25	16	12	043/2025	f	2025-05-09	2025-05-06	2025-05-06	45347.00	45336.00	11.00	0.024257392991818644	10	2025-05-21	2025-05-19	t	\N	2025-07-04 00:35:53.137794	2025-07-04 00:35:53.137794
496	00000.0.016849/2025	AQUISI├ç├âO DE A├çUCAR, CAF├ë, COADOR E MATERIAS DE HIGIENE E LIMPEZA	10	2025-04-30	16	12	044/2025	f	2025-05-09	2025-05-07	2025-05-07	20613.00	10065.00	10548.00	51.17159074370543	10	2025-06-10	2025-06-10	t	\N	2025-07-04 00:35:53.141552	2025-07-04 00:35:53.141552
497	00000.0.019317/2025	AQUISI├ç├âO DE CARIMBOS AUTOM├üTICOS	27	2025-04-29	8	12	045/2025	f	2025-05-14	2025-05-08	2025-05-08	1429.00	1429.00	0.00	0	10	2025-05-21	2025-05-21	t	\N	2025-07-04 00:35:53.148474	2025-07-04 00:35:53.148474
498	00000.0.025355/2025	AQUISI├ç├âO DE ACESS├ôRIOS MUISICAIS PARA ESCOLA DE MUSICA DA GMP	12	2025-05-12	19	12	048/2025	f	2025-05-21	2025-05-14	2025-05-14	57264.00	56058.00	1206.00	2.106035205364627	10	2025-06-02	2025-05-30	t	\N	2025-07-04 00:35:53.153332	2025-07-04 00:35:53.153332
499	00000.0.021971/2025	AQUISI├ç├âO DE A├çUCAR, CAF├ë E CH├ü MISTO	8	2025-05-05	8	12	049/2025	f	2025-05-22	2025-05-16	2025-05-16	38453.00	37135.00	1318.00	3.427560918523912	10	2025-06-06	2025-06-06	t	\N	2025-07-04 00:35:53.157302	2025-07-04 00:35:53.157302
500	00000.0.012580/2025	CREDENCIAMENTO INSTITUI├ç├âO DE LONGA PERMANENCIA - ILPI - ACOLHER IDOOSO	23	2025-05-08	21	11	001/2025	f	2025-05-29	\N	\N	1486594.00	\N	\N	\N	8	2025-05-14	\N	f	\N	2025-07-04 00:35:53.165555	2025-07-04 00:35:53.165555
501	00000.0.018287/2025	AQUISI├ç├âO DE UTENSILIOS DE COPA E COZINHA, CAF├ë A├ç├ÜCAR	4	2025-05-12	17	12	051/2025	f	2025-06-05	2025-06-03	2025-06-03	20803.00	16967.00	3836.00	18.439648127673895	10	2025-06-12	2025-06-12	t	\N	2025-07-04 00:35:53.169525	2025-07-04 00:35:53.169525
502	00000.0.021561/2025	AQUISI├ç├âO DE MATERIAIS DE EXPEDIENTE CASA CIVIL	8	2025-05-19	20	12	053/2025	f	2025-06-05	2025-06-02	2025-06-03	51375.00	33231.00	18144.00	35.316788321167884	10	2025-06-23	2025-06-23	t	\N	2025-07-04 00:35:53.173483	2025-07-04 00:35:53.173483
503	00000.0.019356/2025	SERVI├çOS DE MANUTEN├ç├âO EM EQUIPAMENTOS DE TOPOGRAFIA,	18	2025-04-16	17	12	056/2025	f	2025-06-06	2025-06-03	2025-06-05	2203.00	0.00	2203.00	100	13	2025-06-06	2025-06-06	f	\N	2025-07-04 00:35:53.179965	2025-07-04 00:35:53.179965
505	00000.0.031782/2025	AQUISI├ç├âO DE BEBEDOUROS INDUSTRIAIS PARA ATENDER AS NECESSIDADES DA PASTA	4	2025-05-29	16	12	058/2025	f	2025-06-09	2025-06-06	2025-06-06	6252.00	5557.00	695.00	11.116442738323736	10	2025-06-16	2025-06-13	t	\N	2025-07-04 00:35:53.18818	2025-07-04 00:35:53.18818
506	00000.0.030747/2025	AQUISI├ç├âO DE MATERIAIS DE COPA E COZINHA	18	2025-06-12	16	12	059/2025	f	2025-06-12	2025-06-09	2025-06-09	46857.00	34593.00	12264.00	26.17325052820283	10	2025-07-01	2025-07-01	t	\N	2025-07-04 00:35:53.194726	2025-07-04 00:35:53.194726
507	00000.0.022951/2025	AQUISI├ç├âO DE EPIS, MASCARA FACIAL, BOMBA COSTAL, RO├çADEIRA	4	2025-06-04	17	12	060/2025	f	2025-06-12	2025-06-09	2025-06-09	42941.00	\N	\N	\N	7	2025-07-02	\N	f	\N	2025-07-04 00:35:53.198465	2025-07-04 00:35:53.198465
509	00000.0.027631/2025	AQUISI├ç├âO DE ├üGUA MINERAL, GELO E G├üS	9	2025-06-11	16	12	063/2025	f	2025-06-17	2025-06-13	2025-06-13	40446.00	24990.00	15456.00	38.21391484942887	10	2025-06-24	2025-06-24	t	\N	2025-07-04 00:35:53.209179	2025-07-04 00:35:53.209179
510	00000.0.023924/2025	AQUISI├ç├âO DE ALIMENTA├ç├âO PARA C├âES E GATO (RA├ç├âO)	27	2025-06-03	13	13	028/2025	t	2025-06-24	2025-06-09	2025-06-09	1159381.00	\N	\N	\N	2	2025-06-27	\N	f	\N	2025-07-04 00:35:53.21776	2025-07-04 00:35:53.21776
512	00000.0.037182/2024	SERVI├çOS DE TABELIONATOS DE  NOTAS (SERVI├çOS CART├ôRIOS)	18	2025-02-02	21	11	\N	f	\N	\N	\N	1500000.00	\N	\N	\N	6	2025-04-03	\N	f	\N	2025-07-04 00:35:53.230922	2025-07-04 00:35:53.230922
513	00000.0.018908/2025	SERVI├çOS DE AVALIA├ç├âO DO VALOR DA TERRA NUA-VTN DA ZONA RURAL DE PALMAS	19	2025-05-12	13	13	\N	f	\N	\N	\N	1020778.00	\N	\N	\N	6	2025-05-15	\N	f	\N	2025-07-04 00:35:53.237344	2025-07-04 00:35:53.237344
515	00000.0.029958/2025	AQUISI├ç├âO DE R├üDIO DE COMUNICA├ç├âO - GUARDA METROPOLITANA DE PALMAS - GMP	12	2025-06-17	8	12	072/2025	f	2025-07-02	2025-06-27	2025-06-27	59508.00	\N	\N	\N	3	2025-07-03	\N	f	\N	2025-07-04 00:35:53.250286	2025-07-04 00:35:53.250286
516	00000.0.023546/2025	RECARGA DE G├üS DE COZINHA GLP 45 KG	2	2025-06-04	17	12	\N	f	\N	\N	\N	6175.00	\N	\N	\N	16	2025-06-12	\N	f	\N	2025-07-04 00:35:53.259202	2025-07-04 00:35:53.259202
517	00000.0.035425/2025	AQUISI├ç├âO DE CONDICIONADORES DE AR	10	2025-06-11	8	12	064/2025	f	2025-06-18	2025-06-16	2025-06-16	13101.00	11760.00	1341.00	10.235859858026105	10	2025-06-26	2025-06-26	t	\N	2025-07-04 00:35:53.264455	2025-07-04 00:35:53.264455
518	00000.0.032050/2025	AQUISI├ç├âO DE A├ç├ÜCAR E CAF├ë	7	2025-06-06	17	12	062/2025	f	2025-06-17	2025-06-12	2025-06-12	5842.00	4849.00	993.00	16.997603560424512	10	2025-07-02	2025-07-02	t	\N	2025-07-04 00:35:53.268647	2025-07-04 00:35:53.268647
519	00000.0.028540/2025	AQUISI├ç├âO DE EPIS E OUTROS	10	2025-06-12	8	12	070/2025	f	2025-06-30	2025-06-25	2025-06-25	61444.00	\N	\N	\N	3	2025-07-02	\N	f	\N	2025-07-04 00:35:53.274091	2025-07-04 00:35:53.274091
520	00000.0.034385/2025	AQUISI├ç├âO DE MATERIAIS DE COPA E COZINHA	10	2025-06-24	17	12	\N	f	\N	\N	\N	21015.00	\N	\N	\N	19	2025-06-24	\N	f	\N	2025-07-04 00:35:53.281133	2025-07-04 00:35:53.281133
521	00000.0.027467/2025	AQUISI├ç├âO DE ├üGUA MINERAL	7	2025-06-16	17	12	069/2025	f	2025-06-27	2025-06-24	2025-06-24	5010.00	\N	\N	\N	2	2025-06-30	\N	f	\N	2025-07-04 00:35:53.286014	2025-07-04 00:35:53.286014
522	00000.0.034611/2025	AQUISI├ç├âO DE ├üGUA MINERAL E G├üS GLP 13 KG	17	2025-07-02	8	12	\N	f	\N	\N	\N	33346.00	\N	\N	\N	19	2025-07-02	\N	f	\N	2025-07-04 00:35:53.289703	2025-07-04 00:35:53.289703
523	00000.0.035048/2025	SERVI├çOS DE COFFE BRAEK, FORNECIMENTO DE LANCHE INDIVIDUAL E BOLO DE ANIVERS├üRIO	13	2025-06-30	16	12	\N	f	\N	\N	\N	52050.00	\N	\N	\N	19	2025-07-01	\N	f	\N	2025-07-04 00:35:53.296055	2025-07-04 00:35:53.296055
524	00000.0.024930/2025	AQUISI├ç├âO DE TOKEN - CERTIFICADO DIGITAL	20	2025-06-30	16	12	071/2025	f	2025-07-02	\N	\N	2369.00	\N	\N	\N	19	2025-06-30	\N	f	\N	2025-07-04 00:35:53.300544	2025-07-04 00:35:53.300544
525	00000.0.029974/2025	SERVI├çOS DE CONTROLE DE PREGAS E VETORES URBANOS (DESRATIZA├ç├âO, DESINSETIZA├ç├âO	28	2025-06-26	13	13	\N	t	\N	\N	\N	1641791.00	\N	\N	\N	19	2025-06-26	\N	f	\N	2025-07-04 00:35:53.304199	2025-07-04 00:35:53.304199
527	00000.0.024073/2025	AQUISI├ç├âO DE GRAVADOR DE VOZ	19	2025-06-24	8	12	077/2025	f	2025-07-09	\N	\N	1450.00	\N	\N	\N	8	2025-07-04	\N	f	\N	2025-07-04 00:35:53.314865	2025-07-04 00:35:53.314865
511	00001.0.014185/2025	SERVI├çOS DE PUBLICIDADE	16	2025-05-07	21	10	002/2025	f	2025-08-04	2025-06-11	2025-06-11	25624860.00	\N	\N	\N	8	2025-06-11	\N	f		2025-07-04 00:35:53.223445	2025-07-04 20:49:08.251478
514	00001.0.028662/2025	AQUISI├ç├âO DE EQUIPAMENTOS E ASESS├ôRIOS DE TOPOGRAFIA	18	2025-06-09	8	12	065/2025	f	2025-06-20	2025-06-16	2025-06-16	19034.00	\N	\N	\N	7	2025-07-02	\N	f		2025-07-04 00:35:53.246127	2025-07-05 14:53:24.961191
508	00001.0.011291/2025	AQUISI├ç├âO DE MATERIAIS DE COPA E COZINHA	3	2025-06-03	8	12	061/2025	f	2025-06-16	2025-06-11	\N	59630.00	\N	\N	\N	7	2025-06-27	\N	f		2025-07-04 00:35:53.20343	2025-07-05 15:10:28.31029
528	00000.0.028813/2025	SERVI├çOS DE BUFFET, ALMO├çO E JANTAR, CEIA DE NATQAL, BOLO DE ANIVERS├üRIO	23	2025-06-25	13	13	\N	t	\N	\N	\N	2502400.00	\N	\N	\N	19	2025-06-25	\N	f	\N	2025-07-04 00:35:53.31833	2025-07-04 00:35:53.31833
530	00000.0.032296/2025	AQUISI├ç├âO DE APARELHOS TELEFONICOS HEADSET HBS50	30	2025-06-26	16	12	\N	f	\N	\N	\N	2000.00	\N	\N	\N	19	2025-06-27	\N	f	\N	2025-07-04 00:35:53.32948	2025-07-04 00:35:53.32948
531	00000.0.041223/2025	AQUISI├ç├âO DE FOG├âO, FRIGOBAR, REFRIGERADOR DUPLEX, FREEZR, ESTANTE DE A├çO	5	2025-06-27	8	12	\N	f	\N	\N	\N	26761.00	\N	\N	\N	19	2025-06-30	\N	f	\N	2025-07-04 00:35:53.334481	2025-07-04 00:35:53.334481
532	00000.0.032227/2025	AQUISI├ç├âO DE EQUIPAMNENTO DE ACADEMIA (SUPINO E BANCO)	12	2025-07-01	8	12	\N	f	\N	\N	\N	40179.00	\N	\N	\N	19	2025-07-01	\N	f	\N	2025-07-04 00:35:53.339405	2025-07-04 00:35:53.339405
533	00000.0.017535/2025	AQUISI├ç├âO DE TOKEN	7	2025-07-03	16	12	\N	f	\N	\N	\N	3536.00	\N	\N	\N	19	2025-07-03	\N	f	\N	2025-07-04 00:35:53.343716	2025-07-04 00:35:53.343716
534	00000.0.078508/2024	CONFEC├ç├âO DE CARIMBOS	14	2025-01-28	16	12	002/2025	f	2025-02-10	2025-02-07	2025-02-08	19414.00	16464.00	2950.00	15.195219944370042	10	2025-03-17	2025-03-17	t	\N	2025-07-04 00:41:51.676711	2025-07-04 00:41:51.676711
535	00000.0.008409/2025	AQUISI├ç├âO DE AGUA, GELO EM CUBO, ISOPOR, COPOS DESCART├üVEIS E OUTROS	25	2025-02-22	16	12	007/2025	f	2025-03-06	2025-02-25	2025-02-26	59196.00	55289.00	3907.00	6.600108115413204	10	2025-03-24	2025-03-24	t	\N	2025-07-04 00:41:51.695489	2025-07-04 00:41:51.695489
536	00000.0.008825/2025	CONFE├ç├âO DE CAMISETAS	25	2025-02-24	16	12	008/2025	f	2025-03-10	2025-03-05	2025-03-05	58892.00	45996.00	12896.00	21.89771106432113	10	2025-03-24	2023-05-24	t	\N	2025-07-04 00:41:51.73615	2025-07-04 00:41:51.73615
537	00000.0.021545/2024	AQUISI├ç├âO DE MATERIAIS ELETRICOS E DE CONSTRU├ç├âO	22	2025-02-17	13	13	007/2025	t	2025-03-13	2025-02-26	2025-02-27	3446104.00	2913042.00	533062.00	15.468540705678064	10	2025-06-23	2025-06-23	t	\N	2025-07-04 00:41:51.745475	2025-07-04 00:41:51.745475
538	00000.0.008327/2025	AQUSI├ç├âO DE FRIGOBAR	14	2025-03-05	16	12	014/2025	f	2025-03-18	2025-03-14	2025-03-17	17290.00	14850.00	2440.00	14.112203585887796	10	2025-04-07	2025-04-04	t	\N	2025-07-04 00:41:51.760261	2025-07-04 00:41:51.760261
540	00000.0.006932/2025	SERVI├çOS DE CHAVEIRO	15	2025-03-17	16	12	017/2025	f	2025-03-26	2025-03-21	2025-03-24	13470.00	\N	\N	\N	14	2025-04-07	2025-04-04	f	\N	2025-07-04 00:41:52.04095	2025-07-04 00:41:52.04095
541	00000.0.006958/2025	CONFEC├ç├âO DE CARIMBOS	15	2025-03-17	16	12	018/2025	f	2025-03-27	2025-03-25	2025-03-25	12260.00	6649.00	5611.00	45.766721044045674	10	2025-05-08	2025-05-08	t	\N	2025-07-04 00:41:52.054957	2025-07-04 00:41:52.054957
543	00000.0.014358/2025	CAF├ë, A├çUCAR E COPOS DESCARTAVEIS	1	2025-03-20	16	12	025/2025	f	2025-04-07	2025-04-02	2025-04-02	10456.00	9333.00	1123.00	10.740244835501148	10	2025-04-11	2025-04-10	t	\N	2025-07-04 00:41:52.201567	2025-07-04 00:41:52.201567
529	00001.0.037415/2025	SERVI├çOS DE CLIPPING DE NOT├ìCIAS, ABRANGENDO O MONITORAMENTO, A COLETA...	28	2025-06-26	8	12	078/2025	f	2025-07-10	\N	\N	60210.00	\N	\N	\N	8	2025-07-04	\N	f		2025-07-04 00:35:53.323604	2025-07-04 00:43:56.079746
477	00001.0.037442/2025	AQUISI├ç├âO DE MICROFONE SEM FIO, CELULAR, TABLET, MINI ILUMINADOR	12	2025-06-27	19	12	073/2025	f	2025-07-03	2025-06-30	2025-06-30	50076.00	\N	\N	\N	3	2025-07-03	\N	f		2025-07-04 00:28:16.834685	2025-07-04 00:44:50.416793
504	00001.0.032055/2025	FORNECIMENTO DE COFFE BREAK	18	2025-05-29	16	12	055/2025	f	2025-06-06	2025-06-03	2025-06-03	51124.00	32120.00	19004.00	37.17236522963774	10	2025-06-10	2025-06-10	t		2025-07-04 00:35:53.183613	2025-07-04 15:26:16.2763
526	00001.0.078944/2025	ELABORA├ç├âO DE ESTUDOS DE ASSET LIABILITY MANAGEMENT  (ALM)	14	2025-06-23	8	12	074/2025	f	2025-07-04	2025-07-01	2025-07-01	9060.00	\N	\N	\N	3	2025-07-04	\N	f		2025-07-04 00:35:53.309286	2025-07-04 21:04:38.209254
\.


--
-- Data for Name: responsaveis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.responsaveis (id, primeiro_nome, nome_responsavel, email, telefone, ativo, created_at, updated_at) FROM stdin;
9	Alenomar	Alenomar Abreu de Carvalho	alenomar@supel.gov	\N	t	2025-06-30 23:26:49.035705	2025-06-30 23:26:49.035705
10	Andria	Andria Moreira Barreira	andria@supel.gov	\N	t	2025-06-30 23:27:20.33954	2025-06-30 23:27:20.33954
11	Belziram	Belziram Jos├® de Sousa	belziram@supel.gov	\N	t	2025-06-30 23:28:17.947134	2025-06-30 23:28:17.947134
12	Eneas	Eneas Ribeiro Neto	eneas@supel.gov	\N	t	2025-06-30 23:28:41.568309	2025-06-30 23:28:41.568309
13	Glicimeire	Glicimeire de Amorim Pr├│spero	glicimeire@supel.gov	\N	t	2025-06-30 23:29:03.348576	2025-06-30 23:29:03.348576
14	Luzimara	Luzimara de Oliveira Negre Avelino	luzimara@supel.gov	\N	t	2025-06-30 23:29:28.791588	2025-06-30 23:29:28.791588
19	Rom├írio	Rom├írio Miranda Aquino	romario@supel.gov	\N	t	2025-06-30 23:31:28.733429	2025-06-30 23:31:28.733429
20	Melyne	Melyne Vieira Mam├®dio de Almeida	melyne@supel.gov	\N	t	2025-06-30 23:31:49.626977	2025-06-30 23:31:49.626977
16	Ant├┤nia	Ant├┤nia Vanier Tavares da Silva	antonia.vanier@supel.gov	\N	t	2025-06-30 23:30:16.792805	2025-07-03 13:50:29.472021
15	Marcia	Marcia Helena Teodoro de Carvalho	marcia@supel.gov	\N	t	2025-06-30 23:29:53.045416	2025-07-03 13:50:41.731299
18	Pedro	Pedro Wilson Nascimento Silva	pedro.wilson@supel.gov	\N	t	2025-06-30 23:31:03.668206	2025-07-03 13:51:43.310097
17	Fabr├¡cia	Fabr├¡cia Simonelle dos Santos	fabricia@supel.gov	\N	t	2025-06-30 23:30:40.973128	2025-07-04 00:30:20.671039
8	Denilson	Denilson Alves Maciel	denilson@supel.gov	\N	t	2025-06-29 22:09:02.735257	2025-07-04 00:30:37.307365
21	Comiss├úo	Comiss├úo de Licita├ºao	comissao@supel.gov	\N	t	2025-07-04 00:33:04.628429	2025-07-04 00:33:04.628429
\.


--
-- Data for Name: situacoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.situacoes (id, nome_situacao, descricao_situacao, eh_finalizadora, cor_hex, ativo, created_at, updated_at) FROM stdin;
1	Prazo IRP	Processo aguardando inten├º├Áes de registro de pre├ºos	f	#3B82F6	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
2	Parecer T├®cnico	Processo enviado para an├ílise t├®cnica do ├│rg├úo demandante	f	#F97316	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
3	Aguardando Documentos	Aguardando documentos complementares	f	#F59E0B	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
4	An├ílise Docs. SUPEL	Processo em an├ílise de documenta├º├úo pela equipe da superintend├¬ncia	f	#10B981	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
5	Em Publica├º├úo	Processo em fase de publica├º├úo (Edital ou ARP)	f	#8B5CF6	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
6	Parecer PGM	Processo enviado para parecer da PGM	f	#06B6D4	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
7	Enviado p/ Homologar	Processo enviado para adjudica├º├úo e homologa├º├úo pelo gestor da pasta.	f	#84CC16	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
8	Aguardando Sess├úo	Processo aguardando sess├úo p├║blica.	f	#9333EA	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
9	Fase Recursal	Processo em fase de recursos administrativos	f	#4ADE80	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
10	Finalizado	Processo finalizado com sucesso	t	#14B8A6	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
11	Cancelado	Processo cancelado	t	#EF4444	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
12	Fracassado	Processo fracassado	t	#E11D48	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
13	Deserto	Processo deserto	t	#FACC15	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
14	Revogado	Processo revogado	t	#A855F7	t	2025-06-27 18:32:36.878361	2025-07-05 14:39:04.934599
15	An├ílise de Impugna├º├Áes	Processo em an├ílise de documentos apresentados na impugna├º├úo ao edital.	f	#0EA5E9	t	2025-06-29 21:19:27.960765	2025-07-05 14:39:04.934599
16	Devolvido Adequa├º├Áes	Processo devolvido ao ├│rg├úo demandante para adequa├º├Áes	f	#EA580C	t	2025-06-29 21:22:22.109474	2025-07-05 14:39:04.934599
17	Dilig├¬ncia SUPEL	Processo em dilig├¬ncia	f	#22C55E	t	2025-06-29 21:22:54.771452	2025-07-05 14:39:04.934599
18	Elaborando ARP SUPEL	Processo em elabora├º├úo de Atas de Registro de Pre├ºos	f	#D946EF	t	2025-06-29 21:23:45.298217	2025-07-05 14:39:04.934599
19	Elaborando Edital	Processo em desenvolvimento do edital	f	#A3A3A3	t	2025-06-29 21:24:23.872285	2025-07-05 14:39:04.934599
20	Suspenso	Processo suspenso sine-die	f	#2563EB	t	2025-06-29 21:30:03.85806	2025-07-05 14:39:04.934599
\.


--
-- Data for Name: unidades_gestoras; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unidades_gestoras (id, sigla, nome_completo_unidade, ativo, created_at, updated_at) FROM stdin;
3	SESAU	Secretaria de Sa├║de	t	2025-06-27 18:32:36.878361	2025-06-27 18:32:36.878361
2	SEMED	Secretaria de Educa├º├úo	t	2025-06-27 18:32:36.878361	2025-06-29 21:31:34.094394
4	SEMOB	Secretaria de Mobilidade Urbana e Defesa Civil	t	2025-06-27 18:32:36.878361	2025-06-29 21:32:27.24911
1	AGTEC	Ag├¬ncia de Tecnologia da Informa├º├úo	t	2025-06-27 18:32:36.878361	2025-06-29 21:33:07.76262
5	AGTUR	Ag├¬ncia Municipal de Turismo	t	2025-06-27 18:32:36.878361	2025-06-29 21:33:32.807488
6	ATCP	Ag├¬ncia de Transporte Coletivo de Palmas	t	2025-06-29 21:34:27.707742	2025-06-29 21:34:27.707742
7	CGM	Controladoria Geral do Munic├¡pio	t	2025-06-29 21:34:56.73621	2025-06-29 21:34:56.73621
9	FCP	Funda├º├úo Cultural de Palmas	t	2025-06-29 21:35:47.658006	2025-06-29 21:35:47.658006
8	CCP	Casa Civil de Palmas	t	2025-06-29 21:35:15.265714	2025-06-29 21:36:04.737817
10	FMA	Funda├º├úo de Meio Ambiente	t	2025-06-29 21:36:55.522518	2025-06-29 21:36:55.522518
11	FUNDESPORTES	Funda├º├úo de Esportes e Lazer	t	2025-06-29 21:37:29.681853	2025-06-29 21:37:29.681853
12	SEGAB	Secretaria do Gabinete do Prefeito	t	2025-06-29 21:38:10.969133	2025-06-29 21:38:10.969133
13	PGM	Procuradoria Geral do Munic├¡pio	t	2025-06-29 21:38:39.565907	2025-06-29 21:38:39.565907
14	PREVIPALMAS	Instituto de Previd├¬ncia Social de Palmas	t	2025-06-29 21:39:24.11457	2025-06-29 21:39:24.11457
15	SECAD	Secretaria de Administra├º├úo e Moderniza├º├úo	t	2025-06-29 21:39:57.631313	2025-06-29 21:39:57.631313
16	SECOM	Secretaria de Comunica├º├úo	t	2025-06-29 21:40:25.883532	2025-06-29 21:40:25.883532
18	SEDURF	Secretaria de Desenv. Urbano e Reg. Fundi├íria	t	2025-06-29 21:42:03.411696	2025-06-29 21:42:03.411696
17	SEDEEM	Secretaria de Desenv. Econ├┤mico e Empreendedorismo	t	2025-06-29 21:41:18.058093	2025-06-29 21:42:23.029036
19	SEFIN	Secretaria de Finan├ºas	t	2025-06-29 21:43:02.269975	2025-06-29 21:43:02.269975
20	SEGOV	Secretaria de Governo	t	2025-06-29 21:43:21.849528	2025-06-29 21:43:21.849528
21	SEHAB	Secretaria de Habita├º├úo	t	2025-06-29 21:43:45.981952	2025-06-29 21:43:45.981952
22	SEIOP	Secretaria de Infraestrutura e Obras P├║blicas	t	2025-06-29 21:44:24.404983	2025-06-29 21:44:24.404983
23	SEMAS	Secretaria de A├º├úo Social	t	2025-06-29 21:44:54.855321	2025-06-29 21:44:54.855321
24	SEMASI	Secretaria de Agricultura e Servi├ºos do Interior	t	2025-06-29 21:45:34.314339	2025-06-29 21:45:34.314339
25	SEMUP	Secretaria da Mulher de Palmas	t	2025-06-29 21:46:21.18264	2025-06-29 21:46:21.18264
26	SEMZU	Secretaria de Zeladoria Urbana	t	2025-06-29 21:46:54.979021	2025-06-29 21:46:54.979021
27	SEPBEA	Secretaria de Prote├º├úo e Bem-Estar Animal	t	2025-06-29 21:47:42.550582	2025-06-29 21:47:42.550582
28	SEPLAN	Secretaria de Planejamento, Or├ºamento e Licita├º├Áes	t	2025-06-29 21:48:30.596539	2025-06-29 21:48:30.596539
29	SEMPU	Secretaria de Planejamento Urbano	t	2025-06-29 21:49:28.339303	2025-06-29 21:49:28.339303
30	ARP	Ag├¬ncia de Regula├º├úo de Palmas	t	2025-07-01 02:11:47.546937	2025-07-01 02:11:47.546937
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, nome, google_id, perfil, ativo, created_at, updated_at, senha, paginas_permitidas, reset_token, reset_token_expires, primeiro_acesso) FROM stdin;
13	alenomar@supel.gov	Alenomar Abreu de Carvalho	\N	usuario	t	2025-06-30 23:15:09.511772	2025-06-30 23:15:09.511772	$2b$10$n8IwXhWDnPWBNcSixW9s/.q7/kfvGXB5fCmlxplnGFj6P.9YAeS4G	{dashboard,processos,relatorios}	\N	\N	t
14	belziram@supel.gov	Belziram Jos├® de Sousa	\N	usuario	t	2025-06-30 23:15:40.219878	2025-06-30 23:15:40.219878	$2b$10$EDqNJNw9VllC6OXLdJwFD.FMZkRtLXvNxoqh.3NvfCxt39U3S0K2a	{dashboard,processos,relatorios}	\N	\N	t
11	denilson@supel.gov	Denilson Alves Maciel	\N	usuario	t	2025-06-30 23:05:59.318776	2025-07-05 14:26:56.021581	$2b$10$/VsWPIPBlTHNTwS1iLVIQuOd8yagirj6Gj4QJZmidxXHFOX/zjmvi	{dashboard,processos,relatorios,contador-responsaveis,auditoria}	\N	\N	t
15	eneas@supel.gov	Eneas Ribeiro Neto	\N	usuario	t	2025-06-30 23:16:03.989248	2025-06-30 23:16:03.989248	$2b$10$4uxk2DhiziyAxYmCQjZajuqAqBkDBHhfz7HolgAhn.ztqx7FCVta2	{dashboard,processos,relatorios}	\N	\N	t
16	glicimeire@supel.gov	Glicimeire de Amorim Pr├│spero	\N	usuario	t	2025-06-30 23:16:37.996859	2025-06-30 23:16:37.996859	$2b$10$i02JCID8N04G4QahfhJXI.Z07IAcqmmlJ.Rh7d6rU0ijlNwqn9c22	{dashboard,processos,relatorios}	\N	\N	t
17	luzimara@supel.gov	Luzimara de Oliveira Negre Avelino	\N	usuario	t	2025-06-30 23:17:03.367393	2025-06-30 23:17:03.367393	$2b$10$AJ/1ZmsDq.TQuv7REfzvSuouLhYQPn7ztVgWnwtOz4TxV/sIWsuI2	{dashboard,processos,relatorios}	\N	\N	t
18	marcia@supel.gov	Marcia Helena Teodoro de Carvalho	\N	usuario	t	2025-06-30 23:17:30.103455	2025-06-30 23:17:30.103455	$2b$10$yYzTQxkGgvctUKtKqlHAPedMTLWHOuytUVA.PPaxAGhz7sb2rL.vi	{dashboard,processos,relatorios}	\N	\N	t
19	antonia.vanier@supel.gov	Ant├┤nia Vanier Tavares da Silva	\N	usuario	t	2025-06-30 23:17:59.440526	2025-06-30 23:17:59.440526	$2b$10$WiEjohSLVX746.wsxjzRVODD0SV5qS0oydgxx6qwQ346cKFxV8C.i	{dashboard,processos,relatorios}	\N	\N	t
20	fabricia@supel.gov	Fabricia Simonelle dos Santos	\N	usuario	t	2025-06-30 23:18:36.376292	2025-06-30 23:18:36.376292	$2b$10$Cvns5bjRGf16RcvNVtDRy.A/STzLE4jdm9VHCZEHaY/g1OdJeluRK	{dashboard,processos,relatorios}	\N	\N	t
21	pedro.wilson@supel.gov	Pedro Wilson Nascimento Silva	\N	usuario	t	2025-06-30 23:19:02.59208	2025-06-30 23:19:02.59208	$2b$10$PTrh0TCOpLvhXBZ4BwXEf.qeRjIrv3uNRJV0DpWZlYD9P1R8q6mkO	{dashboard,processos,relatorios}	\N	\N	t
22	romario@supel.gov	Rom├írio Miranda Aquino	\N	usuario	t	2025-06-30 23:20:17.615543	2025-06-30 23:20:17.615543	$2b$10$e4TnOxBylxrX7xRhtB9bieomCFq01loupGWycoopqRT2hArTthj1W	{dashboard,processos,relatorios}	\N	\N	t
23	melyne@supel.gov	Melyne Vieira Mam├®dio de Almeida	\N	usuario	t	2025-06-30 23:25:58.210013	2025-06-30 23:25:58.210013	$2b$10$WWYdEbOb.v/pzOuBUsjBa.8wOTxQafvD/nnuYHQpOk6l9f//52jKy	{dashboard,processos,relatorios}	\N	\N	t
12	andria@supel.gov	Andria Moreira Barreira	\N	usuario	t	2025-06-30 23:13:30.550486	2025-07-01 10:25:08.748214	$2b$10$Qnb0CScQzG5Wegfquv/TYensS.9gBTvv8eEzjhncrmnkYGUelcduO	{dashboard,processos,relatorios}	\N	\N	f
24	comissao@supel.gov	Comiss├úo de Licita├º├úo	\N	usuario	t	2025-07-04 00:33:40.4801	2025-07-04 00:33:40.4801	$2b$10$Yi0bR1jNeaWXT9ZJ84s.3easAeC93g0LqNsTW64EmgR6zZyybug.G	{dashboard,processos,relatorios}	\N	\N	t
1	admin@supel.gov.br	Administrador do Sistema	\N	admin	t	2025-06-27 18:32:36.878361	2025-07-06 01:54:37.499002	$2b$10$RpSX61v58mgr1p53n74J3ujRxodm97G66RhECq0L7zzW0kUlw.w5C	{dashboard,processos,relatorios,modalidades,unidades-gestoras,responsaveis,situacoes,equipe-apoio,usuarios,configuracoes,auditoria}	\N	\N	f
2	denilson.pmw@gmail.com	Denilson Maciel	\N	admin	t	2025-06-27 18:32:36.976145	2025-07-06 01:54:37.499002	$2b$10$QQZt/2i/twRVYCAJ3etKoO5BpcpNkUfUUlD7B.ZvO78K19SPuV.Fq	{dashboard,processos,relatorios,modalidades,unidades-gestoras,responsaveis,situacoes,equipe-apoio,usuarios,auditoria}	\N	\N	t
\.


--
-- Name: auditoria_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auditoria_log_id_seq', 2, true);


--
-- Name: equipe_apoio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipe_apoio_id_seq', 7, true);


--
-- Name: modalidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.modalidades_id_seq', 13, true);


--
-- Name: processos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.processos_id_seq', 549, true);


--
-- Name: responsaveis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.responsaveis_id_seq', 21, true);


--
-- Name: situacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.situacoes_id_seq', 20, true);


--
-- Name: unidades_gestoras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.unidades_gestoras_id_seq', 30, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 25, true);


--
-- Name: auditoria_log auditoria_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_log
    ADD CONSTRAINT auditoria_log_pkey PRIMARY KEY (id);


--
-- Name: equipe_apoio equipe_apoio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipe_apoio
    ADD CONSTRAINT equipe_apoio_pkey PRIMARY KEY (id);


--
-- Name: auditoria_log idx_auditoria_usuario_timestamp; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_log
    ADD CONSTRAINT idx_auditoria_usuario_timestamp UNIQUE (usuario_id, "timestamp", tabela_afetada, operacao);


--
-- Name: modalidades modalidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modalidades
    ADD CONSTRAINT modalidades_pkey PRIMARY KEY (id);


--
-- Name: modalidades modalidades_sigla_modalidade_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modalidades
    ADD CONSTRAINT modalidades_sigla_modalidade_key UNIQUE (sigla_modalidade);


--
-- Name: processos processos_nup_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos
    ADD CONSTRAINT processos_nup_key UNIQUE (nup);


--
-- Name: processos processos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos
    ADD CONSTRAINT processos_pkey PRIMARY KEY (id);


--
-- Name: responsaveis responsaveis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsaveis
    ADD CONSTRAINT responsaveis_pkey PRIMARY KEY (id);


--
-- Name: situacoes situacoes_nome_situacao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.situacoes
    ADD CONSTRAINT situacoes_nome_situacao_key UNIQUE (nome_situacao);


--
-- Name: situacoes situacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.situacoes
    ADD CONSTRAINT situacoes_pkey PRIMARY KEY (id);


--
-- Name: unidades_gestoras unidades_gestoras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_gestoras
    ADD CONSTRAINT unidades_gestoras_pkey PRIMARY KEY (id);


--
-- Name: unidades_gestoras unidades_gestoras_sigla_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_gestoras
    ADD CONSTRAINT unidades_gestoras_sigla_key UNIQUE (sigla);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_auditoria_operacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_operacao ON public.auditoria_log USING btree (operacao);


--
-- Name: idx_auditoria_registro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_registro ON public.auditoria_log USING btree (registro_id);


--
-- Name: idx_auditoria_tabela; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_tabela ON public.auditoria_log USING btree (tabela_afetada);


--
-- Name: idx_auditoria_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_timestamp ON public.auditoria_log USING btree ("timestamp");


--
-- Name: idx_auditoria_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_usuario ON public.auditoria_log USING btree (usuario_id);


--
-- Name: idx_processos_conclusao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_conclusao ON public.processos USING btree (conclusao);


--
-- Name: idx_processos_data_entrada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_data_entrada ON public.processos USING btree (data_entrada);


--
-- Name: idx_processos_modalidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_modalidade ON public.processos USING btree (modalidade_id);


--
-- Name: idx_processos_nup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_nup ON public.processos USING btree (nup);


--
-- Name: idx_processos_responsavel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_responsavel ON public.processos USING btree (responsavel_id);


--
-- Name: idx_processos_situacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_situacao ON public.processos USING btree (situacao_id);


--
-- Name: idx_processos_ug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_ug ON public.processos USING btree (ug_id);


--
-- Name: idx_processos_valor_estimado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_valor_estimado ON public.processos USING btree (valor_estimado);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_google_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_google_id ON public.users USING btree (google_id);


--
-- Name: processos calculate_processo_desagio; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER calculate_processo_desagio BEFORE INSERT OR UPDATE ON public.processos FOR EACH ROW EXECUTE FUNCTION public.calculate_desagio();


--
-- Name: processos trigger_audit_processos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_processos AFTER INSERT OR DELETE OR UPDATE ON public.processos FOR EACH ROW EXECUTE FUNCTION public.audit_table();


--
-- Name: equipe_apoio update_equipe_apoio_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_equipe_apoio_updated_at BEFORE UPDATE ON public.equipe_apoio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: modalidades update_modalidades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_modalidades_updated_at BEFORE UPDATE ON public.modalidades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: processos update_processos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_processos_updated_at BEFORE UPDATE ON public.processos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: responsaveis update_responsaveis_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_responsaveis_updated_at BEFORE UPDATE ON public.responsaveis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: situacoes update_situacoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_situacoes_updated_at BEFORE UPDATE ON public.situacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: unidades_gestoras update_unidades_gestoras_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_unidades_gestoras_updated_at BEFORE UPDATE ON public.unidades_gestoras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: processos processos_modalidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos
    ADD CONSTRAINT processos_modalidade_id_fkey FOREIGN KEY (modalidade_id) REFERENCES public.modalidades(id);


--
-- Name: processos processos_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos
    ADD CONSTRAINT processos_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.responsaveis(id);


--
-- Name: processos processos_situacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos
    ADD CONSTRAINT processos_situacao_id_fkey FOREIGN KEY (situacao_id) REFERENCES public.situacoes(id);


--
-- Name: processos processos_ug_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos
    ADD CONSTRAINT processos_ug_id_fkey FOREIGN KEY (ug_id) REFERENCES public.unidades_gestoras(id);


--
-- PostgreSQL database dump complete
--

