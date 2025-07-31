# 📸 Capturas de Tela Necessárias para o Manual

Este arquivo lista todas as capturas de tela que precisam ser feitas para completar o manual do usuário.

## 📋 Lista de Capturas Necessárias

### 🔐 **Autenticação**
- [ ] `screenshots/login-screen.png` - Tela de login completa com campos e botões
- [ ] `screenshots/pwa-install-button.png` - Botão de instalação no navegador (Chrome/Edge)

### 📊 **Dashboard**
- [ ] `screenshots/dashboard-overview.png` - Dashboard principal com todos os gráficos e métricas
- [ ] `screenshots/dashboard-filters.png` - Área de filtros expandida mostrando opções
- [ ] `screenshots/process-table.png` - Tabela de processos com dados reais (sem informações sensíveis)

### 🌐 **Painel Público**
- [ ] `screenshots/public-panel.png` - Tela do painel público com busca e estatísticas

### 📋 **Gestão de Processos**
- [ ] `screenshots/process-creation.png` - Formulário de novo processo preenchido
- [ ] `screenshots/process-modal.png` - Modal de processos em andamento com lista
- [ ] `screenshots/process-editing.png` - Tela de edição de processo com campos preenchidos

### ⚙️ **Administração**
- [ ] `screenshots/user-management.png` - Tela de gestão de usuários com lista
- [ ] `screenshots/unit-management.png` - Tela de unidades gestoras
- [ ] `screenshots/status-management.png` - Tela de situações e cores configuráveis

### 📊 **Relatórios**
- [ ] `screenshots/reports-overview.png` - Central de relatórios com opções disponíveis
- [ ] `screenshots/report-generation.png` - Interface de geração com parâmetros
- [ ] `screenshots/report-dashboard.png` - Dashboard de relatórios com gráficos

### 🔧 **Configurações**
- [ ] `screenshots/system-settings.png` - Configurações gerais do sistema
- [ ] `screenshots/pwa-settings.png` - Configurações específicas do PWA

## 📐 **Especificações das Capturas**

### 🖥️ **Resolução Recomendada**: 1920x1080
### 📱 **Formato**: PNG (melhor qualidade para documentação)
### 🎯 **Foco**: Mostrar funcionalidades específicas mencionadas no manual

## 📸 **Como Fazer as Capturas**

### 🖥️ **No Desktop**:
1. **F12** para abrir DevTools (opcional para ajustar resolução)
2. **Ferramenta de Captura do Windows** ou **Snipping Tool**
3. **Ctrl + Shift + S** (Firefox) ou extensões de captura
4. Ou use **Print Screen** + editor de imagem

### 📱 **Mobile/Responsive** (se necessário):
1. **F12** > Toggle device toolbar
2. Selecione dispositivo móvel (iPhone/Android)
3. Capture a tela responsiva
4. Salve com sufixo `-mobile` se diferente

### 🎨 **Dicas de Qualidade**:
- ✅ **Dados realistas** (não usar "Lorem ipsum" ou dados de teste)
- ✅ **Interface limpa** (sem erros ou warnings no console)
- ✅ **Zoom adequado** (100% ou 125% máximo)
- ✅ **Foco claro** na funcionalidade específica
- ✅ **Sem informações sensíveis** (use dados fictícios realistas)
- ✅ **Boa iluminação** (tema claro para documentação)
- ✅ **Resolução nítida** (evitar compressão excessiva)

## 📁 **Estrutura de Pastas**

```
client/public/
├── screenshots/
│   ├── login-screen.png
│   ├── dashboard-overview.png
│   ├── process-modal.png
│   ├── user-management.png
│   ├── reports-overview.png
│   └── ... (todas as outras imagens)
└── docs/
    └── manual/
        ├── MANUAL_USUARIO.md
        └── CAPTURAS_NECESSARIAS.md
```

## 🎯 **Conteúdo Específico por Captura**

### 🔐 **login-screen.png**:
- Formulário de login completo
- Campos email e senha visíveis
- Botões "Entrar" e "Esqueci minha senha"
- Logo do sistema
- Layout responsivo

### 📊 **dashboard-overview.png**:
- Métricas principais (cards com números)
- Pelo menos 2-3 gráficos visíveis
- Tabela de processos na parte inferior
- Filtros na lateral ou topo
- Design completo da página

### 📋 **process-modal.png**:
- Modal aberto com lista de processos
- Diferentes cores de status visíveis
- Campo de busca
- Pelo menos 5-6 processos na lista
- Botão de fechar

### ⚙️ **user-management.png**:
- Lista de usuários com diferentes perfis
- Botões de ação (editar, excluir)
- Formulário de novo usuário (pode ser modal)
- Diferentes status de usuários

### 📊 **reports-overview.png**:
- Cards ou lista de tipos de relatórios
- Seção de relatórios salvos/recentes
- Botão "Gerar Novo Relatório"
- Exemplo de gráfico ou prévia

## 🔄 **Próximos Passos**

1. **📸 Fazer as capturas** listadas acima
2. **📁 Salvar** na pasta `client/public/screenshots/`
3. **🔗 Verificar links** no manual (caminhos relativos)
4. **📝 Revisar** o conteúdo do manual
5. **🚀 Versionar** as mudanças

## 📝 **Script de Verificação**

Quando todas as capturas estiverem prontas, execute:

```bash
# Verificar se todas as imagens existem
node scripts/check-screenshots.js
```

*Este script verificará se todas as imagens necessárias estão presentes e exibirá um relatório.*

## ⚠️ **Observações Importantes**

### 🔒 **Segurança e Privacidade**:
- **❌ NÃO** use dados reais de processos
- **❌ NÃO** inclua informações pessoais
- **❌ NÃO** mostre emails reais de usuários
- **✅ USE** dados fictícios mas realistas

### 📝 **Dados de Exemplo Sugeridos**:
- **NUPs**: 23480.123456/2025-77
- **Objetos**: "Aquisição de material de escritório"
- **Emails**: usuario@exemplo.gov.br
- **Nomes**: João Silva, Maria Santos
- **Valores**: R$ 50.000,00

### 🎨 **Padronização Visual**:
- **🎨 Tema**: Use tema claro para melhor legibilidade
- **📏 Tamanho**: Mantenha proporções consistentes
- **🖼️ Qualidade**: PNG com boa compressão
- **📱 Responsivo**: Uma captura desktop é suficiente

---

**📸 Após fazer todas as capturas, o manual estará visualmente completo e profissional!**

*📅 Criado em: 31 de julho de 2025*  
*📝 Versão: 1.0*
