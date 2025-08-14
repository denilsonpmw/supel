# Visualização de Detalhes dos Outliers

## Resumo da Implementação

Esta documentação descreve a implementação da funcionalidade de visualização dos detalhes dos processos outliers que são ocultados pelo filtro estatístico no dashboard.

## Contexto

Com o sistema de filtro estatístico implementado, os processos com valores muito acima da média são automaticamente ocultados dos gráficos e cards do dashboard. Para aumentar a transparência e permitir que os usuários vejam exatamente quais processos foram filtrados, foi implementada uma funcionalidade de visualização detalhada.

## Funcionalidades Implementadas

### 1. Backend - Endpoint para Detalhes dos Outliers

**Arquivo:** `server/src/controllers/dashboardController.ts`

#### Novo Endpoint: `GET /api/dashboard/outliers-detalhes`

```typescript
export const getOutliersDetalhes = async (req: AuthRequest, res: Response, next: NextFunction)
```

**Características:**
- Retorna lista completa dos processos identificados como outliers
- Inclui dados detalhados: NUP, Objeto, UG, Modalidade, Valor Estimado, Situação, etc.
- Aplica filtros de usuário (responsáveis não-administradores veem apenas seus processos)
- Retorna também estatísticas do filtro aplicado

**Resposta da API:**
```json
{
  "data": [
    {
      "id": 123,
      "nup": "23065000456202345",
      "objeto": "Aquisição de equipamentos especiais",
      "ug_sigla": "UG123",
      "modalidade_sigla": "PE",
      "numero_ano": "456/2023",
      "situacao": "Em Andamento",
      "cor_situacao": "#FFA726",
      "data_entrada": "2023-10-15",
      "responsavel_email": "user@example.com",
      "valor_estimado": 5000000,
      "valor_formatado": "R$ 5.000.000,00"
    }
  ],
  "estatisticas": {
    "totalProcessos": 134,
    "processosValidos": 133,
    "processosOutliers": 1,
    "limiteOutlier": 850000,
    "media": 125000,
    "desvioPadrao": 85000
  }
}
```

### 2. Utilitários Estatísticos Aprimorados

**Arquivo:** `server/src/utils/statisticsUtils.ts`

#### Interface ProcessoOutlier Expandida

```typescript
export interface ProcessoOutlier {
  id: number;
  nup: string;
  objeto: string;
  ug_sigla: string;
  valor_estimado: number;
  modalidade_sigla?: string;
  numero_ano?: string;
  situacao?: string;
  cor_situacao?: string;
  data_entrada?: string | Date | null;
  responsavel_email?: string;
}
```

#### Nova Função: `filtrarProcessosComDetalhesOutliers`

```typescript
export function filtrarProcessosComDetalhesOutliers(
  processos: ProcessoOutlier[], 
  multiplicadorDesvio: number = 2
): {
  processosValidos: ProcessoOutlier[],
  dadosEstatisticos: StatisticalData
}
```

**Características:**
- Filtra outliers e mantém informações detalhadas
- Retorna tanto os processos válidos quanto os outliers com detalhes
- Calcula todas as estatísticas necessárias

### 3. Frontend - Modal de Visualização

**Arquivo:** `client/src/components/OutliersDetalhesModal.tsx`

#### Novo Componente: `OutliersDetalhesModal`

**Funcionalidades:**
- Modal responsivo com tabela de dados dos outliers
- Exibição de informações estatísticas do filtro
- Formatação adequada de valores monetários
- Tooltips para textos longos
- Estados de carregamento e erro
- Indicadores visuais com cores das situações

**Interface do Modal:**
- **Cabeçalho:** Título explicativo com ícone
- **Seção de Estatísticas:** Card informativo com dados do filtro aplicado
- **Tabela de Outliers:** Lista completa com colunas organizadas
- **Estados Especiais:** Mensagem quando não há outliers

#### Integração no Dashboard

**Arquivo:** `client/src/pages/DashboardPage.tsx`

**Modificações:**
- Botão "Ver detalhes" adicionado no alerta de filtro estatístico
- Estado para controlar abertura/fechamento do modal
- Importação e instanciação do componente modal

### 4. Utilitários Frontend Aprimorados

**Arquivo:** `client/src/utils/statisticsUtils.ts`

#### Novas Interfaces e Funções

```typescript
export interface ProcessoOutlier { /* ... */ }
export interface EstatisticasOutliers { /* ... */ }
export interface DadosOutliers { /* ... */ }

export const buscarDetalhesOutliers = async (): Promise<DadosOutliers>
```

### 5. Roteamento

**Arquivo:** `server/src/routes/dashboard.ts`

```typescript
// Detalhes dos outliers ocultos (cache 5 minutos)
router.get('/outliers-detalhes', cacheMiddleware(300), getOutliersDetalhes);
```

## Fluxo de Funcionamento

1. **Detecção de Filtros:** O dashboard mostra um alerta quando há processos filtrados
2. **Botão "Ver detalhes":** Usuario clica no botão para abrir o modal
3. **Requisição API:** Modal faz chamada para `/api/dashboard/outliers-detalhes`
4. **Processamento Backend:** 
   - Busca todos os processos com dados completos
   - Aplica filtro estatístico com detalhes
   - Retorna outliers identificados + estatísticas
5. **Exibição Frontend:** Modal mostra tabela com dados organizados

## Benefícios Implementados

### Transparência
- Usuários podem ver exatamente quais processos foram ocultados
- Informações estatísticas completas sobre o filtro aplicado
- Explicação clara do motivo da ocultação

### Usabilidade
- Modal responsivo e bem organizado
- Formatação adequada de valores monetários
- Tooltips para textos longos
- Estados de carregamento e erro tratados

### Controle
- Possibilidade de identificar processos que podem precisar de revisão
- Dados completos para análise manual se necessário
- Manutenção da integridade dos filtros automáticos

## Casos de Uso

### Administrador
- Ver todos os outliers do sistema
- Identificar padrões nos processos filtrados
- Validar se os filtros estão funcionando corretamente

### Usuário Responsável
- Ver apenas outliers dos seus processos
- Identificar processos próprios que podem ter valores incorretos
- Entender por que certos processos não aparecem nos gráficos

## Configuração e Cache

- **Cache:** 5 minutos (mesmo padrão das métricas principais)
- **Autenticação:** Requer token JWT
- **Filtros:** Automáticos por responsável (não-administradores)
- **Performance:** Query otimizada com JOIN apenas quando necessário

## Validação e Testes

### Validação de Dados
- Verificação de outliers vazios (mostra mensagem de sucesso)
- Tratamento de erros de API
- Validação de tipos TypeScript

### Estados da Interface
- ✅ Loading durante requisição
- ✅ Exibição de dados quando há outliers
- ✅ Mensagem de sucesso quando não há outliers
- ✅ Tratamento de erros de rede/API

### Responsividade
- Modal ajustável para diferentes tamanhos de tela
- Tabela com scroll horizontal quando necessário
- Tooltips para evitar quebra de layout

## Considerações de Manutenção

1. **Sincronização:** O endpoint usa a mesma lógica de filtro dos outros endpoints
2. **Consistência:** Mesmos critérios estatísticos aplicados em todo o sistema
3. **Performance:** Cache reduz carga no servidor
4. **Extensibilidade:** Interface pode ser facilmente expandida para mais campos

## Conclusão

A funcionalidade de visualização de outliers complementa perfeitamente o sistema de filtros estatísticos, proporcionando transparência total sobre quais dados estão sendo ocultados e por quê. Os usuários agora têm controle completo e visibilidade sobre o funcionamento dos filtros automáticos.
