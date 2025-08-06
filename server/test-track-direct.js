const AnalyticsService = require('./src/services/analyticsService');

const eventData = {
  userId: 1,
  sessionId: 'test-session-123',
  eventType: 'page_view',
  eventCategory: 'navigation',
  eventAction: 'view',
  eventLabel: 'test-page',
  pageUrl: '/test-page',
  userAgent: 'Test Browser',
  ipAddress: '127.0.0.1',
  metadata: {}
};

console.log('🧪 Testando trackEvent diretamente...');

AnalyticsService.trackEvent(eventData)
  .then(result => {
    console.log('✅ Sucesso:', result);
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ Erro:', error.message);
    console.log('Stack:', error.stack);
    process.exit(1);
  });
