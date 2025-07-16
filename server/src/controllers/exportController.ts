import { Response } from 'express';
import pool from '../database/connection';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

// Exportar relatório geral em Excel
export const exportarRelatorioGeralExcel = async (req: AuthRequest, res: Response) => {
  try {
    const { data_inicio, data_fim, modalidade_id, situacao_id } = req.query;

    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (data_inicio) {
      paramCount++;
      whereClause += ` AND p.data_entrada >= $${paramCount}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      paramCount++;
      whereClause += ` AND p.data_entrada <= $${paramCount}`;
      params.push(data_fim);
    }

    if (modalidade_id) {
      paramCount++;
      whereClause += ` AND p.modalidade_id = $${paramCount}`;
      params.push(modalidade_id);
    }

    if (situacao_id) {
      paramCount++;
      whereClause += ` AND p.situacao_id = $${paramCount}`;
      params.push(situacao_id);
    }

    // Verificar se o usuário é responsável para decidir se incluir a coluna responsável
    const user = (req as any).user;
    let isResponsavel = false;

    if (user && user.perfil === 'usuario') {
      const responsavelResult = await pool.query(
        'SELECT id FROM responsaveis WHERE email = $1',
        [user.email]
      );
      if (responsavelResult.rows.length > 0) {
        isResponsavel = true;
      }
    }

    // Query baseada se o usuário é responsável ou não
    const responsavelColumn = isResponsavel ? '' : ', r.nome_responsavel as responsavel';
    const responsavelJoin = isResponsavel ? '' : 'JOIN responsaveis r ON p.responsavel_id = r.id';

    const query = `
      SELECT 
        p.nup,
        p.objeto,
        p.data_entrada,
        p.data_sessao,
        p.data_pncp,
        p.data_tce_1,
        p.data_tce_2,
        p.valor_estimado,
        p.valor_realizado,
        m.sigla_modalidade as modalidade,
        ug.sigla as unidade_gestora,
        s.nome_situacao as situacao,
        p.data_situacao
        ${responsavelColumn}
      FROM processos p
      JOIN modalidades m ON p.modalidade_id = m.id
      JOIN unidades_gestoras ug ON p.ug_id = ug.id
      JOIN situacoes s ON p.situacao_id = s.id
      ${responsavelJoin}
      ${whereClause}
      ${userFilter}
      ORDER BY p.data_entrada DESC
    `;

    const result = await pool.query(query, params);

    // Criar workbook
    const workbook = XLSX.utils.book_new();

    // Preparar dados para o Excel
    const data = result.rows.map(row => {
      const baseData: any = {
        'NUP': row.nup,
        'Objeto': row.objeto,
        'Data Entrada': new Date(row.data_entrada).toLocaleDateString('pt-BR'),
        'Data Sessão': row.data_sessao ? new Date(row.data_sessao).toLocaleDateString('pt-BR') : '',
        'Data PNCP': row.data_pncp ? new Date(row.data_pncp).toLocaleDateString('pt-BR') : '',
        'Data TCE 1': row.data_tce_1 ? new Date(row.data_tce_1).toLocaleDateString('pt-BR') : '',
        'Data TCE 2': row.data_tce_2 ? new Date(row.data_tce_2).toLocaleDateString('pt-BR') : '',
        'Mod': row.modalidade,
        'Unidade Gestora': row.unidade_gestora,
        'Situação': row.situacao,
        'Data Situação': row.data_situacao ? new Date(row.data_situacao).toLocaleDateString('pt-BR') : '',
        'Valor Estimado': row.valor_estimado ? parseFloat(row.valor_estimado) : 0,
        'Valor Realizado': row.valor_realizado ? parseFloat(row.valor_realizado) : 0
      };

      // Adicionar coluna responsável apenas se não for responsável
      if (!isResponsavel && row.responsavel) {
        baseData['Responsável'] = row.responsavel;
      }

      return baseData;
    });

    // Criar planilha
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Adicionar planilha ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Geral');

    // Gerar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Configurar headers para download
    const filename = `relatorio_geral_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(buffer);
  } catch (error) {
    console.error('Erro ao exportar relatório geral em Excel:', error);
    throw createError('Erro ao exportar relatório', 500);
  }
};

// Exportar relatório geral em PDF
export const exportarRelatorioGeralPDF = async (req: AuthRequest, res: Response) => {
  try {
    const { data_inicio, data_fim, modalidade_id, situacao_id } = req.query;

    // Filtro por responsável para usuários não-admin
    const userFilter = (req as any).userResponsavelId && (req as any).userResponsavelId !== -1 
      ? `AND p.responsavel_id = ${(req as any).userResponsavelId}` 
      : '';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (data_inicio) {
      paramCount++;
      whereClause += ` AND p.data_entrada >= $${paramCount}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      paramCount++;
      whereClause += ` AND p.data_entrada <= $${paramCount}`;
      params.push(data_fim);
    }

    if (modalidade_id) {
      paramCount++;
      whereClause += ` AND p.modalidade_id = $${paramCount}`;
      params.push(modalidade_id);
    }

    if (situacao_id) {
      paramCount++;
      whereClause += ` AND p.situacao_id = $${paramCount}`;
      params.push(situacao_id);
    }

    const query = `
      SELECT 
        p.nup,
        p.objeto,
        p.data_entrada,
        p.data_sessao,
        p.data_pncp,
        p.data_tce_1,
        p.data_tce_2,
        p.valor_estimado,
        p.valor_realizado,
        p.conclusao,
        m.sigla_modalidade as modalidade,
        ug.sigla as unidade_gestora,
        r.nome_responsavel as responsavel,
        s.nome_situacao as situacao,
        p.data_situacao
      FROM processos p
      JOIN modalidades m ON p.modalidade_id = m.id
      JOIN unidades_gestoras ug ON p.ug_id = ug.id
      JOIN responsaveis r ON p.responsavel_id = r.id
      JOIN situacoes s ON p.situacao_id = s.id
      ${whereClause}
      ${userFilter}
      ORDER BY p.data_entrada DESC
      LIMIT 50
    `;

    const result = await pool.query(query, params);

    // Criar documento PDF
    const doc = new PDFDocument({ margin: 50 });

    // Configurar headers para download
    const filename = `relatorio_geral_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe do documento para a response
    doc.pipe(res);

    // Título
    doc.fontSize(18).text('SUPEL - Relatório Geral de Processos', { align: 'center' });
    doc.moveDown();

    // Adicionar nome do responsável se o usuário for responsável
    if ((req as any).userResponsavelId && (req as any).userResponsavelId !== -1) {
      // Buscar nome do responsável
      const responsavelQuery = `
        SELECT nome_responsavel 
        FROM responsaveis 
        WHERE id = ${(req as any).userResponsavelId}
      `;
      const responsavelResult = await pool.query(responsavelQuery);
      
      if (responsavelResult.rows.length > 0) {
        doc.fontSize(12).text(`Responsável: ${responsavelResult.rows[0].nome_responsavel}`, { align: 'center' });
        doc.moveDown();
      }
    }

    // Informações do relatório
    doc.fontSize(12);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'right' });
    doc.text(`Total de Processos: ${result.rows.length}`, { align: 'right' });
    doc.moveDown();

    // Cabeçalho da tabela
    const startY = doc.y;
    doc.fontSize(10);
    
    // Definir colunas baseado se o usuário é responsável
    const user = (req as any).user;
    let isResponsavel = false;

    if (user && user.perfil === 'usuario') {
      const responsavelResult = await pool.query(
        'SELECT id FROM responsaveis WHERE email = $1',
        [user.email]
      );
      if (responsavelResult.rows.length > 0) {
        isResponsavel = true;
      }
    }

    const cols = [
      { header: 'NUP', width: 80 },
      { header: 'Objeto', width: 150 },
      { header: 'Mod', width: 50 },
      { header: 'UG', width: 40 },
      ...(isResponsavel ? [] : [{ header: 'Responsável', width: 80 }]),
      { header: 'Situação', width: 80 },
      { header: 'Valor Est.', width: 70 }
    ];

    let currentX = 50;
    
    // Desenhar cabeçalho
    cols.forEach(col => {
      doc.rect(currentX, startY, col.width, 20).stroke();
      doc.text(col.header, currentX + 2, startY + 5, { width: col.width - 4 });
      currentX += col.width;
    });

    // Desenhar linhas de dados
    let currentY = startY + 20;
    
    result.rows.slice(0, 30).forEach(row => { // Limitar a 30 registros para caber na página
      currentX = 50;
      
      const rowData = [
        row.nup,
        row.objeto.substring(0, 25) + (row.objeto.length > 25 ? '...' : ''),
        row.modalidade,
        row.unidade_gestora,
        ...(isResponsavel ? [] : [row.responsavel.substring(0, 15) + (row.responsavel.length > 15 ? '...' : '')]),
        row.situacao.substring(0, 15) + (row.situacao.length > 15 ? '...' : ''),
        `R$ ${parseFloat(row.valor_estimado || 0).toLocaleString('pt-BR')}`
      ];

      cols.forEach((col, index) => {
        doc.rect(currentX, currentY, col.width, 15).stroke();
        doc.text(rowData[index], currentX + 2, currentY + 2, { width: col.width - 4, height: 11 });
        currentX += col.width;
      });

      currentY += 15;
      
      // Nova página se necessário
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    });

    // Rodapé
    doc.fontSize(8);
    doc.text(`Gerado pelo SUPEL em ${new Date().toLocaleString('pt-BR')}`, 50, 750, { align: 'center' });

    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error('Erro ao exportar relatório geral em PDF:', error);
    throw createError('Erro ao exportar relatório', 500);
  }
};