import { Request, Response } from 'express';
import pool from '../database/connection';

// Listar todas as adesões
export const getAdesoes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, ug_id, situacao_id } = req.query;
    
    let query = `
      SELECT 
        pa.*,
        ug.sigla as unidade_gestora_sigla,
        ug.nome_completo_unidade as unidade_gestora_nome,
        s.nome_situacao,
        s.cor_hex as situacao_cor_hex,
        s.eh_finalizadora as situacao_eh_finalizadora
      FROM processos_adesao pa
      LEFT JOIN unidades_gestoras ug ON pa.ug_id = ug.id
      LEFT JOIN situacoes s ON pa.situacao_id = s.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCounter = 1;

    // Filtros de busca
    if (search) {
      query += ` AND (pa.nup ILIKE $${paramCounter} OR pa.objeto ILIKE $${paramCounter} OR pa.fornecedor ILIKE $${paramCounter})`;
      params.push(`%${search}%`);
      paramCounter++;
    }

    if (ug_id) {
      query += ` AND pa.ug_id = $${paramCounter}`;
      params.push(ug_id);
      paramCounter++;
    }

    if (situacao_id) {
      query += ` AND pa.situacao_id = $${paramCounter}`;
      params.push(situacao_id);
      paramCounter++;
    }

    query += ' ORDER BY pa.data_entrada DESC, pa.id DESC';

    const result = await pool.query(query, params);
    res.json({
        data: result.rows,
        pagination: {
            total: result.rows.length,
            page: 1,
            limit: result.rows.length,
            totalPages: 1
        }
    });
  } catch (error) {
    console.error('Erro ao listar processos de adesão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter adesão por ID
export const getAdesaoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        pa.*,
        ug.sigla as unidade_gestora_sigla,
        ug.nome_completo_unidade as unidade_gestora_nome,
        s.nome_situacao,
        s.cor_hex as situacao_cor_hex,
        s.eh_finalizadora as situacao_eh_finalizadora
      FROM processos_adesao pa
      LEFT JOIN unidades_gestoras ug ON pa.ug_id = ug.id
      LEFT JOIN situacoes s ON pa.situacao_id = s.id
      WHERE pa.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Processo de adesão não encontrado' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter processo de adesão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova adesão
export const createAdesao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
        nup, objeto, ug_id, valor, fornecedor, 
        situacao_id, data_entrada, data_situacao, observacoes 
    } = req.body;

    // Validações básicas
    if (!nup || !objeto || !ug_id || !fornecedor || !situacao_id || !data_entrada || !data_situacao) {
      res.status(400).json({ error: 'Campos obrigatórios faltando' });
      return;
    }

    // Verificar NUP único
    const checkNup = await pool.query('SELECT id FROM processos_adesao WHERE nup = $1', [nup]);
    if (checkNup.rows.length > 0) {
      res.status(400).json({ error: 'Já existe um processo com este NUP' });
      return;
    }

    const query = `
      INSERT INTO processos_adesao (
        nup, objeto, ug_id, valor, fornecedor, 
        situacao_id, data_entrada, data_situacao, observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      nup, objeto?.toUpperCase(), ug_id, valor || 0, fornecedor?.toUpperCase(), 
      situacao_id, data_entrada, data_situacao, observacoes || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar processo de adesão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar adesão
export const updateAdesao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
        nup, objeto, ug_id, valor, fornecedor, 
        situacao_id, data_entrada, data_situacao, observacoes 
    } = req.body;

    // Validações básicas
    if (!nup || !objeto || !ug_id || !fornecedor || !situacao_id || !data_entrada || !data_situacao) {
      res.status(400).json({ error: 'Campos obrigatórios faltando' });
      return;
    }

    // Verificar se existe
    const adesaoCheck = await pool.query('SELECT id FROM processos_adesao WHERE id = $1', [id]);
    if (adesaoCheck.rows.length === 0) {
      res.status(404).json({ error: 'Processo de adesão não encontrado' });
      return;
    }

    // Verificar NUP único se alterou
    const checkNup = await pool.query('SELECT id FROM processos_adesao WHERE nup = $1 AND id != $2', [nup, id]);
    if (checkNup.rows.length > 0) {
      res.status(400).json({ error: 'Já existe um processo com este NUP' });
      return;
    }

    const query = `
      UPDATE processos_adesao 
      SET 
        nup = $1, 
        objeto = $2, 
        ug_id = $3, 
        valor = $4, 
        fornecedor = $5, 
        situacao_id = $6, 
        data_entrada = $7, 
        data_situacao = $8, 
        observacoes = $9
      WHERE id = $10
      RETURNING *
    `;

    const result = await pool.query(query, [
      nup, objeto?.toUpperCase(), ug_id, valor || 0, fornecedor?.toUpperCase(), 
      situacao_id, data_entrada, data_situacao, observacoes || null,
      id
    ]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar processo de adesão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar adesão
export const deleteAdesao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const adesaoCheck = await pool.query('SELECT id FROM processos_adesao WHERE id = $1', [id]);
    if (adesaoCheck.rows.length === 0) {
      res.status(404).json({ error: 'Processo de adesão não encontrado' });
      return;
    }

    await pool.query('DELETE FROM processos_adesao WHERE id = $1', [id]);
    res.json({ message: 'Processo de adesão excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar processo de adesão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Importar adesões via CSV
export const importarAdesaoCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Arquivo CSV não enviado' });
      return;
    }

    // TextDecoder produz \uFFFD confiável para bytes UTF-8 inválidos (ao contrário de Buffer.toString)
    const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
    let csvContent = utf8Decoder.decode(req.file.buffer);

    if (csvContent.includes('\uFFFD')) {
      // Arquivo em Windows-1252 / Latin-1 (padrão Excel/LibreOffice Brasil)
      const win1252Decoder = new TextDecoder('windows-1252', { fatal: false });
      csvContent = win1252Decoder.decode(req.file.buffer);
    }
    csvContent = csvContent.replace(/^\uFEFF|\uFFFE/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = csvContent.split('\n').filter((l: string) => l.trim());

    if (lines.length < 2) {
      res.status(400).json({ error: 'Arquivo CSV vazio ou sem dados' });
      return;
    }

    const firstLine = lines[0]!;

    // Detectar separador (ponto-e-vírgula prioritário, depois vírgula ou tab)
    const sep = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    // Limpar todos os tipos de aspas e espaços dos cabeçalhos
    const headers = firstLine
      .split(sep)
      .map((h: string) => h.replace(/^[\s"'\u201C\u201D]+|[\s"'\u201C\u201D]+$/g, '').toLowerCase());

    const necessarios = ['nup', 'objeto', 'sigla_unidade_gestora', 'data_entrada', 'valor', 'fornecedor', 'nome_situacao', 'data_situacao'];
    const faltando = necessarios.filter(h => !headers.includes(h));
    if (faltando.length > 0) {
      // Incluir cabeçalhos detectados para facilitar diagnóstico
      res.status(400).json({
        error: `Colunas obrigatórias ausentes: ${faltando.join(', ')}`,
        debug_headers_detectados: headers,
        debug_separador: sep
      });
      return;
    }

    const ugs = await pool.query('SELECT id, sigla FROM unidades_gestoras');
    const sits = await pool.query('SELECT id, nome_situacao FROM situacoes');

    // Função para normalizar string: minúsculas + remove acentos + espaços extras
    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

    // Mapa de U.G.: sigla exata (maiúscula)
    const ugMap: Record<string, number> = Object.fromEntries(
      ugs.rows.map((u: any) => [u.sigla.toUpperCase(), u.id])
    );

    // Mapa de situações: chave exata E chave normalizada (sem acento) — resolve encoding problems
    const sitMap: Record<string, number> = {};
    const sitNomesDisponiveis: string[] = [];
    sits.rows.forEach((s: any) => {
      sitMap[s.nome_situacao.toLowerCase()] = s.id;   // exata
      sitMap[normalize(s.nome_situacao)] = s.id;       // normalizada (sem acento)
      sitNomesDisponiveis.push(s.nome_situacao);
    });

    let importados = 0;
    let atualizados = 0;
    const erros: { linha: number; motivo: string }[] = [];

    const parseDate = (d: string) => {
      if (!d) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      const parts = d.split('/');
      if (parts.length === 3) return `${parts[2]!}-${parts[1]!.padStart(2,'0')}-${parts[0]!.padStart(2,'0')}`;
      return null;
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      const cols = line.split(sep).map((c: string) => c.replace(/^"|"$/g, '').trim());
      const row: any = {};
      headers.forEach((h: string, idx: number) => { row[h] = cols[idx] || ''; });

      try {
        const ugId = ugMap[row.sigla_unidade_gestora?.toUpperCase()];
        if (!ugId) { erros.push({ linha: i + 1, motivo: `U.G. "${row.sigla_unidade_gestora}" não encontrada. Disponíveis: ${Object.keys(ugMap).join(', ')}` }); continue; }

        // Tentar match exato → normalizado (sem acento) → busca direta no banco via translate()
        const sitKey = row.nome_situacao?.toLowerCase() || '';
        let sitId = sitMap[sitKey] || sitMap[normalize(sitKey)];

        if (!sitId && sitKey) {
          // Fallback: busca no banco removendo acentos via translate() do PostgreSQL
          const sitFallback = await pool.query(
            `SELECT id FROM situacoes WHERE lower(translate(nome_situacao,
              'áàãâéêíóõôúüçÁÀÃÂÉÊÍÓÕÔÚÜÇ',
              'aaaaeeiooouucAAAAEEIOOOUUC'))
             = lower(translate($1,
              'áàãâéêíóõôúüçÁÀÃÂÉÊÍÓÕÔÚÜÇ',
              'aaaaeeiooouucAAAAEEIOOOUUC')) LIMIT 1`,
            [row.nome_situacao]
          );
          if (sitFallback.rows.length > 0) sitId = sitFallback.rows[0].id;
        }

        if (!sitId) {
          erros.push({ linha: i + 1, motivo: `Situação "${row.nome_situacao}" não encontrada. Situações disponíveis: ${sitNomesDisponiveis.join(' | ')}` });
          continue;
        }

        const dataEntrada = parseDate(row.data_entrada);
        const dataSituacao = parseDate(row.data_situacao);
        if (!dataEntrada || !dataSituacao) { erros.push({ linha: i + 1, motivo: 'Data inválida (use YYYY-MM-DD ou DD/MM/YYYY)' }); continue; }

        const valor = parseFloat((row.valor || '0').replace(',', '.')) || 0;
        const nup = row.nup?.trim();
        if (!nup) { erros.push({ linha: i + 1, motivo: 'NUP vazio' }); continue; }

        const existe = await pool.query('SELECT id FROM processos_adesao WHERE nup = $1', [nup]);
        if (existe.rows.length > 0) {
          await pool.query(
            `UPDATE processos_adesao SET objeto=$1, ug_id=$2, valor=$3, fornecedor=$4, situacao_id=$5,
             data_entrada=$6, data_situacao=$7, observacoes=$8 WHERE nup=$9`,
            [row.objeto?.toUpperCase(), ugId, valor, row.fornecedor?.toUpperCase(), sitId, dataEntrada, dataSituacao, row.observacoes || null, nup]
          );
          atualizados++;
        } else {
          await pool.query(
            `INSERT INTO processos_adesao (nup, objeto, ug_id, valor, fornecedor, situacao_id, data_entrada, data_situacao, observacoes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [nup, row.objeto?.toUpperCase(), ugId, valor, row.fornecedor?.toUpperCase(), sitId, dataEntrada, dataSituacao, row.observacoes || null]
          );
          importados++;
        }
      } catch (err: any) {
        erros.push({ linha: i + 1, motivo: err.message || 'Erro desconhecido' });
      }
    }

    res.json({ success: true, importados, atualizados, erros, total_processado: importados + atualizados, total_erros: erros.length });
  } catch (error: any) {
    console.error('Erro ao importar CSV de adesões:', error);
    res.status(500).json({ error: 'Erro interno ao processar CSV' });
  }
};
