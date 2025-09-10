import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../database/connection';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// GET /api/processos-data/collected-data - Obter dados de processos do banco de dados
router.get('/collected-data', async (req, res) => {
  try {
    console.log('🔍 Tentando buscar dados do banco de dados...');
    
    // Primeiro verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'microempresas_licitacoes'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('⚠️ Tabela não existe, retornando dados de teste');
      // Retornar dados de teste se a tabela não existir
      res.json({
        dados: [
          {
            numero: "TEST001",
            tipo_licitacao: "Pregão Eletrônico",
            dataAberturaPropostas: "15/08/2025",
            participante: {
              declaracaoME: true,
              tipoEmpresa: "Microempresa"
            }
          }
        ],
        stats: {
          total: 1,
          totalMicroEmpresas: 1,
          tipos: ["Pregão Eletrônico"],
          tiposEmpresa: ["Microempresa"],
          totalPaginas: 1,
          paginaAtual: 1
        },
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        source: 'teste'
      });
      return;
    }

    // Se a tabela existe, buscar dados reais
    const { page = 1, limit = 10, tipo = '', numero = '' } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const offset = (pageNumber - 1) * limitNumber;

    // Construir filtros
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

    // Buscar dados
    const countQuery = `SELECT COUNT(*) as total FROM microempresas_licitacoes ${whereClause}`;
    const dataQuery = `
      SELECT 
        numero_licitacao as numero,
        tipo_licitacao,
        data_abertura_propostas,
        razao_social,
        cnpj,
        declaracao_me,
        tipo_empresa
      FROM microempresas_licitacoes 
      ${whereClause}
      ORDER BY data_abertura_date DESC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, [...params, limitNumber, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNumber);

    // Formatar dados
    const dadosFormatados = dataResult.rows.map((row: any) => ({
      numero: row.numero,
      tipo_licitacao: row.tipo_licitacao,
      dataAberturaPropostas: row.data_abertura_propostas,
      razaoSocial: row.razao_social,
      participante: {
        razaoSocial: row.razao_social,
        cnpj: row.cnpj,
        declaracaoME: row.declaracao_me,
        tipoEmpresa: row.tipo_empresa
      }
    }));

    console.log(`📄 Retornando ${dadosFormatados.length} registros de ${total} total do banco`);

    res.json({
      dados: dadosFormatados,
      stats: {
        total,
        totalMicroEmpresas: total,
        tipos: [],
        tiposEmpresa: [],
        totalPaginas: totalPages,
        paginaAtual: pageNumber
      },
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages
      },
      source: 'banco'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
    // Em caso de erro, retornar dados de teste
    res.json({
      dados: [
        {
          numero: "ERROR001",
          tipo_licitacao: "Erro - Dados de Teste",
          dataAberturaPropostas: "09/09/2025",
          participante: {
            declaracaoME: true,
            tipoEmpresa: "Microempresa"
          }
        }
      ],
      stats: {
        total: 1,
        totalMicroEmpresas: 1,
        tipos: ["Erro - Dados de Teste"],
        tiposEmpresa: ["Microempresa"],
        totalPaginas: 1,
        paginaAtual: 1
      },
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      },
      source: 'erro',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/processos-data/stats - Obter estatísticas dos dados
router.get('/stats', async (req, res) => {
  try {
    res.json({
      totalProcessos: 0,
      totalParticipantes: 0,
      totalMicroEmpresas: 0,
      tipos: [],
      dataAtualizacao: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/processos-data/create-table - Criar tabela no banco
router.post('/create-table', async (req, res) => {
  try {
    console.log('🏗️ Criando tabela microempresas_licitacoes...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS microempresas_licitacoes (
          id SERIAL PRIMARY KEY,
          numero_licitacao VARCHAR(100) NOT NULL,
          tipo_licitacao VARCHAR(200) NOT NULL,
          data_abertura_propostas VARCHAR(20) NOT NULL,
          data_abertura_date DATE,
          id_licitacao VARCHAR(100),
          razao_social VARCHAR(500) NOT NULL,
          cnpj VARCHAR(20),
          declaracao_me BOOLEAN DEFAULT true,
          tipo_empresa VARCHAR(100),
          data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT unique_empresa_licitacao UNIQUE(numero_licitacao, cnpj)
      );
    `);
    
    // Criar índices
    await pool.query('CREATE INDEX IF NOT EXISTS idx_microempresas_numero ON microempresas_licitacoes(numero_licitacao);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_microempresas_tipo ON microempresas_licitacoes(tipo_licitacao);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_microempresas_data ON microempresas_licitacoes(data_abertura_date);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_microempresas_cnpj ON microempresas_licitacoes(cnpj);');
    
    console.log('✅ Tabela criada com sucesso!');
    
    res.json({
      success: true,
      message: 'Tabela microempresas_licitacoes criada com sucesso!'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar tabela',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
