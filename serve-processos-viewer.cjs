#!/usr/bin/env node

/**
 * Servidor proxy HTTP simples para servir o visualizador de processos
 * com suporte CORS e autenticação Bearer
 * 
 * Uso: node serve-processos-viewer.cjs [porta] [apiUrl]
 * Padrão: node serve-processos-viewer.cjs 8080 http://localhost:3001
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configurações
const PORT = process.argv[2] || 8080;
const API_BASE_URL = process.argv[3] || 'http://localhost:3001';

// Diretório raiz (onde estão os arquivos HTML)
const ROOT_DIR = __dirname;

console.log('🌐 Iniciando servidor proxy...');
console.log(`📁 Diretório raiz: ${ROOT_DIR}`);
console.log(`🔗 API Proxy: ${API_BASE_URL}`);

/**
 * Faz requisição para o servidor API
 */
function proxyRequest(reqUrl, method, headers, body) {
  return new Promise((resolve, reject) => {
    // Parse da URL da API
    const isHttps = reqUrl.startsWith('https://');
    const protocol = isHttps ? https : http;
    
    const parsedUrl = url.parse(reqUrl);
    
    // Copiar headers mas remover problemas de encoding
    const cleanHeaders = { ...headers };
    delete cleanHeaders['connection'];
    delete cleanHeaders['transfer-encoding'];
    delete cleanHeaders['accept-encoding']; // Remover para evitar ERR_CONTENT_DECODING_FAILED
    delete cleanHeaders['content-length'];
    delete cleanHeaders['host'];
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: method,
      headers: cleanHeaders
    };

    const req = protocol.request(options, (res) => {
      let data = '';

      res.setEncoding('utf8'); // Forçar UTF-8

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Remover headers problemáticos da resposta
        const responseHeaders = { ...res.headers };
        delete responseHeaders['content-encoding'];
        delete responseHeaders['transfer-encoding'];
        
        resolve({
          statusCode: res.statusCode,
          headers: responseHeaders,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

/**
 * Lê arquivo estático
 */
function readStaticFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Obtém tipo MIME do arquivo
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Servidor HTTP principal
 */
const server = http.createServer(async (req, res) => {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.search || '';

  try {
    // Proxy para API
    if (pathname.startsWith('/api/')) {
      console.log(`🔄 [${req.method}] ${pathname}${query}`);
      console.log(`   Headers recebidos:`, JSON.stringify(req.headers, null, 2));

      let body = '';
      
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        await new Promise((resolve) => {
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', resolve);
        });
      }

      // Construir URL da API
      const apiUrl = `${API_BASE_URL}${pathname}${query}`;
      console.log(`   Proxying para: ${apiUrl}`);
      
      // Fazer proxy da requisição
      const apiResponse = await proxyRequest(apiUrl, req.method, req.headers, body);

      console.log(`   ✅ API respondeu com status: ${apiResponse.statusCode}`);
      console.log(`   Response headers:`, JSON.stringify(apiResponse.headers, null, 2));

      // Retornar resposta da API
      res.writeHead(apiResponse.statusCode, apiResponse.headers);
      res.end(apiResponse.body);

    } else {
      // Servir arquivos estáticos
      let filePath = pathname === '/' 
        ? path.join(ROOT_DIR, 'processos-rp-conclusao-viewer.html')
        : path.join(ROOT_DIR, pathname);

      // Segurança: prevenir path traversal
      if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      try {
        const data = await readStaticFile(filePath);
        const mimeType = getMimeType(filePath);
        
        res.writeHead(200, {
          'Content-Type': mimeType,
          'Cache-Control': 'no-cache'
        });
        res.end(data);
        
        console.log(`📄 [GET] ${pathname} (${mimeType})`);

      } catch (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404);
          res.end('404 - Arquivo não encontrado');
          console.log(`❌ [404] ${pathname}`);
        } else {
          throw err;
        }
      }
    }

  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Erro interno do servidor',
      message: error.message 
    }));
  }
});

/**
 * Iniciar o servidor
 */
server.listen(PORT, () => {
  console.log('');
  console.log('✅ Servidor iniciado com sucesso!');
  console.log('');
  console.log(`📍 Acesse em: http://localhost:${PORT}`);
  console.log(`📍 Visualizador: http://localhost:${PORT}/processos-rp-conclusao-viewer.html`);
  console.log('');
  console.log('Ctrl+C para parar o servidor');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Erro: Porta ${PORT} já está em uso!`);
    console.error('Tente uma porta diferente: node serve-processos-viewer.cjs 8081');
  } else {
    console.error(`❌ Erro no servidor: ${err.message}`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});
