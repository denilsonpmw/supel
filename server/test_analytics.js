const fetch = require('node-fetch');

async function testAnalytics() {
  const baseUrl = 'http://localhost:3001/api/analytics';
  
  // Eventos de teste
  const events = [
    {
      sessionId: 'test-session-1',
      eventType: 'page_view',
      eventCategory: 'navigation',
      eventAction: 'visit',
      pageUrl: '/dashboard'
    },
    {
      sessionId: 'test-session-1',
      eventType: 'click',
      eventCategory: 'interaction',
      eventAction: 'button_click',
      eventLabel: 'processo_novo',
      pageUrl: '/processos'
    },
    {
      sessionId: 'test-session-2',
      eventType: 'page_view',
      eventCategory: 'navigation',
      eventAction: 'visit',
      pageUrl: '/relatorios'
    },
    {
      userId: 1,
      sessionId: 'test-session-3',
      eventType: 'login',
      eventCategory: 'authentication',
      eventAction: 'user_login',
      pageUrl: '/login'
    }
  ];

  console.log('🚀 Enviando eventos de teste...\n');

  for (const event of events) {
    try {
      const response = await fetch(`${baseUrl}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      
      const result = await response.json();
      console.log(`✅ Evento ${event.eventType}: ID ${result.id}`);
    } catch (error) {
      console.error(`❌ Erro no evento ${event.eventType}:`, error.message);
    }
  }

  // Aguardar e buscar métricas
  console.log('\n📊 Buscando métricas...');
  try {
    const dashResponse = await fetch(`${baseUrl}/dashboard`);
    const metrics = await dashResponse.json();
    
    console.log('\n📈 Métricas do Dashboard:');
    console.log(`- Total de usuários: ${metrics.totalUsers}`);
    console.log(`- Sessões ativas: ${metrics.activeSessions}`);
    console.log(`- Eventos hoje: ${metrics.eventsToday}`);
    console.log(`- Páginas mais visitadas: ${metrics.topPages?.length || 0}`);
    
    if (metrics.topPages && metrics.topPages.length > 0) {
      console.log('\n🔝 Top páginas:');
      metrics.topPages.forEach(page => {
        console.log(`  - ${page.page_url}: ${page.visits} visitas`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error.message);
  }
}

// Verificar se fetch está disponível
if (typeof fetch === 'undefined') {
  console.log('Instalando node-fetch...');
  require('child_process').execSync('npm install node-fetch@2', { stdio: 'inherit' });
  console.log('Reiniciando teste...\n');
}

testAnalytics().catch(console.error);
