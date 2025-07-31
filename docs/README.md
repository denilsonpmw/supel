# 📚 Documentação do Sistema SUPEL

> **Centro de Documentação**  
> Sistema de Controle de Processos de Licitação e Contratação Pública

---

## 📋 Índice de Documentos

### 🗺️ **Planejamento e Roadmap**
- **[ROADMAP_DESENVOLVIMENTO.md](./ROADMAP_DESENVOLVIMENTO.md)** - Planejamento completo do projeto
- **[ARQUITETURA_SISTEMA.md](./ARQUITETURA_SISTEMA.md)** - Mapeamento completo e visão de arquitetura
  - Status atual das funcionalidades
  - Roadmap detalhado por fases
  - Próximas ações prioritárias
  - Métricas de progresso
  - Checklists detalhados

### � **Manual do Usuário**
- **[📖 MANUAL_USUARIO.md (Novo v2.0)](./manual/MANUAL_USUARIO.md)** - Manual completo e visual
  - 📋 10 seções detalhadas cobrindo todo o sistema  
  - 🖼️ 17 placeholders para screenshots profissionais
  - 📱 Instruções específicas para PWA
  - 🎯 Múltiplos públicos (usuários, admins, gestores)
  - 🆘 Solução de problemas e FAQ
- **[📸 CAPTURAS_NECESSARIAS.md](./manual/CAPTURAS_NECESSARIAS.md)** - Guia para screenshots
  - 📋 Lista completa das 17 capturas necessárias
  - 📐 Especificações técnicas e qualidade
  - 🎨 Dicas de padronização visual
- **[MANUAL_USUARIO.md (Legacy)](./MANUAL_USUARIO.md)** - Manual básico original

### �🛠️ **Diretrizes Técnicas**
- **[DIRETRIZES_TECNICAS.md](./DIRETRIZES_TECNICAS.md)** - Padrões de desenvolvimento
  - Arquitetura do sistema
  - Convenções de código
  - Padrões de banco de dados
  - Estruturas de API
  - Templates de componentes

---

## 🚦 Status Atual (Resumo)

### ✅ **Implementado (90%)**
- Sistema de autenticação
- CRUD de Modalidades, Unidades Gestoras, Responsáveis, Situações, Equipe de Apoio
- Processos: funcionalidade principal completa
- Dashboard com métricas reais
- Painel Público (layout 16:9, atualização automática, acesso público)
- Sistema de Permissões (baseado em roles, com interface de gerenciamento)
- Administração do Sistema (gerenciamento de usuários, permissões e configurações)
- Otimizações de Performance (cache, lazy loading)
- Banco de dados configurado

### 🔄 **Em Andamento**
- Sistema de relatórios (pré-definidos, filtros avançados, exportação Excel, pendente exportação PDF e agendamento)

### 🚀 **Próximo Passo**
- Deploy e configuração do ambiente de produção

---

## 🚀 Começando

### **Para Desenvolvedores**
1. Leia o [Roadmap de Desenvolvimento](./ROADMAP_DESENVOLVIMENTO.md) para status detalhado
2. Consulte as [Diretrizes Técnicas](./DIRETRIZES_TECNICAS.md)
3. Siga os padrões estabelecidos
4. Atualize a documentação conforme desenvolve

### **Links Rápidos**
- 🏠 **Frontend**: http://localhost:5173
- 🔗 **Backend**: http://localhost:3001
- 📊 **Health Check**: http://localhost:3001/api/health

---

## 📝 Como Usar Esta Documentação

### **Durante o Desenvolvimento**
- Consulte o **Roadmap** para entender prioridades
- Use as **Diretrizes Técnicas** para manter consistência
- Atualize os checklists conforme implementa funcionalidades

### **Antes de Cada Sprint**
- Revise as próximas ações no Roadmap
- Confirme as dependências entre funcionalidades
- Atualize estimativas se necessário

### **Após Implementar uma Funcionalidade**
- Marque como concluída no Roadmap
- Atualize as métricas de progresso
- Documente novos padrões se criados

---

## 🔄 Manutenção da Documentação

Esta documentação é **viva** e deve ser atualizada regularmente:

- **A cada funcionalidade implementada**: Atualizar roadmap
- **A cada sessão de desenvolvimento**: Revisar próximas ações
- **A cada novo padrão criado**: Atualizar diretrizes técnicas

---

**💡 Mantenha esta documentação sempre atualizada para não perder o foco do projeto!**

## Limpeza de Projeto
- Scripts temporários, arquivos de debug e logs removidos.
- Pronto para produção. 