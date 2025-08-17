/**
 * Utilitários para análise estatística de processos
 * Funcionalidade: Filtrar processos com valores muito acima do desvio padrão
 */

export interface ProcessoValor {
  id: number;
  valor_estimado: number;
}

export interface ProcessoOutlier {
  id: number;
  nup: string;
  objeto: string;
  ug_sigla: string;
  valor_estimado: number;
  modalidade_sigla?: string | undefined;
  numero_ano?: string | undefined;
  situacao?: string | undefined;
  cor_situacao?: string | undefined;
  data_entrada?: string | Date | null | undefined;
  data_situacao?: string | Date | null | undefined;
}

export interface StatisticalData {
  media: number;
  desvioPadrao: number;
  valorMaximoPermitido: number;
  limiteOutlier: number;
  totalProcessos: number;
  processosOutliers: number;
  processosValidos: number;
  outliersDetalhados?: ProcessoOutlier[];
}

/**
 * Calcula a média de um array de números
 */
export const calcularMedia = (valores: number[]): number => {
  if (valores.length === 0) return 0;
  const soma = valores.reduce((acc, valor) => acc + valor, 0);
  return soma / valores.length;
};

/**
 * Calcula o desvio padrão de um array de números
 */
export const calcularDesvioPadrao = (valores: number[], media?: number): number => {
  if (valores.length === 0) return 0;
  
  const mediaCalculada = media ?? calcularMedia(valores);
  const somaDiferencasQuadraticas = valores.reduce((acc, valor) => {
    return acc + Math.pow(valor - mediaCalculada, 2);
  }, 0);
  
  return Math.sqrt(somaDiferencasQuadraticas / valores.length);
};

/**
 * Calcula dados estatísticos de uma lista de processos
 */
export const calcularDadosEstatisticos = (processos: ProcessoValor[], multiplicadorDesvio = 2): StatisticalData => {
  // Filtrar apenas processos com valores válidos (> 0)
  const valoresValidos = processos
    .map(p => p.valor_estimado)
    .filter(valor => valor > 0);

  if (valoresValidos.length === 0) {
    return {
      media: 0,
      desvioPadrao: 0,
      valorMaximoPermitido: 0,
      limiteOutlier: 0,
      totalProcessos: 0,
      processosOutliers: 0,
      processosValidos: 0
    };
  }

  const media = calcularMedia(valoresValidos);
  const desvioPadrao = calcularDesvioPadrao(valoresValidos, media);
  
  // Valor máximo permitido: média + (multiplicador * desvio padrão)
  const valorMaximoPermitido = media + (multiplicadorDesvio * desvioPadrao);
  
  // Contar outliers
  const processosOutliers = valoresValidos.filter(valor => valor > valorMaximoPermitido).length;
  
  // Calcular processos válidos (total - outliers)
  const processosValidosAposRemocao = processos.length - processosOutliers;

  return {
    media,
    desvioPadrao,
    valorMaximoPermitido,
    limiteOutlier: valorMaximoPermitido,
    totalProcessos: processos.length,
    processosOutliers,
    processosValidos: processosValidosAposRemocao  // CORREÇÃO: total - outliers
  };
};

/**
 * Filtra processos removendo outliers baseado no desvio padrão
 * @param processos Array de processos para filtrar
 * @param multiplicadorDesvio Multiplicador do desvio padrão (padrão: 2)
 * @returns Array de processos sem outliers
 */
export const filtrarProcessosSemOutliers = <T extends ProcessoValor>(
  processos: T[], 
  multiplicadorDesvio = 2
): { processosValidos: T[], dadosEstatisticos: StatisticalData } => {
  const dadosEstatisticos = calcularDadosEstatisticos(processos, multiplicadorDesvio);
  
  // Se não há dados estatísticos válidos, retorna todos os processos
  if (dadosEstatisticos.processosValidos === 0) {
    return { 
      processosValidos: processos,
      dadosEstatisticos
    };
  }

  // Filtrar processos que estão dentro do limite estatístico
  const processosValidos = processos.filter(processo => {
    // Manter processos com valor 0 ou nulo (não são outliers)
    if (processo.valor_estimado <= 0) {
      return true;
    }
    
    // Filtrar valores que excedem o limite
    return processo.valor_estimado <= dadosEstatisticos.valorMaximoPermitido;
  });

  return {
    processosValidos,
    dadosEstatisticos
  };
};

/**
 * Função centralizada para obter processos válidos (sem outliers) para dashboard
 * Garante que todos os endpoints usem o mesmo critério estatístico
 */
export const obterProcessosValidosParaDashboard = async (
  pool: any, 
  userFilter: string = '', 
  multiplicadorDesvio = 2
): Promise<{
  idsProcessosValidos: number[];
  dadosEstatisticos: StatisticalData;
}> => {
  // Buscar todos os processos ativos para análise estatística COM DETALHES
  const processosEstatisticosQuery = `
    SELECT 
      p.id,
      p.nup,
      p.objeto,
      ug.sigla as ug_sigla,
      p.valor_estimado
    FROM processos p
    JOIN situacoes s ON p.situacao_id = s.id
    LEFT JOIN unidades_gestoras ug ON p.ug_id = ug.id
    WHERE s.ativo = true
    AND p.valor_estimado > 0
    ${userFilter}
  `;

  const result = await pool.query(processosEstatisticosQuery);
  const processos = result.rows.map((row: any) => ({
    id: row.id,
    nup: row.nup,
    objeto: row.objeto,
    ug_sigla: row.ug_sigla || 'N/A',
    valor_estimado: parseFloat(row.valor_estimado)
  }));

  // Aplicar filtro estatístico
  const { processosValidos, dadosEstatisticos } = filtrarProcessosComDetalhesOutliers(processos, multiplicadorDesvio);
  
  // Obter IDs dos processos válidos
  const idsProcessosValidos = processosValidos.map(p => p.id);
  
  return {
    idsProcessosValidos,
    dadosEstatisticos
  };
};

/**
 * Filtra processos removendo outliers E captura detalhes dos outliers
 */
export const filtrarProcessosComDetalhesOutliers = <T extends ProcessoOutlier>(
  processos: T[], 
  multiplicadorDesvio = 2
): { processosValidos: T[], dadosEstatisticos: StatisticalData } => {
  
  // Calcular estatísticas básicas
  const valoresValidos = processos
    .map(p => p.valor_estimado)
    .filter(valor => valor > 0);

  if (valoresValidos.length === 0) {
    return {
      processosValidos: processos,
      dadosEstatisticos: {
        media: 0,
        desvioPadrao: 0,
        valorMaximoPermitido: 0,
        limiteOutlier: 0,
        totalProcessos: 0,
        processosOutliers: 0,
        processosValidos: 0,
        outliersDetalhados: []
      }
    };
  }

  const media = calcularMedia(valoresValidos);
  const desvioPadrao = calcularDesvioPadrao(valoresValidos, media);
  const valorMaximoPermitido = media + (multiplicadorDesvio * desvioPadrao);
  
  // Separar processos válidos e outliers
  const processosValidos: T[] = [];
  const outliersDetalhados: ProcessoOutlier[] = [];

  processos.forEach(processo => {
    // Manter processos com valor 0 ou nulo (não são outliers)
    if (processo.valor_estimado <= 0) {
      processosValidos.push(processo);
    } else if (processo.valor_estimado <= valorMaximoPermitido) {
      // Processo dentro do limite estatístico
      processosValidos.push(processo);
    } else {
      // Processo outlier - capturar TODOS os detalhes
      outliersDetalhados.push({
        id: processo.id,
        nup: processo.nup,
        objeto: processo.objeto,
        ug_sigla: processo.ug_sigla,
        valor_estimado: processo.valor_estimado,
        modalidade_sigla: processo.modalidade_sigla,
        numero_ano: processo.numero_ano,
        situacao: processo.situacao,
        cor_situacao: processo.cor_situacao,
        data_entrada: processo.data_entrada,
        data_situacao: processo.data_situacao
      });
    }
  });

  const processosValidosAposRemocao = processos.length - outliersDetalhados.length;

  const dadosEstatisticos: StatisticalData = {
    media,
    desvioPadrao,
    valorMaximoPermitido,
    limiteOutlier: valorMaximoPermitido,
    totalProcessos: processos.length,
    processosOutliers: outliersDetalhados.length,
    processosValidos: processosValidosAposRemocao,
    outliersDetalhados: outliersDetalhados
  };

  return {
    processosValidos,
    dadosEstatisticos
  };
};

/**
 * Função para log de dados estatísticos (para debugging)
 */
export const logDadosEstatisticos = (dados: StatisticalData, contexto: string): void => {
  // console.log(`📊 [ESTATÍSTICAS] ${contexto}:`);
  // console.log(`   📈 Média: R$ ${dados.media.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  // console.log(`   📏 Desvio Padrão: R$ ${dados.desvioPadrao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  // console.log(`   🚫 Valor Máximo Permitido: R$ ${dados.valorMaximoPermitido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  // console.log(`   📋 Total de processos: ${dados.totalProcessos}`);
  // console.log(`   ✅ Processos exibidos: ${dados.processosValidos} (após filtro)`);
  // console.log(`   🔴 Outliers ocultos: ${dados.processosOutliers}`);
  
  if (dados.processosOutliers > 0 && dados.totalProcessos > 0) {
    const percentualOutliers = ((dados.processosOutliers / dados.totalProcessos) * 100).toFixed(1);
    // console.log(`   📊 Percentual de outliers: ${percentualOutliers}%`);
    // console.log(`   🧮 Verificação: ${dados.totalProcessos} - ${dados.processosOutliers} = ${dados.processosValidos}`);
  }
};
