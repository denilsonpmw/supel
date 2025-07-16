import { Request, Response } from 'express';
import pool from '../database/connection';

// Definição local de AuthRequest para evitar erro de import
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    nome: string;
    perfil: string;
    paginas_permitidas?: string[];
    responsavel_id?: number;
    ativo: boolean;
  };
}

// Interface para logs de auditoria
interface LogAuditoria {
  id: number;
  usuario_id: number | null;
  usuario_email: string | null;
  usuario_nome: string | null;
  tabela_afetada: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  registro_id: number | null;
  dados_anteriores?: any;
  dados_novos?: any;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

// Interface para filtros de auditoria
interface FiltrosAuditoria {
  usuario_id?: number;
  data_inicio?: string;
  data_fim?: string;
  tabela_afetada?: string;
  operacao?: string;
  registro_id?: number;
  page?: number;
  limit?: number;
}

// Listar logs de auditoria com filtros
export const listarLogsAuditoria = async (req: AuthRequest, res: Response) => {
  try {
    // Permitir acesso para admin ou quem tem permissão auditoria
    if (
      req.user?.perfil !== 'admin' &&
      !req.user?.paginas_permitidas?.includes('auditoria')
    ) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissão de auditoria necessária.' 
      });
    }

    const {
      usuario_id,
      data_inicio,
      data_fim,
      tabela_afetada,
      operacao,
      registro_id,
      page = 1,
      limit = 50
    } = req.query as FiltrosAuditoria;

    // Construir query base com JOIN para processos quando necessário
    let query = `
      SELECT 
        al.*,
        u.email as usuario_email_atual,
        u.nome as usuario_nome_atual,
        CASE 
          WHEN al.tabela_afetada = 'processos' AND al.registro_id IS NOT NULL 
          THEN p.nup 
          ELSE NULL 
        END as processo_nup
      FROM auditoria_log al
      LEFT JOIN users u ON al.usuario_id = u.id
      LEFT JOIN processos p ON al.tabela_afetada = 'processos' AND al.registro_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Aplicar filtros
    if (usuario_id) {
      query += ` AND al.usuario_id = $${paramIndex++}`;
      params.push(usuario_id);
    }

    if (data_inicio) {
      query += ` AND al.timestamp >= $${paramIndex++}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND al.timestamp <= $${paramIndex++}`;
      params.push(data_fim);
    }

    if (tabela_afetada) {
      query += ` AND al.tabela_afetada = $${paramIndex++}`;
      params.push(tabela_afetada);
    }

    if (operacao) {
      query += ` AND al.operacao = $${paramIndex++}`;
      params.push(operacao);
    }

    if (registro_id) {
      query += ` AND al.registro_id = $${paramIndex++}`;
      params.push(registro_id);
    }

    // Ordenar por timestamp decrescente
    query += ` ORDER BY al.timestamp DESC`;

    // Aplicar paginação
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    // Executar query
    const result = await pool.query(query, params);
    const logs = result.rows;

    // Contar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total
      FROM auditoria_log al
      WHERE 1=1
    `;
    const countParams: any[] = [];
    paramIndex = 1;

    // Aplicar mesmos filtros para contagem
    if (usuario_id) {
      countQuery += ` AND al.usuario_id = $${paramIndex++}`;
      countParams.push(usuario_id);
    }

    if (data_inicio) {
      countQuery += ` AND al.timestamp >= $${paramIndex++}`;
      countParams.push(data_inicio);
    }

    if (data_fim) {
      countQuery += ` AND al.timestamp <= $${paramIndex++}`;
      countParams.push(data_fim);
    }

    if (tabela_afetada) {
      countQuery += ` AND al.tabela_afetada = $${paramIndex++}`;
      countParams.push(tabela_afetada);
    }

    if (operacao) {
      countQuery += ` AND al.operacao = $${paramIndex++}`;
      countParams.push(operacao);
    }

    if (registro_id) {
      countQuery += ` AND al.registro_id = $${paramIndex++}`;
      countParams.push(registro_id);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Processar logs para usar informações atualizadas do usuário
    const logsProcessados = logs.map((log: any) => ({
      ...log,
      usuario_email: log.usuario_email_atual || log.usuario_email,
      usuario_nome: log.usuario_nome_atual || log.usuario_nome
    }));

    res.json({
      logs: logsProcessados,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    return;
  } catch (error) {
    console.error('Erro ao listar logs de auditoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
    return;
  }
};

// Detalhes de um log específico
export const detalhesLogAuditoria = async (req: AuthRequest, res: Response) => {
  try {
    if (
      req.user?.perfil !== 'admin' &&
      !req.user?.paginas_permitidas?.includes('auditoria')
    ) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissão de auditoria necessária.' 
      });
    }

    const { id } = req.params;

    const query = `
      SELECT 
        al.*,
        u.email as usuario_email_atual,
        u.nome as usuario_nome_atual
      FROM auditoria_log al
      LEFT JOIN users u ON al.usuario_id = u.id
      WHERE al.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log de auditoria não encontrado' });
    }

    const log = result.rows[0];

    // Processar log para usar informações atualizadas do usuário
    const logProcessado = {
      ...log,
      usuario_email: log.usuario_email_atual || log.usuario_email,
      usuario_nome: log.usuario_nome_atual || log.usuario_nome
    };

    res.json(logProcessado);
    return;
  } catch (error) {
    console.error('Erro ao buscar detalhes do log:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
    return;
  }
};

// Estatísticas de auditoria
export const estatisticasAuditoria = async (req: AuthRequest, res: Response) => {
  try {
    if (
      req.user?.perfil !== 'admin' &&
      !req.user?.paginas_permitidas?.includes('auditoria')
    ) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissão de auditoria necessária.' 
      });
    }

    const { data_inicio, data_fim } = req.query as { data_inicio?: string; data_fim?: string };

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (data_inicio || data_fim) {
      whereClause = 'WHERE ';
      if (data_inicio) {
        whereClause += `timestamp >= $${paramIndex++}`;
        params.push(data_inicio);
      }
      if (data_fim) {
        whereClause += data_inicio ? ` AND timestamp <= $${paramIndex++}` : `timestamp <= $${paramIndex++}`;
        params.push(data_fim);
      }
    }

    // Total de operações
    const totalQuery = `SELECT COUNT(*) as total FROM auditoria_log ${whereClause}`;
    const totalResult = await pool.query(totalQuery, params);
    const total = parseInt(totalResult.rows[0].total);

    // Operações por tipo
    const operacoesQuery = `
      SELECT operacao, COUNT(*) as quantidade
      FROM auditoria_log ${whereClause}
      GROUP BY operacao
      ORDER BY quantidade DESC
    `;
    const operacoesResult = await pool.query(operacoesQuery, params);

    // Operações por tabela
    const tabelasQuery = `
      SELECT tabela_afetada, COUNT(*) as quantidade
      FROM auditoria_log ${whereClause}
      GROUP BY tabela_afetada
      ORDER BY quantidade DESC
    `;
    const tabelasResult = await pool.query(tabelasQuery, params);

    // Top usuários
    const usuariosQuery = `
      SELECT 
        al.usuario_id,
        COALESCE(u.nome, al.usuario_nome) as nome,
        COALESCE(u.email, al.usuario_email) as email,
        COUNT(*) as quantidade
      FROM auditoria_log al
      LEFT JOIN users u ON al.usuario_id = u.id
      ${whereClause}
      GROUP BY al.usuario_id, u.nome, al.usuario_nome, u.email, al.usuario_email
      ORDER BY quantidade DESC
      LIMIT 10
    `;
    const usuariosResult = await pool.query(usuariosQuery, params);

    // Operações por dia (últimos 30 dias)
    const operacoesPorDiaQuery = `
      SELECT 
        DATE(timestamp) as data,
        COUNT(*) as quantidade
      FROM auditoria_log
      WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY data DESC
    `;
    const operacoesPorDiaResult = await pool.query(operacoesPorDiaQuery);

    res.json({
      total,
      operacoes: operacoesResult.rows,
      tabelas: tabelasResult.rows,
      topUsuarios: usuariosResult.rows,
      operacoesPorDia: operacoesPorDiaResult.rows
    });
    return;
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
    return;
  }
};

// Exportar logs de auditoria
export const exportarLogsAuditoria = async (req: AuthRequest, res: Response) => {
  try {
    if (
      req.user?.perfil !== 'admin' &&
      !req.user?.paginas_permitidas?.includes('auditoria')
    ) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissão de auditoria necessária.' 
      });
    }

    const {
      usuario_id,
      data_inicio,
      data_fim,
      tabela_afetada,
      operacao,
      registro_id,
      formato = 'csv'
    } = req.body as FiltrosAuditoria & { formato: string };

    // Construir query base com JOIN para processos
    let query = `
      SELECT 
        al.id,
        al.usuario_id,
        COALESCE(u.email, al.usuario_email) as usuario_email,
        COALESCE(u.nome, al.usuario_nome) as usuario_nome,
        al.tabela_afetada,
        al.operacao,
        al.registro_id,
        CASE 
          WHEN al.tabela_afetada = 'processos' AND al.registro_id IS NOT NULL 
          THEN p.nup 
          ELSE NULL 
        END as processo_nup,
        al.dados_anteriores,
        al.dados_novos,
        al.ip_address,
        al.user_agent,
        al.timestamp
      FROM auditoria_log al
      LEFT JOIN users u ON al.usuario_id = u.id
      LEFT JOIN processos p ON al.tabela_afetada = 'processos' AND al.registro_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Aplicar filtros
    if (usuario_id) {
      query += ` AND al.usuario_id = $${paramIndex++}`;
      params.push(usuario_id);
    }

    if (data_inicio) {
      query += ` AND al.timestamp >= $${paramIndex++}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND al.timestamp <= $${paramIndex++}`;
      params.push(data_fim);
    }

    if (tabela_afetada) {
      query += ` AND al.tabela_afetada = $${paramIndex++}`;
      params.push(tabela_afetada);
    }

    if (operacao) {
      query += ` AND al.operacao = $${paramIndex++}`;
      params.push(operacao);
    }

    if (registro_id) {
      query += ` AND al.registro_id = $${paramIndex++}`;
      params.push(registro_id);
    }

    query += ` ORDER BY al.timestamp DESC`;

    const result = await pool.query(query, params);
    const logs = result.rows;

    if (formato === 'csv') {
      // Função para formatar NUP
      const formatNupExibicao = (nupCompleto: string): string => {
        if (!nupCompleto) return '';
        
        // Extrai apenas o número e ano do NUP completo (formato: 00000.0.000001/2025)
        const match = nupCompleto.match(/^\d{5}\.0\.(\d{6})\/(\d{4})$/);
        if (match) {
          const numero = match[1];
          const ano = match[2];
          return `${numero}/${ano}`;
        }
        
        // Se não for formato completo, tenta extrair número/ano de outros formatos
        const matchSimples = nupCompleto.match(/^(\d{1,6})\/(\d{4})$/);
        if (matchSimples) {
          const numero = matchSimples[1].padStart(6, '0');
          const ano = matchSimples[2];
          return `${numero}/${ano}`;
        }
        
        return nupCompleto;
      };

      // Função para escapar CSV
      const escapeCsv = (value: any): string => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      // Gerar CSV com headers em português
      const headers = [
        'ID', 'Usuário ID', 'Usuário Email', 'Usuário Nome', 'Tabela', 
        'Operação', 'Registro ID', 'NUP Processo', 'IP', 'User Agent', 'Timestamp'
      ];

      const csvContent = [
        headers.join(','),
        ...logs.map((log: any) => [
          log.id,
          log.usuario_id || '',
          escapeCsv(log.usuario_email || 'Desconhecido'),
          escapeCsv(log.usuario_nome || 'Desconhecido'),
          log.tabela_afetada,
          log.operacao,
          log.registro_id || '',
          escapeCsv(formatNupExibicao(log.processo_nup || '')),
          log.ip_address || '',
          escapeCsv(log.user_agent ?? ''),
          log.timestamp
        ].join(','))
      ].join('\n');

      // Adicionar BOM (Byte Order Mark) para UTF-8
      const bom = '\uFEFF';
      const csvWithBom = bom + csvContent;

      const filename = `auditoria_logs_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvWithBom);
      return;
    } else {
      // Retornar JSON
      res.json(logs);
      return;
    }

  } catch (error) {
    console.error('Erro ao exportar logs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
    return;
  }
};

// Função para atualizar informações do usuário nos logs (chamada após operações)
export const atualizarUsuarioLog = async (logId: number, usuarioId: number, usuarioEmail: string, usuarioNome: string) => {
  try {
    const query = `
      UPDATE auditoria_log 
      SET usuario_id = $1, usuario_email = $2, usuario_nome = $3
      WHERE id = $4
    `;
    await pool.query(query, [usuarioId, usuarioEmail, usuarioNome, logId]);
  } catch (error) {
    console.error('Erro ao atualizar usuário no log:', error);
  }
};