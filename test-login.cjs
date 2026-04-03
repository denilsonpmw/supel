#!/usr/bin/env node

/**
 * Script para testar login na API
 * Uso: node test-login.cjs email senha baseUrl
 */

const http = require('http');
const https = require('https');
const url = require('url');

const email = process.argv[2] || 'admin@supel.gov.br';
const senha = process.argv[3] || 'Admin@123';
const baseUrl = process.argv[4] || 'http://localhost:3001';

console.log('🔐 Testando login na API');
console.log(`📧 Email: ${email}`);
console.log(`🔑 Senha: ${'*'.repeat(senha.length)}`);
console.log(`🌐 URL: ${baseUrl}`);
console.log('');

function fazerRequisicao(loginUrl, dados) {
  return new Promise((resolve, reject) => {
    const isHttps = loginUrl.startsWith('https://');
    const protocol = isHttps ? https : http;
    const parsedUrl = url.parse(loginUrl);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dados)
      }
    };

    const req = protocol.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(dados);
    req.end();
  });
}

async function testar() {
  try {
    const dados = JSON.stringify({ email, senha });
    const loginUrl = `${baseUrl}/api/auth/login`;

    console.log('📤 Enviando requisição...');
    const response = await fazerRequisicao(loginUrl, dados);

    console.log(`\n📊 Status: ${response.statusCode}`);
    console.log('📥 Resposta:');
    console.log(response.body);

    if (response.statusCode === 200) {
      try {
        const jsonData = JSON.parse(response.body);
        if (jsonData.token) {
          console.log('\n✅ Login bem-sucedido!');
          console.log(`🔑 Token: ${jsonData.token.substring(0, 50)}...`);
        }
      } catch (e) {
        // JSON parse error
      }
    } else if (response.statusCode === 404) {
      console.log('\n❌ Endpoint não encontrado (404)');
      console.log('   Verifique se a API está rodando em', baseUrl);
    } else if (response.statusCode === 401) {
      console.log('\n❌ Autenticação falhou (401)');
      console.log('   Verifique o email e a senha');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   A API não está respondendo em', baseUrl);
      console.error('   Certifique-se de que o servidor está rodando!');
    }
  }
}

testar();
