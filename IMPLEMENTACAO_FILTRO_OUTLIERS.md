# Implementação: Filtro de Outliers no Dashboard

## Resumo da Funcionalidade

Esta implementação adiciona um sistema automático de filtro estatístico para ocultar processos com valores estimados muito acima do desvio padrão nos **cards e gráficos do dashboard**. O objetivo é melhorar a visualização removendo valores extremos que podem distorcer a análise dos dados.

## Arquivos Criados/Modificados

### Backend

#### 1. `server/src/utils/statisticsUtils.ts` (NOVO)
- **Função `calcularDesvioPadrao()`**: Calcula o desvio padrão de um conjunto de valores
- **Função `filtrarProcessosSemOutliers()`**: Remove outliers baseado em média + 2 * desvio padrão
- **Função `logDadosEstatisticos()`**: Log detalhado das estatísticas para debugging
- **Interface `ProcessoValor`**: Define a estrutura mínima necessária para análise
- **Interface `StatisticalData`**: Dados estatísticos calculados

#### 2. `server/src/controllers/dashboardController.ts` (MODIFICADO)
- **Função `getDashboardMetrics()`**: Aplica filtro estatístico às métricas principais
- **Função `getModalidadeDistributionValores()`**: Filtro nos gráficos de modalidade por valor
- **Função `getProcessEvolution()`**: Filtro na evolução temporal de processos
- Retorna estatísticas do filtro junto com os dados para transparência

### Frontend

#### 3. `client/src/utils/statisticsUtils.ts` (NOVO)
- **Função `formatarEstatisticasFiltro()`**: Formata estatísticas para exibição
- **Função `dadosForamFiltrados()`**: Verifica se dados foram filtrados
- **Função `criarTooltipFiltro()`**: Cria tooltip informativo sobre filtros
- **Função `obterTextoAvisoFiltro()`**: Gera texto de aviso sobre filtros aplicados
- **Interface `EstatisticasFiltro`**: Estrutura das estatísticas do filtro

#### 4. `client/src/pages/DashboardPage.tsx` (MODIFICADO)
- Adiciona estados para armazenar estatísticas de filtro
- Modifica `loadDashboardData()` para capturar estatísticas dos endpoints
- Adiciona alertas informativos sobre filtros aplicados
- Exibe tooltips com detalhes estatísticos

## Critério Estatístico

### Fórmula Utilizada
```
Valor Máximo Permitido = Média + (2 × Desvio Padrão)
```

### Justificativa
- **Regra dos 2 sigmas**: Aproximadamente 95% dos valores em uma distribuição normal ficam dentro de 2 desvios padrão da média
- **Conservador**: Remove apenas valores verdadeiramente extremos
- **Flexível**: Pode ser ajustado alterando o multiplicador (padrão: 2)

## Componentes Afetados

### Cards do Dashboard
- ✅ **Processos Ativos**: Valores filtrados antes do cálculo
- ✅ **Processos em Andamento**: Valores filtrados
- ✅ **Processos Concluídos**: Valores filtrados
- ✅ **Economicidade**: Cálculo baseado em processos filtrados

### Gráficos
- ✅ **Distribuição por Modalidade (Valores)**: Apenas quando "Por Valor" está selecionado
- ✅ **Evolução Temporal**: Valores extremos removidos da timeline
- ❌ **Distribuição por Modalidade (Quantidade)**: NÃO afetado (conta processos, não valores)
- ❌ **Mapa de Calor**: NÃO afetado (não baseado em valores estimados)

## Transparência e Feedback

### Avisos Visuais
- **Alert Information**: Aparece no topo do dashboard quando filtros estão ativos
- **Tooltip com Detalhes**: Ícone (i) com estatísticas completas
- **Contadores**: Mostra quantos processos foram ocultos

### Logs do Servidor
```
📊 [ESTATÍSTICAS] Dashboard - Métricas Principais:
   📈 Média: R$ 150.000,00
   📏 Desvio Padrão: R$ 75.000,00
   🚫 Valor Máximo Permitido: R$ 300.000,00
   📋 Total de processos: 1000
   ✅ Processos válidos: 950
   🔴 Outliers detectados: 50
   📊 Percentual de outliers: 5.0%
```

## Configuração

### Ajustar Sensibilidade
Para modificar a sensibilidade do filtro, altere o multiplicador na chamada de `filtrarProcessosSemOutliers()`:

```typescript
// Mais restritivo (remove mais outliers)
const { processosValidos } = filtrarProcessosSemOutliers(processos, 1.5);

// Padrão (recomendado)
const { processosValidos } = filtrarProcessosSemOutliers(processos, 2);

// Mais permissivo (remove menos outliers)  
const { processosValidos } = filtrarProcessosSemOutliers(processos, 3);
```

## Benefícios

1. **Visualização Melhorada**: Gráficos e cards mais representativos sem distorções
2. **Transparência**: Usuário sabe quando e quantos dados foram filtrados
3. **Automático**: Não requer intervenção manual
4. **Flexível**: Funciona com qualquer conjunto de dados
5. **Conservador**: Remove apenas valores verdadeiramente extremos

## Limitações

1. **Apenas Valores Estimados**: Filtro aplicado apenas aos valores estimados (não valores realizados)
2. **Dashboard Específico**: Não afeta listagens completas de processos
3. **Estatísticas Dependem dos Dados**: Em conjuntos muito pequenos pode não ser efetivo

## Exemplo de Uso

### Cenário: 100 processos, com 5 tendo valores extremos
- 95 processos: R$ 50.000 - R$ 200.000 (média: R$ 125.000)
- 5 processos: R$ 1.000.000 - R$ 5.000.000 (outliers)

**Resultado**:
- Média sem filtro: R$ 423.000 (distorcida pelos outliers)
- Média com filtro: R$ 125.000 (representativa)
- Cards e gráficos mostram dados dos 95 processos "normais"
- Alerta informa que 5 processos foram ocultos

## Testagem

### Para testar a funcionalidade:
1. Insira alguns processos com valores muito altos (ex: R$ 50.000.000)
2. Acesse o dashboard
3. Observe que os valores extremos não aparecem nos cards/gráficos
4. Verifique o alerta informativo no topo da página
5. Clique no ícone (i) para ver detalhes estatísticos
