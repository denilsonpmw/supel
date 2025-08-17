/**
 * Utilitários para formatação e manipulação de datas
 * Resolve o problema comum de data com 1 dia a menos devido ao fuso horário
 */

/**
 * Formata uma data para o padrão brasileiro (dd/mm/aaaa)
 * Resolve o problema de timezone que causava 1 dia a menos
 * 
 * @param dateValue - Data como string ISO, Date object, ou null/undefined
 * @param defaultValue - Valor padrão se a data for inválida (default: '-')
 * @returns String formatada como dd/mm/aaaa ou valor padrão
 */
export const formatDateBR = (dateValue: string | Date | null | undefined, defaultValue: string = '-'): string => {
  if (!dateValue) return defaultValue;
  
  try {
    let date: Date;
    
    if (typeof dateValue === 'string') {
      // Se for uma string no formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
      // Tratar como data local para evitar problemas de timezone
      if (dateValue.includes('T') || dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Para strings ISO, criar a data assumindo que é no timezone local
        const isoDate = dateValue.split('T')[0]; // Pegar só a parte da data (YYYY-MM-DD)
        const [year, month, day] = isoDate.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Para outros formatos de string
        date = new Date(dateValue);
      }
    } else {
      date = dateValue;
    }
    
    // Verificar se é uma data válida
    if (isNaN(date.getTime())) return defaultValue;
    
    // Usar toLocaleDateString com timezone brasileiro para garantir consistência
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    // console.warn('Erro ao formatar data:', error);
    return defaultValue;
  }
};

/**
 * Formata uma data para o padrão brasileiro com horário (dd/mm/aaaa HH:mm)
 * 
 * @param dateValue - Data como string ISO, Date object, ou null/undefined
 * @param defaultValue - Valor padrão se a data for inválida (default: '-')
 * @returns String formatada como dd/mm/aaaa HH:mm ou valor padrão
 */
export const formatDateTimeBR = (dateValue: string | Date | null | undefined, defaultValue: string = '-'): string => {
  if (!dateValue) return defaultValue;
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    if (isNaN(date.getTime())) return defaultValue;
    
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    // console.warn('Erro ao formatar data/hora:', error);
    return defaultValue;
  }
};

/**
 * Formata uma data para o padrão de input date (yyyy-mm-dd)
 * Útil para campos de formulário
 * 
 * @param dateValue - Data como string ISO, Date object, ou null/undefined
 * @param defaultValue - Valor padrão se a data for inválida (default: '')
 * @returns String formatada como yyyy-mm-dd ou valor padrão
 */
export const formatDateForInput = (dateValue: string | Date | null | undefined, defaultValue: string = ''): string => {
  if (!dateValue) return defaultValue;
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    if (isNaN(date.getTime())) return defaultValue;
    
    // Para input date, usar formato ISO sem timezone
    return date.toISOString().split('T')[0];
  } catch (error) {
    // console.warn('Erro ao formatar data para input:', error);
    return defaultValue;
  }
};

/**
 * Verifica se uma data é válida
 * 
 * @param dateValue - Data para validar
 * @returns true se a data for válida, false caso contrário
 */
export const isValidDate = (dateValue: string | Date | null | undefined): boolean => {
  if (!dateValue) return false;
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * Formata uma data do servidor para o padrão brasileiro (dd/mm/aaaa)
 * Especificamente projetada para lidar com datas vindas do backend
 * 
 * @param dateValue - Data como string ISO do servidor
 * @param defaultValue - Valor padrão se a data for inválida (default: '-')
 * @returns String formatada como dd/mm/aaaa ou valor padrão
 */
export const formatServerDateBR = (dateValue: string | null | undefined, defaultValue: string = '-'): string => {
  if (!dateValue) return defaultValue;
  
  try {
    // Para datas do servidor, sempre assumir que é no formato YYYY-MM-DD ou ISO
    let dateStr = dateValue;
    
    // Se contém horário, pegar só a parte da data
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    
    // Verificar se está no formato correto YYYY-MM-DD
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return defaultValue;
    }
    
    const [year, month, day] = dateStr.split('-');
    
    // Criar data local (sem conversão de timezone)
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Verificar se é válida
    if (isNaN(date.getTime())) return defaultValue;
    
    // Formatar diretamente como string para garantir consistência
    const dayNum = date.getDate().toString().padStart(2, '0');
    const monthNum = (date.getMonth() + 1).toString().padStart(2, '0');
    const yearNum = date.getFullYear().toString();
    
    return `${dayNum}/${monthNum}/${yearNum}`;
  } catch (error) {
    // console.warn('Erro ao formatar data do servidor:', error);
    return defaultValue;
  }
};

/**
 * Calcula a diferença em dias entre duas datas
 * 
 * @param date1 - Primeira data
 * @param date2 - Segunda data
 * @returns Diferença em dias (positivo se date1 > date2)
 */
export const daysDifference = (date1: string | Date, date2: string | Date): number => {
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    const diffTime = d1.getTime() - d2.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};
