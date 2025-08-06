const { pool } = require('./src/database/connection');

async function checkAnalyticsData() {
  try {
    console.log('🔍 Verificando dados de analytics no banco...\n');
    
    // 1. Total de eventos
    const totalEvents = await pool.query('SELECT COUNT(*) as total FROM user_analytics');
    console.log(`📊 Total de eventos: ${totalEvents.rows[0].total}`);
    
    // 2. Eventos por data
    const eventsByDate = await pool.query(`
      SELECT DATE(timestamp) as date, COUNT(*) as count 
      FROM user_analytics 
      GROUP BY DATE(timestamp) 
      ORDER BY date DESC 
      LIMIT 7
    `);
    console.log('\n📅 Eventos por data:');
    eventsByDate.rows.forEach(row => {
      console.log(`  ${row.date}: ${row.count} eventos`);
    });
    
    // 3. Usuários únicos
    const uniqueUsers = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as total 
      FROM user_analytics 
      WHERE user_id IS NOT NULL
    `);
    console.log(`\n👥 Usuários únicos: ${uniqueUsers.rows[0].total}`);
    
    // 4. Eventos de hoje
    const todayEvents = await pool.query(`
      SELECT COUNT(*) as count 
      FROM user_analytics 
      WHERE DATE(timestamp) = CURRENT_DATE
    `);
    console.log(`🗓️ Eventos de hoje: ${todayEvents.rows[0].count}`);
    
    // 5. Últimos eventos
    const recentEvents = await pool.query(`
      SELECT id, user_id, event_type, event_category, page_url, timestamp 
      FROM user_analytics 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);
    console.log('\n🔥 Últimos 10 eventos:');
    recentEvents.rows.forEach(row => {
      console.log(`  ID ${row.id}: ${row.event_type} | Usuário: ${row.user_id || 'anônimo'} | ${row.page_url} | ${new Date(row.timestamp).toLocaleString()}`);
    });
    
    // 6. Verificar sessões
    const sessions = await pool.query('SELECT COUNT(*) as total FROM user_sessions');
    console.log(`\n🔐 Total de sessões: ${sessions.rows[0].total}`);
    
    // 7. Páginas mais visitadas
    const topPages = await pool.query(`
      SELECT page_url, COUNT(*) as visits 
      FROM user_analytics 
      WHERE event_type = 'page_view' 
      GROUP BY page_url 
      ORDER BY visits DESC 
      LIMIT 5
    `);
    console.log('\n📄 Páginas mais visitadas:');
    topPages.rows.forEach(row => {
      console.log(`  ${row.page_url}: ${row.visits} visitas`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
  } finally {
    process.exit(0);
  }
}

checkAnalyticsData();
