import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../database/connection';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// GET /api/processos-data/collected-data - Obter dados de processos do banco de dados
router.get('/collected-data', async (req, res) => {
  try {
    console.log('🔍 Requisição recebida para collected-data (BD)');
    
    const { 
      page = 1, 
      limit = 10, 
      tipo = '', 
      numero = '',
      orderBy = 'data_abertura_date',
      orderDir = 'DESC'
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const offset = (pageNumber - 1) * limitNumber;

    // Construir condições WHERE dinamicamente
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (tipo && tipo.toString().trim()) {
      conditions.push(`tipo_licitacao ILIKE $${paramIndex}`);
      params.push(`%${tipo.toString().trim()}%`);
      paramIndex++;
    }

    if (numero && numero.toString().trim()) {
      conditions.push(`numero_licitacao ILIKE $${paramIndex}`);
      params.push(`%${numero.toString().trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM microempresas_licitacoes 
      ${whereClause}
    `;

    // Query para buscar dados paginados
    const dataQuery = `
      SELECT 
        numero_licitacao as numero,
        tipo_licitacao,
        data_abertura_propostas,
        razao_social,
        cnpj,
        declaracao_me,
        tipo_empresa,
        data_importacao
      FROM microempresas_licitacoes 
      ${whereClause}
      ORDER BY ${orderBy === 'data_abertura_date' ? 'data_abertura_date' : 'numero_licitacao'} ${orderDir === 'DESC' ? 'DESC' : 'ASC'}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Executar queries
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, [...params, limitNumber, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNumber);

    // Formatar dados para compatibilidade com o frontend
    const dadosFormatados = dataResult.rows.map((row: any) => ({
      numero: row.numero,
      tipo_licitacao: row.tipo_licitacao,
      dataAberturaPropostas: row.data_abertura_propostas,
      participante: {
        razaoSocial: row.razao_social,
        cnpj: row.cnpj,
        declaracaoME: row.declaracao_me,
        tipoEmpresa: row.tipo_empresa
      }
    }));

    // Buscar estatísticas para filtros
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT tipo_licitacao) as tipos_count,
        COUNT(DISTINCT tipo_empresa) as tipos_empresa_count,
        array_agg(DISTINCT tipo_licitacao) as tipos,
        array_agg(DISTINCT tipo_empresa) as tipos_empresa
      FROM microempresas_licitacoes
      ${whereClause}
    `;

    const statsResult = await pool.query(statsQuery, params);
    const stats = statsResult.rows[0];

    console.log(`📄 Retornando página ${pageNumber} com ${dadosFormatados.length} registros de ${total} total`);

    res.json({
      dados: dadosFormatados,
      stats: {
        total,
        totalMicroEmpresas: total, // Todos são ME por definição
        tipos: stats.tipos || [],
        tiposEmpresa: stats.tipos_empresa || [],
        totalPaginas: totalPages,
        paginaAtual: pageNumber
      },
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Erro ao carregar dados do banco:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao carregar dados de processos'
    });
  }
});

// GET /api/processos-data/stats - Obter estatísticas dos dados
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_registros,
        COUNT(DISTINCT numero_licitacao) as total_licitacoes,
        COUNT(DISTINCT cnpj) as total_empresas,
        COUNT(DISTINCT tipo_licitacao) as tipos_licitacao,
        MIN(data_importacao) as primeira_importacao,
        MAX(data_importacao) as ultima_importacao
      FROM microempresas_licitacoes
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      totalProcessos: parseInt(stats.total_licitacoes) || 0,
      totalParticipantes: parseInt(stats.total_registros) || 0,
      totalMicroEmpresas: parseInt(stats.total_registros) || 0,
      totalEmpresas: parseInt(stats.total_empresas) || 0,
      tiposLicitacao: parseInt(stats.tipos_licitacao) || 0,
      dataAtualizacao: stats.ultima_importacao || new Date().toISOString(),
      primeiraImportacao: stats.primeira_importacao
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      totalProcessos: 0,
      totalParticipantes: 0,
      totalMicroEmpresas: 0,
      dataAtualizacao: new Date().toISOString()
    });
  }
});

// POST /api/processos-data/import - Importar dados do JSON para o banco
// router.post('/import', async (req, res) => {
//   try {
//     console.log('🚀 Iniciando importação via API...');
//     
//     // Importar usando o script que criamos
//     const { importarMicroempresasDoJSON } = await import('../../scripts/importar-microempresas');
//     
//     // Executar importação em background
//     importarMicroempresasDoJSON()
//       .then(() => {
//         console.log('✅ Importação concluída com sucesso!');
//       })
//       .catch((error) => {
//         console.error('❌ Erro na importação:', error);
//       });

//     res.json({
//       message: 'Importação iniciada em background',
//       status: 'em_andamento'
//     });

//   } catch (error) {
//     console.error('❌ Erro ao iniciar importação:', error);
//     res.status(500).json({
//       error: 'Erro interno do servidor ao iniciar importação'
//     });
//   }
// });

export default router;
