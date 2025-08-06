const data = {
  userId: 1,
  sessionId: 'test-session-123',
  eventType: 'page_view',
  eventCategory: 'navigation',
  eventAction: 'visit',
  pageUrl: '/dashboard',
  metadata: { source: 'test' }
};

async function testTracking() {
  try {
    const response = await fetch('http://localhost:3001/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    console.log('✅ Tracking OK:', result);
    
    // Verificar se o evento foi salvo
    const dashResponse = await fetch('http://localhost:3001/api/analytics/dashboard');
    const metrics = await dashResponse.json();
    console.log('📊 Métricas após tracking:', metrics);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testTracking();
