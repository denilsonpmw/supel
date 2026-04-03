# 📖 Manual do Usuário - SUPEL
**Sistema Unificado de Processos Eletrônicos de Licitação**

---

## 📑 Índice
1. [Visão Geral](#-visão-geral)
2. [Instalação do PWA](#-instalação-do-pwa)
3. [Autenticação](#-autenticação)
4. [Dashboard Principal](#-dashboard-principal)
5. [Painel Público](#-painel-público)
6. [Gestão de Processos](#-gestão-de-processos)
7. [Administração do Sistema](#-administração-do-sistema)
8. [Relatórios](#-relatórios)
9. [Configurações](#-configurações)
10. [Solução de Problemas](#-solução-de-problemas)

---

## 🎯 Visão Geral

O SUPEL é um sistema web moderno para gestão de processos licitatórios, desenvolvido como **Progressive Web App (PWA)** que funciona tanto no navegador quanto como aplicativo instalado.

### ⭐ Principais Funcionalidades:
- 📊 **Dashboard** com métricas em tempo real
- 📱 **PWA** - Funciona online e offline
- 👥 **Multi-usuário** com diferentes níveis de acesso
- 📋 **Gestão completa** de processos licitatórios
- 📈 **Relatórios** detalhados e exportáveis
- 🔒 **Segurança** com autenticação robusta
- 🎨 **Interface moderna** e responsiva

### 🏛️ **Público-Alvo:**
- **👥 Gestores públicos** - Controle de processos
- **📊 Administradores** - Gestão do sistema
- **👁️ Cidadãos** - Consulta pública transparente
- **📋 Auditores** - Acompanhamento e fiscalização

---

## 📱 Instalação do PWA

### 🌐 No Navegador (Chrome/Edge):
1. Acesse o sistema no navegador
2. Procure o ícone de **"Instalar"** na barra de endereços
3. Clique em **"Instalar SUPEL"**
4. Confirme a instalação

```
💡 Dica: O aplicativo aparecerá na área de trabalho e menu iniciar
```

![PWA Install Button](../../client/public/screenshots/pwa-install-button.png)
*Botão de instalação do PWA no navegador*

### 📱 No Android:
1. Abra o sistema no Chrome
2. Toque no menu (⋮) > **"Adicionar à tela inicial"**
3. Confirme **"Instalar"**

### 🍎 No iOS:
1. Abra no Safari
2. Toque em **Compartilhar** (□↑)
3. Selecione **"Adicionar à Tela de Início"**

### 🔧 **Requisitos Técnicos:**
- **🌐 Navegador moderno** (Chrome 80+, Edge 80+, Safari 13+)
- **📶 Conexão internet** para primeira instalação
- **💾 Espaço livre** mínimo: 50MB
- **🔒 HTTPS** obrigatório

---

## 🔐 Autenticação

### 🚪 Tela de Login

![Login Screen](../../client/public/screenshots/login-screen.png)
*Tela de login do sistema*

#### Campos Obrigatórios:
- **👤 Email**: Seu email de acesso institucional
- **🔒 Senha**: Senha cadastrada pelo administrador

#### Funcionalidades:
- ✅ **Lembrar login** - Mantém sessão ativa (7 dias)
- 🔄 **Recuperar senha** - Via email institucional
- 👁️ **Mostrar/ocultar senha** - Toggle de visualização
- 🔐 **Autenticação segura** - JWT com expiração

### 🔄 Recuperação de Senha:
1. Clique em **"Esqueci minha senha"**
2. Digite seu **email institucional**
3. Verifique sua **caixa de entrada**
4. Siga as instruções do email (link expira em 1 hora)
5. Defina **nova senha** (mínimo 8 caracteres)

### 🚪 Logout Automático:
- **30 minutos** de inatividade (páginas administrativas)
- **Fechamento** do navegador/aplicativo
- **Troca de abas** por mais de 30 minutos
- **❌ NÃO se aplica** ao painel público

### 🛡️ **Segurança:**
- **🔒 Criptografia** de senhas (bcrypt)
- **🔐 Tokens JWT** com expiração
- **📝 Log de acessos** para auditoria
- **🚫 Bloqueio** após 5 tentativas incorretas

---

## 📊 Dashboard Principal

### 🏠 Visão Geral

![Dashboard Overview](../../client/public/screenshots/dashboard-overview.png)
*Dashboard principal com métricas e gráficos*

O dashboard é a tela inicial após o login, apresentando uma visão consolidada dos processos licitatórios.

#### 📈 Métricas Principais:
- **📊 Total de Processos** - Quantidade geral cadastrada
- **🔄 Processos em Andamento** - Em tramitação ativa
- **✅ Processos Concluídos** - Finalizados com sucesso
- **💰 Valor Total Estimado** - Soma de todos os valores

#### 📊 Gráficos e Visualizações:
1. **📊 Processos por Status** (Gráfico de Pizza)
   - Distribuição visual por situação
   - Cores personalizáveis por status
   - Clique para filtrar tabela

2. **📈 Evolução Temporal** (Gráfico de Linha)
   - Histórico de abertura de processos
   - Tendências mensais e anuais
   - Zoom interativo por período

3. **🏢 Processos por Unidade Gestora** (Gráfico de Barras)
   - Comparativo entre órgãos
   - Ranking de atividade
   - Drill-down para detalhes

4. **💰 Distribuição de Valores** (Gráfico de Área)
   - Evolução dos valores estimados
   - Identificação de picos de investimento
   - Análise de tendências financeiras

### 🔍 Filtros e Buscas

![Dashboard Filters](../../client/public/screenshots/dashboard-filters.png)
*Área de filtros do dashboard*

#### 🗓️ Filtros Disponíveis:
- **📅 Período**: Data inicial e final (calendário)
- **🏢 Unidade Gestora**: Multi-seleção de órgãos
- **📋 Status**: Filtrar por situação do processo
- **💰 Faixa de Valores**: Slider para valores min/max
- **🏷️ Modalidade**: Tipo de licitação
- **👤 Responsável**: Filtro por pessoa

#### 🔍 Busca Avançada:
- **🔢 Por NUP**: Número único do processo (busca exata)
- **📝 Por Objeto**: Descrição do objeto (busca textual)
- **📄 Por Número**: Número do processo (wildcards aceitos)
- **🏢 Por Órgão**: Nome da unidade gestora

#### ⚡ **Filtros Rápidos:**
- **🆕 Hoje**: Processos criados hoje
- **📅 Esta Semana**: Últimos 7 dias
- **📊 Este Mês**: Mês atual
- **⭐ Favoritos**: Processos marcados

### 📋 Tabela de Processos

![Process Table](../../client/public/screenshots/process-table.png)
*Tabela principal de processos com dados reais*

#### 📄 Colunas Exibidas:
| Coluna | Descrição | Largura | Ordenável |
|--------|-----------|---------|-----------|
| **NUP** | Número Único do Processo | 120px | ✅ |
| **Objeto** | Descrição do objeto licitado | Flexível | ✅ |
| **U.G.** | Unidade Gestora (sigla) | 80px | ✅ |
| **Mod.** | Modalidade de licitação | 80px | ✅ |
| **Número** | Número sequencial | 100px | ✅ |
| **Sessão** | Data da sessão pública | 110px | ✅ |
| **Valor Estimado** | Valor em R$ formatado | 140px | ✅ |
| **Situação** | Status atual com cor | 140px | ✅ |

#### ⚡ Ações Rápidas:
- **👁️ Visualizar**: Ver detalhes completos (modal)
- **✏️ Editar**: Modificar informações (tela dedicada)
- **🗑️ Excluir**: Remover processo (confirmação)
- **📄 Exportar**: Gerar relatório individual
- **⭐ Favoritar**: Marcar como importante
- **📋 Duplicar**: Criar cópia do processo

#### 📱 **Responsividade:**
- **🖥️ Desktop**: Todas as colunas visíveis
- **📱 Tablet**: Colunas principais + scroll horizontal
- **📱 Mobile**: Layout em cards com informações essenciais

---

## 🌐 Painel Público

### 📢 Acesso Público

![Public Panel](../../client/public/screenshots/public-panel.png)
*Painel público para consulta de processos*

O painel público garante **transparência** permitindo consulta **sem necessidade de login** para cidadãos e interessados.

#### 🔍 **Funcionalidades Disponíveis:**
- 🔍 **Busca por NUP** - Consulta direta de processos
- 📊 **Estatísticas gerais** - Dados consolidados públicos
- 📅 **Processos recentes** - Últimas publicações
- 💰 **Valores totais** - Montantes investidos
- 📈 **Gráficos públicos** - Visualizações simplificadas

#### 🔍 Como Consultar:
1. Acesse **"/painel-publico"** (sem login)
2. Digite o **NUP** no campo de busca
3. Visualize as **informações públicas**
4. Acesse **histórico** de alterações públicas

### 📊 Informações Disponíveis:
- ✅ **Dados básicos** do processo (objeto, modalidade)
- ✅ **Status atual** e situação
- ✅ **Datas importantes** (abertura, sessão)
- ✅ **Valor estimado** (se público)
- ✅ **Unidade gestora** responsável
- ❌ **Informações sensíveis** (documentos internos, observações)

### 🔒 **Privacidade e Transparência:**
- **✅ Lei de Acesso** à Informação respeitada
- **✅ Dados públicos** disponíveis 24/7
- **❌ Informações sigilosas** protegidas
- **📝 Log de consultas** para auditoria

---

## 📋 Gestão de Processos

### ➕ Cadastro de Processos

![Process Creation](../../client/public/screenshots/process-creation.png)
*Formulário de cadastro de novo processo*

#### 📝 Formulário Completo:

**1. 📋 Informações Básicas:**
- **NUP**: Número único (obrigatório, formato: XXXXX.XXXXXX/XXXX-XX)
- **Objeto**: Descrição detalhada do que será licitado
- **Modalidade**: Concorrência, Tomada de Preços, Convite, etc.
- **Número**: Número sequencial da modalidade

**2. 🏢 Dados Administrativos:**
- **Unidade Gestora**: Órgão responsável (dropdown)
- **Responsável**: Pessoa designada (seleção de usuários)
- **Data de Abertura**: Data de início do processo
- **Pregoeiro**: Responsável pela condução (se aplicável)

**3. 💰 Informações Financeiras:**
- **Valor Estimado**: Valor total previsto (R$)
- **Fonte de Recursos**: Origem do financiamento
- **Dotação Orçamentária**: Classificação contábil
- **Ano Orçamentário**: Exercício financeiro

**4. 📅 Cronograma:**
- **Data da Sessão**: Data de realização da sessão pública
- **Prazo para Entrega**: Tempo para fornecimento
- **Data Limite**: Prazo máximo para conclusão
- **Marcos Importantes**: Datas críticas do processo

#### ✅ **Validações do Sistema:**
- **🔢 NUP único** - Não permite duplicatas
- **📅 Datas consistentes** - Validação cronológica
- **💰 Valores positivos** - Não aceita valores negativos
- **📝 Campos obrigatórios** - Indicados com *
- **📏 Limites de texto** - Contadores visuais

### 📊 Modal "Em Andamento"

![Process Modal](../../client/public/screenshots/process-modal.png)
*Modal detalhado de processos em andamento*

#### 🔍 Funcionalidades do Modal:
- **📋 Lista completa** de processos em andamento
- **🔍 Busca em tempo real** por NUP, objeto ou número
- **📊 Informações detalhadas** de cada processo
- **🎨 Cores por situação** (configuráveis pelo admin)
- **📱 Design responsivo** para mobile e tablet
- **📄 Paginação** para grandes volumes de dados

#### 🎨 Sistema de Cores (Configurável):
- 🟢 **Verde**: Processos aprovados/em ordem
- 🟡 **Amarelo**: Aguardando análise/documentação
- 🔴 **Vermelho**: Processos com pendências/problemas
- 🔵 **Azul**: Em tramitação normal
- 🟣 **Roxo**: Processos suspensos
- 🟠 **Laranja**: Necessita atenção

#### 📋 **Informações Exibidas:**
- **🔢 NUP completo** e formatado
- **📝 Objeto resumido** (primeiras palavras)
- **🏢 Unidade gestora** (sigla)
- **📅 Data da sessão** formatada
- **💰 Valor estimado** em formato brasileiro
- **📊 Status atual** com cor correspondente

### ✏️ Edição de Processos

![Process Editing](../../client/public/screenshots/process-editing.png)
*Interface de edição de processos*

#### 📝 Campos Editáveis:
- ✅ **Todos os campos** do cadastro inicial
- ✅ **Status/Situação** do processo (dropdown)
- ✅ **Observações** e comentários internos
- ✅ **Documentos** anexos (upload/download)
- ✅ **Histórico** de alterações (somente leitura)
- ✅ **Dados complementares** específicos

#### 💾 Sistema de Auditoria:
- **📝 Log completo** de todas as alterações
- **👤 Usuário responsável** pela modificação
- **🕐 Data/hora** exata da alteração
- **📋 Campos modificados** (antes/depois)
- **💬 Justificativa** da alteração (opcional)
- **🔒 Não repúdio** - logs imutáveis

#### 🔒 **Controle de Acesso:**
- **👑 Admin**: Pode editar tudo
- **⚙️ Gestor**: Edita processos da sua unidade
- **👤 Usuário**: Edita processos que criou
- **👁️ Consulta**: Apenas visualização

---

## ⚙️ Administração do Sistema

### 👥 Gestão de Usuários

![User Management](../../client/public/screenshots/user-management.png)
*Painel de administração de usuários*

#### 👤 Cadastro de Usuários:
- **📧 Email**: Identificação única (validação de formato)
- **👤 Nome completo**: Nome oficial do usuário
- **🔒 Perfil**: Nível de acesso no sistema
- **📱 Telefone**: Contato (formato brasileiro)
- **🏢 Unidade**: Órgão vinculado (dropdown)
- **📅 Data de cadastro**: Automática
- **✅ Status ativo**: Ativar/desativar usuário

#### 🛡️ Níveis de Acesso:
1. **👑 Super Admin**:
   - Acesso total ao sistema
   - Gestão de todos os usuários
   - Configurações globais
   - Backup e restore

2. **⚙️ Admin**:
   - Gestão completa de processos
   - Usuários da sua unidade
   - Relatórios avançados
   - Configurações locais

3. **👥 Usuário Padrão**:
   - Criar/editar processos próprios
   - Visualizar processos da unidade
   - Relatórios básicos
   - Painel público

4. **👁️ Consulta**:
   - Apenas visualização
   - Painel público
   - Relatórios de consulta
   - Dashboard básico

#### 🔐 **Gestão de Senhas:**
- **🔄 Reset** via email (admin)
- **🔒 Política** de senhas forte
- **⏰ Expiração** configurável
- **📝 Histórico** de senhas

### 🏢 Unidades Gestoras

![Unit Management](../../client/public/screenshots/unit-management.png)
*Gestão de unidades gestoras*

#### 🏛️ Informações das Unidades:
- **🏢 Nome oficial**: Denominação completa
- **📝 Sigla**: Abreviação (3-8 caracteres)
- **📧 Email institucional**: Contato oficial
- **📱 Telefone**: Telefone principal
- **📍 Endereço completo**: Localização física
- **👤 Gestor responsável**: Usuário vinculado
- **🏷️ Código oficial**: Identificação SIAFI/CNPJ
- **✅ Status ativo**: Ativar/desativar

#### 📊 **Estatísticas por Unidade:**
- **📈 Processos ativos** - Quantidade atual
- **💰 Valor total** - Soma dos processos
- **👥 Usuários vinculados** - Quantidade de pessoas
- **📅 Último processo** - Data da última criação

### 🎨 Situações e Cores

![Status Management](../../client/public/screenshots/status-management.png)
*Configuração de situações e suas cores*

#### 🎨 Personalização de Status:
- **📝 Nome da situação**: Descrição clara (ex: "Em Análise")
- **🎨 Cor de identificação**: Paleta visual (HEX/RGB)
- **📋 Descrição detalhada**: Explicação do status
- **⚡ Status ativo/inativo**: Disponibilidade para uso
- **🔢 Ordem de exibição**: Sequência nos dropdowns
- **🔒 Editável**: Permite/bloqueia edição por usuários

#### 🔄 **Sincronização em Tempo Real:**
- **⚡ Atualização automática** - Sem necessidade de refresh
- **🔄 Cache inteligente** - Performance otimizada
- **📱 PWA atualizado** - Service Worker sincroniza
- **👥 Multi-usuário** - Todos veem as mudanças

#### 🎨 **Paleta de Cores Sugeridas:**
- 🟢 **#4CAF50** - Sucesso/Aprovado
- 🟡 **#FFC107** - Atenção/Pendente
- 🔴 **#F44336** - Erro/Rejeitado
- 🔵 **#2196F3** - Informação/Processo
- 🟣 **#9C27B0** - Especial/Suspenso
- 🟠 **#FF9800** - Alerta/Urgente

---

## 📊 Relatórios

### 📈 Central de Relatórios

![Reports Overview](../../client/public/screenshots/reports-overview.png)
*Central de relatórios do sistema*

#### 📋 Relatórios Disponíveis:

**1. 📊 Relatório de Processos por Período**
- Filtro por data de criação ou sessão
- Agrupamento mensal/trimestral/anual
- Comparativo entre períodos
- Exportação em múltiplos formatos

**2. 🏢 Relatório por Unidade Gestora**
- Performance de cada órgão
- Ranking de atividade
- Comparativo de valores
- Drill-down por usuário

**3. 💰 Relatório Financeiro Consolidado**
- Valores estimados vs realizados
- Distribuição por modalidade
- Análise de economia gerada
- Projeções orçamentárias

**4. 📈 Relatório de Performance Temporal**
- Evolução histórica dos processos
- Identificação de sazonalidades
- Tendências de crescimento
- Análise de ciclos

**5. 🎯 Indicadores de Gestão (KPIs)**
- Tempo médio de processo
- Taxa de sucesso
- Eficiência por modalidade
- Indicadores de transparência

### 📊 Geração de Relatórios

![Report Generation](../../client/public/screenshots/report-generation.png)
*Interface de geração de relatórios*

#### ⚙️ Parâmetros Configuráveis:
- **📅 Período**: Data inicial e final (calendário)
- **🏢 Unidades**: Multi-seleção de órgãos
- **📋 Status**: Filtrar situações específicas
- **💰 Faixa de valores**: Slider min/max
- **🏷️ Modalidades**: Tipos de licitação
- **👤 Responsáveis**: Usuários específicos

#### 📤 Formatos de Exportação:
- **📄 PDF**: Relatório formatado e profissional
- **📊 Excel**: Planilha para análise avançada
- **📋 CSV**: Dados estruturados para importação
- **📧 Email**: Envio automático programado
- **🔗 Link público**: Compartilhamento temporário

#### ⏰ **Relatórios Programados:**
- **📅 Diário**: Enviado todo dia útil
- **📊 Semanal**: Consolidado semanal
- **📈 Mensal**: Fechamento mensal
- **🎯 Personalizado**: Cronograma específico

### 📈 Dashboard de Relatórios

![Report Dashboard](../../client/public/screenshots/report-dashboard.png)
*Dashboard com gráficos de relatórios*

#### 📊 Visualizações Interativas:
- **📈 Gráficos de linha** - Evolução temporal
- **📊 Gráficos de barra** - Comparações
- **🥧 Gráficos de pizza** - Distribuições
- **📊 Mapas de calor** - Densidade de dados
- **📈 Gráficos de área** - Tendências acumuladas

#### 🔍 **Funcionalidades Avançadas:**
- **🔍 Zoom** interativo nos gráficos
- **🎯 Filtros** dinâmicos por clique
- **📊 Drill-down** para detalhamento
- **📱 Responsivo** para todos os dispositivos
- **⚡ Tempo real** com auto-refresh

---

## 🔧 Configurações

### ⚙️ Configurações do Sistema

![System Settings](../../client/public/screenshots/system-settings.png)
*Painel de configurações gerais*

#### 🛠️ Configurações Disponíveis:

**🎨 Interface:**
- **🌓 Tema**: Claro/Escuro/Auto (segue sistema)
- **🎨 Paleta de cores**: Personalização visual
- **📱 Layout**: Compacto/Confortável/Espaçoso
- **🔤 Tamanho da fonte**: Pequena/Média/Grande

**🔔 Notificações:**
- **✅ Ativar/Desativar** notificações globais
- **📧 Email**: Alertas importantes via email
- **📱 Push**: Notificações do PWA
- **🔊 Sons**: Alertas sonoros

**⏰ Sessão e Segurança:**
- **⏰ Timeout**: Tempo de inatividade (admin only)
- **🔒 Política de senhas**: Requisitos de segurança
- **📝 Log de auditoria**: Nivel de detalhamento
- **🔐 Autenticação**: Configurações JWT

**📊 Dashboard:**
- **📈 Gráficos padrão**: Quais exibir por padrão
- **🔢 Quantidade de itens**: Linhas por página
- **🔄 Auto-refresh**: Intervalo de atualização
- **📱 Layout mobile**: Configurações específicas

### 📱 Configurações PWA

![PWA Settings](../../client/public/screenshots/pwa-settings.png)
*Configurações específicas do PWA*

#### 🚀 Funcionalidades PWA:

**📱 Instalação:**
- **✅ Prompt automático** - Sugere instalação
- **⏰ Delay do prompt** - Tempo antes de exibir
- **🔄 Reinstalação** - Permitir nova instalação
- **📊 Analytics** - Rastrear instalações

**🔄 Cache e Offline:**
- **💾 Estratégia de cache** - Cache first/Network first
- **📦 Tamanho do cache** - Limite de armazenamento
- **🧹 Limpeza automática** - Cache antigo
- **📱 Funcionalidade offline** - Recursos disponíveis

**🔔 Notificações Push:**
- **✅ Ativar push notifications**
- **🔑 Chaves VAPID** - Configuração técnica
- **📅 Agendamento** - Notificações programadas
- **🎯 Segmentação** - Por perfil de usuário

**⚡ Performance:**
- **🚀 Pre-loading** - Recursos antecipados
- **📊 Lazy loading** - Carregamento sob demanda
- **🗜️ Compressão** - Otimização de recursos
- **📱 Responsive images** - Imagens adaptáveis

#### 🔧 **Configurações Técnicas** (Admin):
- **🔄 Service Worker**: Versão atual e atualizações
- **📦 Manifest**: Configurações do app
- **🔒 HTTPS**: Status de certificado
- **📊 Métricas**: Performance e uso

---

## 🆘 Solução de Problemas

### ❓ Problemas Comuns e Soluções

#### 🔒 **Problema: Não consigo fazer login**
**Possíveis Causas e Soluções:**

1. **❌ Email ou senha incorretos**
   - ✅ Verifique **caps lock**
   - ✅ Confirme o **email** cadastrado
   - 🔄 Use **"Esqueci minha senha"**

2. **🔐 Conta bloqueada**
   - 📞 Entre em contato com **administrador**
   - ⏰ Aguarde **15 minutos** (bloqueio temporário)
   - 📧 Verifique **email** de notificação

3. **🌐 Problemas de conexão**
   - 🔄 **Recarregue** a página (F5)
   - 🧹 Limpe **cache** do navegador
   - 📶 Verifique **conexão** de internet

#### 📱 **Problema: PWA não instala**
**Soluções Passo a Passo:**

1. **🌐 Navegador compatível**
   - ✅ Use **Chrome 80+** ou **Edge 80+**
   - ❌ **Internet Explorer** não suportado
   - 🔄 **Atualize** o navegador

2. **🔒 HTTPS obrigatório**
   - ✅ Verifique **cadeado** na barra de endereços
   - 🔄 Acesse via **https://**
   - 📞 Contate TI se **certificado** inválido

3. **🧹 Limpeza de dados**
   - 🧹 Limpe **cache** (Ctrl+Shift+Del)
   - 🗑️ Remova **dados** do site
   - 🔄 **Reinicie** o navegador

#### 🐌 **Problema: Sistema lento**
**Otimizações Recomendadas:**

1. **📶 Conectividade**
   - 📡 Teste **velocidade** da internet
   - 🔄 **Reinicie** roteador/modem
   - 📱 Use **conexão cabeada** se possível

2. **💻 Performance local**
   - 🧹 Feche **abas** desnecessárias
   - 💾 Verifique **memória RAM** disponível
   - 🔄 **Reinicie** o computador

3. **🌐 Configurações do navegador**
   - 🔄 **Desative extensões** desnecessárias
   - 🧹 Limpe **histórico** e cache
   - ⚡ Ative **aceleração de hardware**

#### 🔄 **Problema: Dados não atualizam**
**Procedimentos de Correção:**

1. **🔄 Atualização forçada**
   - **Ctrl+F5** (Windows) ou **Cmd+Shift+R** (Mac)
   - 🔄 **Recarregue** sem cache
   - ⏰ Aguarde **carregamento completo**

2. **🚪 Renovação de sessão**
   - 🚪 Faça **logout** completo
   - 🧹 Limpe **cache** do navegador
   - 🔐 Faça **login** novamente

3. **📱 Reinstalação PWA**
   - 🗑️ **Desinstale** o app PWA
   - 🧹 Limpe **dados** do site
   - 📱 **Reinstale** via navegador

### 🛠️ Ferramentas de Diagnóstico

#### 🔍 **Página de Debug** (Administradores):
**URL:** `/debug/pwa`

**Informações Disponíveis:**
- **📊 Status do Service Worker** - Versão e estado
- **💾 Informações de cache** - Tamanho e conteúdo
- **🔄 Forçar atualizações** - Renovar recursos
- **📝 Logs detalhados** - Debug técnico
- **📱 Informações do dispositivo** - Compatibilidade
- **🌐 Status de conectividade** - Online/offline

#### 📱 **Console do Navegador** (F12):
**Como Acessar:**
1. Pressione **F12** ou clique com botão direito > **Inspecionar**
2. Vá para aba **Console**
3. Procure por mensagens relevantes

**Tipos de Mensagens:**
- **❌ Erros** (vermelho) - Problemas críticos
- **⚠️ Avisos** (amarelo) - Possíveis problemas
- **ℹ️ Informações** (azul) - Status normal
- **🔍 Debug** (cinza) - Informações técnicas

**Aba Network:**
- **📡 Requisições** - Comunicação com servidor
- **⏰ Tempos de resposta** - Performance
- **❌ Falhas** - Recursos não carregados

### 📞 Canais de Suporte

#### 📧 **Suporte por Email:**
- **📧 Geral**: suporte@supel.gov.br
- **🔧 Técnico**: ti@supel.gov.br
- **👥 Administrativo**: admin@supel.gov.br

#### 📱 **Suporte por Telefone:**
- **📞 Geral**: (XX) XXXX-XXXX
- **📱 WhatsApp**: (XX) XXXXX-XXXX
- **🆘 Emergência**: (XX) XXXX-XXXX

#### 🕐 **Horários de Atendimento:**
- **📅 Segunda a Sexta**: 8h às 18h
- **📅 Sábado**: 9h às 12h (emergências)
- **🆘 Emergências críticas**: 24h

#### 📝 **Informações para Suporte:**
Ao entrar em contato, tenha em mãos:
- **👤 Nome** e **email** do usuário
- **🌐 Navegador** e versão
- **📱 Dispositivo** (desktop/mobile)
- **📝 Descrição** detalhada do problema
- **📊 Passos** para reproduzir o erro
- **📷 Screenshots** se possível

---

## 📚 Recursos Adicionais

### 🎓 Materiais de Treinamento

#### 👨‍🏫 **Treinamentos Presenciais:**
- **📅 Workshops mensais** - Primeiro sábado do mês
- **🏢 Local**: Auditório da Prefeitura
- **⏰ Horário**: 9h às 12h
- **📝 Inscrições**: Via email ou sistema

#### 💻 **Recursos Online:**
- **🎥 Vídeos tutoriais** - Canal YouTube oficial
- **📖 Documentação técnica** - Wiki interno
- **❓ FAQ atualizado** - Perguntas frequentes
- **🎮 Ambiente de testes** - Prática sem riscos

#### 📋 **Materiais Disponíveis:**
- **📄 Manual em PDF** - Versão para impressão
- **🎯 Guia rápido** - Cards de referência
- **📊 Templates** - Modelos de processos
- **🎨 Kit de identidade** - Logos e padrões

### 🔄 Sistema de Atualizações

#### 🚀 **Atualizações Automáticas:**
- **📱 PWA**: Se atualiza automaticamente
- **🔔 Notificação**: Aviso de nova versão
- **🔄 Rollout gradual**: Implantação faseada
- **📋 Changelog**: Lista de novidades

#### 📋 **Tipos de Atualizações:**
- **🚀 Major** (v2.0.0): Grandes mudanças
- **⚡ Minor** (v1.2.0): Novas funcionalidades
- **🔧 Patch** (v1.1.1): Correções e melhorias

#### 📧 **Comunicação:**
- **📧 Newsletter mensal** - Novidades e dicas
- **📱 Notificações push** - Atualizações importantes
- **📋 Portal de notícias** - Blog oficial
- **👥 Comunidade**: Fórum de usuários

### 🛡️ Segurança e Privacidade

#### 🔒 **Medidas de Segurança:**
- **🔐 Criptografia TLS 1.3** - Dados em trânsito
- **🔒 Criptografia AES-256** - Dados em repouso
- **🔑 JWT tokens** - Autenticação segura
- **🛡️ Headers de segurança** - Proteção XSS/CSRF

#### 📝 **Política de Privacidade:**
- **📊 Dados coletados**: Apenas necessários
- **🎯 Finalidade**: Operação do sistema
- **📤 Compartilhamento**: Apenas interno
- **🗑️ Retenção**: Conforme legislação

#### 🔍 **Auditoria e Compliance:**
- **📝 Logs de acesso** - Rastreabilidade completa
- **🔍 Auditoria interna** - Revisões periódicas
- **📋 LGPD**: Conformidade total
- **🏛️ LAI**: Lei de Acesso à Informação

---

## 📱 Atalhos e Dicas de Produtividade

### ⌨️ **Atalhos de Teclado:**

#### 🔍 **Navegação:**
- **Ctrl + K**: Busca rápida global
- **Ctrl + D**: Ir para Dashboard
- **Ctrl + P**: Painel público
- **Ctrl + H**: Página inicial

#### 📋 **Processos:**
- **Ctrl + N**: Novo processo
- **Ctrl + E**: Editar processo atual
- **Ctrl + S**: Salvar alterações
- **Ctrl + Del**: Excluir (com confirmação)

#### 🔧 **Interface:**
- **Esc**: Fechar modal/popup
- **Tab**: Navegar entre campos
- **Enter**: Confirmar ação
- **F5**: Atualizar página

### 💡 **Dicas de Produtividade:**

#### ⭐ **Organização:**
- **📌 Favoritos**: Marque processos importantes com estrela
- **🏷️ Tags**: Use categorização para organizar
- **📁 Filtros salvos**: Crie filtros personalizados
- **📊 Dashboard customizado**: Configure métricas relevantes

#### 🔍 **Busca Eficiente:**
- **🔢 NUP parcial**: Digite apenas parte do número
- **📝 Palavras-chave**: Use termos do objeto
- **🏢 Filtro por órgão**: Combine com outros filtros
- **📅 Período específico**: Afine por datas

#### 📊 **Relatórios Inteligentes:**
- **📅 Agende relatórios**: Receba automaticamente
- **📧 Compartilhe links**: Envie para equipe
- **📊 Compare períodos**: Analise tendências
- **💾 Salve configurações**: Reutilize parâmetros

#### 📱 **PWA Máximo:**
- **📱 Instale no celular**: Acesso rápido
- **🔔 Ative notificações**: Não perca prazos
- **📶 Mode offline**: Consulte dados salvos
- **🔄 Sincronização**: Dados sempre atualizados

### 🎯 **Boas Práticas:**

#### 📝 **Cadastro de Processos:**
- **📋 Objetos descritivos**: Seja específico e claro
- **💰 Valores precisos**: Use orçamentos reais
- **📅 Datas realistas**: Considere prazos legais
- **📎 Documentos organizados**: Anexe tudo necessário

#### 👥 **Trabalho em Equipe:**
- **💬 Comentários claros**: Use observações
- **📝 Histórico detalhado**: Justifique alterações
- **🔔 Notifique equipe**: Comunique mudanças
- **🎯 Responsabilidades**: Defina papéis claros

#### 🔒 **Segurança:**
- **🔐 Senhas fortes**: Use gerenciador de senhas
- **🚪 Logout ao sair**: Sempre saia do sistema
- **👀 Verifique dados**: Confira antes de salvar
- **📱 Mantenha atualizado**: Use versão mais recente

---

## 📞 Informações de Contato

### 🏢 **Equipe de Desenvolvimento:**
- **👨‍💻 Desenvolvedor**: [Nome do Desenvolvedor]
- **📧 Email técnico**: dev@supel.gov.br
- **🐛 Bugs e sugestões**: issues@supel.gov.br

### 🏛️ **Órgão Responsável:**
- **🏢 Nome**: [Nome da Instituição]
- **📍 Endereço**: [Endereço completo]
- **📧 Email**: contato@supel.gov.br
- **📞 Telefone**: (XX) XXXX-XXXX

### 🔗 **Links Úteis:**
- **🌐 Portal oficial**: https://supel.gov.br
- **📚 Documentação**: https://docs.supel.gov.br
- **📰 Blog**: https://blog.supel.gov.br
- **👥 Comunidade**: https://forum.supel.gov.br

---

**📞 Em caso de dúvidas, nossa equipe está sempre disponível para ajudar!**

---

*📅 Última atualização: 31 de julho de 2025*  
*🚀 Versão do sistema: v1.3.0*  
*📖 Versão do manual: 2.0*
