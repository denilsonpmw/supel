const http = require('http');

async function testarAPIUsuarios() {
  try {
    console.log('🔐 Fazendo login...');
    
    // 1. Fazer login
    const loginData = JSON.stringify({
      email: 'admin@supel.gov.br',
      senha: 'password'
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    const token = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            if (response.token) {
              console.log('✅ Login realizado com sucesso');
              resolve(response.token);
            } else {
              reject(new Error('Token não retornado: ' + body));
            }
          } catch (e) {
            reject(new Error('Erro ao parsear resposta: ' + body));
          }
        });
      });

      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    console.log('🔍 Buscando usuários...');

    // 2. Buscar usuários
    const usersOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const users = await new Promise((resolve, reject) => {
      const req = http.request(usersOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log(`📊 Status da resposta: ${res.statusCode}`);
          console.log('📋 Resposta completa:', body);
          
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (e) {
            console.log('⚠️  Resposta não é JSON válido');
            resolve(body);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    if (Array.isArray(users)) {
      console.log(`✅ ${users.length} usuários encontrados:`);
      users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email} (${user.perfil}) - Ativo: ${user.ativo}`);
      });
    } else {
      console.log('⚠️  Resposta inesperada:', users);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testarAPIUsuarios(); 