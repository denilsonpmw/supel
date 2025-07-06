/**
 * Utilitários para trabalhar com datas no sistema SUPEL
 */

/**
 * Verifica se uma data é dia útil (segunda a sexta-feira)
 * @param date Data a ser verificada
 * @returns true se for dia útil, false caso contrário
 */
export function isDiaUtil(date: Date): boolean {
  const dayOfWeek = date.getDay();
  // 0 = domingo, 6 = sábado
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Formata data para exibição no padrão brasileiro
 * @param date Data a ser formatada
 * @returns String formatada em DD/MM/AAAA
 */
export function formatarDataBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Obtém o nome do dia da semana
 * @param date Data
 * @returns Nome do dia da semana em português
 */
export function getDiaSemana(date: Date): string {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return dias[date.getDay()] || 'Desconhecido';
} 