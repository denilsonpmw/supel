const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testAuthenticatedTracking() {
  try {
    console.log('🔐 Testando tracking com usuário autenticado...');
    
    // Simular login para obter token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@supel.com',
      password: 'admin123'
    });
    
    console.log('✅ Login realizado com sucesso');
    console.log('Token recebido:', loginResponse.data.token ? 'SIM' : 'NÃO');
    console.log('User ID:', loginResponse.data.user?.id);
    
    if (!loginResponse.data.token) {
      console.log('❌ Não foi possível obter token');
      return;
    }
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    
    // Agora testar o tracking com o token
    console.log('\n📊 Enviando evento de analytics...');
    
    const trackingResponse = await axios.post('http://localhost:3001/api/analytics/track', {
      eventType: 'page_view',
      eventCategory: 'navigation',
      eventAction: 'view',
      eventLabel: 'test-authenticated-page',
      pageUrl: '/test-auth-page',
      pageTitle: 'Teste Página Autenticada',
      sessionId: 'test-session-' + Date.now(),
      userId: userId // Incluir userId explicitamente
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Tracking response:', trackingResponse.data);
    
    // Verificar no banco se o evento foi registrado
    console.log('\n🔍 Verificando dados no banco...');
    const { pool } = require('./src/database/connection');
    
    const result = await pool.query(`
      SELECT user_id, event_type, event_action, page_url, timestamp 
      FROM user_analytics 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 5
    `, [userId]);
    
    console.log('📋 Últimos eventos do usuário:');
    console.table(result.rows);
    
    process.exit(0);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Erro HTTP:', error.response.status);
      console.log('Dados:', error.response.data);
    } else {
      console.log('❌ Erro:', error.message);
    }
    process.exit(1);
  }
}

testAuthenticatedTracking();
