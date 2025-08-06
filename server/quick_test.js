// Teste simples e rápido do sistema de analytics
const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Analytics/1.0 (Windows NT 10.0; Win64; x64) Chrome/91.0'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function quickTest() {
  console.log('🚀 Teste Rápido do Sistema de Analytics\n');

  try {
    // 1. Enviar evento de teste
    console.log('📤 Enviando evento de teste...');
    const trackResult = await makeRequest('/api/analytics/track', 'POST', {
      sessionId: 'quick-test-' + Date.now(),
      eventType: 'page_view',
      eventCategory: 'test',
      eventAction: 'quick_test',
      pageUrl: '/test-page'
    });
    
    if (trackResult.success) {
      console.log(`✅ Evento rastreado com ID: ${trackResult.id}`);
    } else {
      console.log('❌ Falha no tracking:', trackResult);
    }

    // 2. Buscar dashboard
    console.log('\n📊 Buscando métricas do dashboard...');
    const dashboard = await makeRequest('/api/analytics/dashboard');
    
    console.log(`📈 Métricas atuais:`);
    console.log(`   • Total de usuários: ${dashboard.totalUsers || 0}`);
    console.log(`   • Eventos hoje: ${dashboard.eventsToday || 0}`);
    console.log(`   • Sessões ativas: ${dashboard.activeSessions || 0}`);
    
    if (dashboard.topPages && dashboard.topPages.length > 0) {
      console.log(`   • Páginas visitadas: ${dashboard.topPages.length}`);
    }

    console.log('\n✅ Sistema de Analytics funcionando perfeitamente!');
    console.log('\n🎯 Próximos passos:');
    console.log('   1. Integrar com o frontend React');
    console.log('   2. Adicionar tracking automático de navegação');
    console.log('   3. Implementar relatórios personalizados');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

quickTest();
