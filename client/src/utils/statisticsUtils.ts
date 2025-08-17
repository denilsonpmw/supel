/**
 * Utilitários para o frontend lidar com dados filtrados estatisticamente
 */

import api from '../services/api';

export interface EstatisticasFiltro {
  processos_originais: number;
  processos_validos: number;
  outliers_removidos: number;
  media_valores?: number;
  desvio_padrao?: number;
  valor_maximo_permitido?: number;
}

export interface DadosComEstatisticas<T> {
  data: T[];
  estatisticas?: EstatisticasFiltro;
  estatisticas_filtro?: EstatisticasFiltro;
}

export interface ProcessoOutlier {
  id: number;
  nup: string;
  objeto: string;
  unidade_gestora: string;
  modalidade: string;
  numero_ano: string;
  situacao: string;
  cor_situacao: string;
  data_situacao: string | null;
  valor_estimado: number;
  valor_formatado: string;
}

export interface EstatisticasOutliers {
  totalProcessos: number;
  processosValidos: number;
  processosOutliers: number;
  limiteOutlier: number;
  media: number;
  desvioPadrao: number;
}

export interface DadosOutliers {
  data: ProcessoOutlier[];
  estatisticas: EstatisticasOutliers;
}

/**
 * Formata as estatísticas de filtro para exibição
 */
export const formatarEstatisticasFiltro = (stats?: EstatisticasFiltro | null): string | null => {
  if (!stats || stats.outliers_removidos === 0) return null;
  
  const percentualRemovido = ((stats.outliers_removidos / stats.processos_originais) * 100).toFixed(1);
  return `${stats.outliers_removidos} processos (${percentualRemovido}%) foram ocultados por terem valores muito acima da média`;
};

/**
 * Verifica se os dados foram filtrados estatisticamente
 */
export const dadosForamFiltrados = (stats?: EstatisticasFiltro | null): boolean => {
  return Boolean(stats && stats.outliers_removidos > 0);
};

/**
 * Formata valor monetário para exibição
 */
export const formatarValorMonetario = (valor: number): string => {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * Cria tooltip informativo sobre filtros aplicados
 */
export const criarTooltipFiltro = (stats?: EstatisticasFiltro | null): string => {
  if (!dadosForamFiltrados(stats)) {
    return 'Todos os processos estão sendo exibidos';
  }

  const percentualRemovido = ((stats!.outliers_removidos / stats!.processos_originais) * 100).toFixed(1);
  let tooltip = `🔍 Filtro estatístico aplicado:\n`;
  tooltip += `• Processos originais: ${stats!.processos_originais}\n`;
  tooltip += `• Processos exibidos: ${stats!.processos_validos}\n`;
  tooltip += `• Outliers ocultos: ${stats!.outliers_removidos} (${percentualRemovido}%)\n`;
  
  if (stats!.media_valores && stats!.valor_maximo_permitido) {
    tooltip += `\n📊 Critério estatístico:\n`;
    tooltip += `• Média dos valores: ${formatarValorMonetario(stats!.media_valores)}\n`;
    tooltip += `• Limite máximo: ${formatarValorMonetario(stats!.valor_maximo_permitido)}\n`;
    tooltip += `• Desvio padrão: ${formatarValorMonetario(stats!.desvio_padrao || 0)}`;
  }

  return tooltip;
};

/**
 * Componente de aviso sobre filtros aplicados
 */
export const obterTextoAvisoFiltro = (stats?: EstatisticasFiltro | null): {
  mostrar: boolean;
  texto: string;
  severidade: 'info' | 'warning';
} => {
  if (!dadosForamFiltrados(stats)) {
    return {
      mostrar: false,
      texto: '',
      severidade: 'info'
    };
  }

  const percentualRemovido = ((stats!.outliers_removidos / stats!.processos_originais) * 100).toFixed(1);
  
  return {
    mostrar: true,
    texto: `📊 Filtro estatístico ativo: ${stats!.outliers_removidos} processos (${percentualRemovido}%) com valores muito acima da média foram ocultados para melhor visualização.`,
    severidade: parseFloat(percentualRemovido) > 10 ? 'warning' : 'info'
  };
};

/**
 * Busca os detalhes dos processos outliers (ocultos)
 */
export const buscarDetalhesOutliers = async (): Promise<DadosOutliers> => {
  // console.log('🔐 Token no localStorage:', !!localStorage.getItem('supel_token'));
  // console.log('🔗 Fazendo requisição para:', '/dashboard/outliers-detalhes');
  
  const response = await api.get('/dashboard/outliers-detalhes');
  return response.data;
};
