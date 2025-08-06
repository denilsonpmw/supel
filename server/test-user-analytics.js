// Teste do sistema de analytics com usuário autenticado
const testWithUser = {
  userId: 1, // Simular usuário logado
  sessionId: `test-session-${Date.now()}`,
  eventType: 'login',
  eventCategory: 'authentication',
  eventAction: 'login_success',
  eventLabel: 'email_login',
  pageUrl: '/dashboard',
  metadata: {
    userProfile: 'admin',
    timestamp: new Date().toISOString()
  }
};

async function testAnalyticsWithUser() {
  try {
    console.log('🧪 Testando analytics com usuário autenticado...');
    
    const response = await fetch('http://localhost:3001/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testWithUser)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Login tracking OK:', result);
      
      // Verificar dashboard novamente
      console.log('\n📊 Verificando dashboard após login...');
      const dashResponse = await fetch('http://localhost:3001/api/analytics/dashboard');
      const metrics = await dashResponse.json();
      
      console.log('Dashboard metrics:');
      console.log(`- Total de usuários: ${metrics.totalUsers}`);
      console.log(`- Eventos hoje: ${metrics.eventsToday}`);
      console.log(`- Sessões ativas: ${metrics.activeSessions}`);
      
    } else {
      console.error('❌ Erro no tracking:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testAnalyticsWithUser();
