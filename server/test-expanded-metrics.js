const AnalyticsService = require('./src/services/analyticsService');

(async () => {
  try {
    console.log('🧪 Testando métricas expandidas...');
    const metrics = await AnalyticsService.getDashboardMetrics();
    
    console.log('✅ Sucesso!');
    console.log('📊 Summary avgSessionTime:', metrics.summary.avgSessionTime);
    console.log('📈 TimeSeriesData length:', metrics.timeSeriesData.length);
    console.log('👥 UserBehavior length:', metrics.userBehavior.length);
    console.log('📄 TopPages com tempo:', metrics.topPages.slice(0, 2));
    
    process.exit(0);
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
    process.exit(1);
  }
})();
