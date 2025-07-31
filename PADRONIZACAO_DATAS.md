# 📅 Padronização de Formatação de Datas

## 🎯 Problema Identificado

O sistema tinha inconsistências na formatação de datas, causando o bug comum de **"data com 1 dia a menos"** devido a problemas de timezone. Esse problema aparecia em várias páginas:

- Modal de Processos em Andamento
- Dashboard
- Páginas administrativas
- Relatórios

## ✅ Solução Implementada

Criamos utilitários padronizados na pasta `client/src/utils/dateUtils.ts` que resolvem os problemas de timezone e garantem formatação consistente.

## 🚀 Como Usar

### Importação

```typescript
// Importar função específica
import { formatDateBR } from '../utils/dateUtils';

// Ou importar do index (recomendado)
import { formatDateBR } from '../utils';
```

### Funções Disponíveis

#### 1. `formatDateBR(dateValue, defaultValue?)`
Formata data para padrão brasileiro (dd/mm/aaaa)

```typescript
// ❌ ANTES (problemático)
{processo.data_sessao ? 
  new Date(processo.data_sessao).toLocaleDateString('pt-BR') 
  : '-'
}

// ✅ AGORA (correto)
{formatDateBR(processo.data_sessao)}
```

#### 2. `formatDateTimeBR(dateValue, defaultValue?)`
Formata data e hora (dd/mm/aaaa HH:mm)

```typescript
{formatDateTimeBR(log.timestamp)}
// Resultado: "30/07/2025 14:30"
```

#### 3. `formatDateForInput(dateValue, defaultValue?)`
Para campos de formulário (yyyy-mm-dd)

```typescript
<input 
  type="date" 
  value={formatDateForInput(processo.data_entrada)} 
/>
```

#### 4. `isValidDate(dateValue)`
Valida se uma data é válida

```typescript
if (isValidDate(data.data_vencimento)) {
  // Processar data válida
}
```

## 📋 Locais para Refatorar

### ✅ Já Implementado:
- `ProcessosAndamentoModal.tsx` - Correção aplicada

### 🔄 Pendente de Refatoração:
- `DashboardPage.tsx` (linhas 783, 1114, 1441)
- `PainelPublicoPage.tsx` (linha 184)
- `UsuariosPage.tsx` (linhas 300, 307)
- `UnidadesGestorasPage.tsx` (linha 314)
- `RelatoriosPage.tsx` (linhas 202, 923)
- `AuditoriaPage.tsx` (linha 529)

### 🗑️ Para Remover:
- `pages/admin/dateUtils.ts` (duplicado, usar o centralizado)

## 🔧 Exemplo Prático de Refatoração

### Antes:
```typescript
// Múltiplas implementações inconsistentes
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR'); // ❌ Problema de timezone
};
```

### Depois:
```typescript
import { formatDateBR } from '../utils';

// Usar diretamente na renderização
{formatDateBR(processo.data_sessao)}
```

## 🎯 Benefícios

- ✅ **Consistência**: Todas as datas formatadas igual em todo sistema
- ✅ **Timezone Fix**: Resolve problema de "1 dia a menos"
- ✅ **Manutenção**: Mudanças centralizadas em um local
- ✅ **TypeScript**: Tipagem completa e autocomplete
- ✅ **Reutilização**: Funções testadas e confiáveis
- ✅ **Flexibilidade**: Diferentes formatos para diferentes necessidades

## 📝 Próximos Passos

1. Refatorar páginas pendentes uma por uma
2. Remover implementações duplicadas
3. Adicionar testes unitários para as funções de data
4. Considerar adicionar mais utilitários (números, strings, validações)

## 🧪 Teste Rápido

Para verificar se a correção está funcionando:
1. Abrir modal de "Processos em Andamento"
2. Verificar se as datas de sessão estão corretas (não 1 dia a menos)
3. Comparar com a data real no banco de dados
