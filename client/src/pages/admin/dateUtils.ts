// Função utilitária para parse seguro de datas YYYY-MM-DD
// Retorna data no formato brasileiro (dd/mm/aaaa) ou '-' se inválida
export const formatDate = (dateString: string) => {
  if (!dateString || typeof dateString !== 'string') return '-';
  // Se já é uma data válida no formato YYYY-MM-DD, usar diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
  }
  // Tentar converter outras strings de data
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('pt-BR');
  }
  return '-';
}; 