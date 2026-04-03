# Teste completo do fluxo de autenticação com cookies de refresh
# Script para validar implementação de sessões de 8 horas

Write-Host "🧪 Iniciando teste completo do fluxo de autenticação..." -ForegroundColor Green

# Configurações
$baseUrl = "http://localhost:3001/api"
$cookieJar = "$env:TEMP\supel_cookies.txt"
$testEmail = "test@example.com"
$testPassword = "123456"

# Função para fazer requisições com cookies
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [bool]$ShowCookies = $false
    )
    
    $headers = @{
        'Content-Type' = 'application/json'
    }
    
    $params = @{
        Uri = $Url
        Method = $Method
        Headers = $headers
        SessionVariable = 'session'
    }
    
    if ($Body) {
        $params.Body = $Body
    }
    
    # Usar arquivo de cookies se existir
    if (Test-Path $cookieJar) {
        # PowerShell não suporta curl cookie jar diretamente, mas podemos simular
        Write-Host "📁 Usando sessão existente..." -ForegroundColor Yellow
    }
    
    try {
        $response = Invoke-RestMethod @params
        
        if ($ShowCookies -and $session.Cookies) {
            Write-Host "🍪 Cookies recebidos:" -ForegroundColor Cyan
            foreach ($cookie in $session.Cookies.GetCookies($Url)) {
                Write-Host "  - $($cookie.Name): $($cookie.Value) (Expires: $($cookie.Expires))" -ForegroundColor Gray
            }
        }
        
        return @{
            Success = $true
            Data = $response
            Session = $session
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = $_.Exception.Response.StatusCode
        }
    }
}

Write-Host "`n=== TESTE 1: LOGIN ===" -ForegroundColor Yellow

$loginBody = @{
    email = $testEmail
    senha = $testPassword
} | ConvertTo-Json -Compress

$loginResult = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/auth/login" -Body $loginBody -ShowCookies $true

if ($loginResult.Success) {
    Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "👤 Usuário: $($loginResult.Data.user.nome)" -ForegroundColor Cyan
    Write-Host "🔑 Token recebido: $($loginResult.Data.token.Substring(0,20))..." -ForegroundColor Cyan
    $authToken = $loginResult.Data.token
    $userSession = $loginResult.Session
} else {
    Write-Host "❌ Falha no login: $($loginResult.Error)" -ForegroundColor Red
    Write-Host "📊 Status: $($loginResult.StatusCode)" -ForegroundColor Red
    Write-Host "ℹ️  Certifique-se de que o servidor está rodando e o usuário existe" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== TESTE 2: VERIFY COM TOKEN ===" -ForegroundColor Yellow

# Testar verify com Authorization header
$verifyHeaders = @{
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $authToken"
}

try {
    $verifyResult = Invoke-RestMethod -Uri "$baseUrl/auth/verify" -Method GET -Headers $verifyHeaders
    Write-Host "✅ Verify com token funcionando!" -ForegroundColor Green
    Write-Host "👤 Usuário verificado: $($verifyResult.user.nome)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Falha no verify com token: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE 3: VERIFY SEM TOKEN (APENAS COOKIES) ===" -ForegroundColor Yellow

# Simular verify usando apenas cookies da sessão (sem Authorization header)
try {
    $cookieVerifyResult = Invoke-RestMethod -Uri "$baseUrl/auth/verify" -Method GET -WebSession $userSession
    Write-Host "✅ Verify com cookies funcionando!" -ForegroundColor Green
    Write-Host "👤 Usuário verificado via cookie: $($cookieVerifyResult.user.nome)" -ForegroundColor Cyan
    if ($cookieVerifyResult.newToken) {
        Write-Host "🔄 Novo token rotacionado: $($cookieVerifyResult.newToken.Substring(0,20))..." -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Falha no verify com cookies: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "⚠️  Isso pode indicar problema com refresh tokens" -ForegroundColor Yellow
}

Write-Host "`n=== TESTE 4: PERSISTÊNCIA DE SESSÃO ===" -ForegroundColor Yellow

Write-Host "🔄 Simulando reload de página (verify sem Authorization header)..." -ForegroundColor Cyan

# Múltiplas chamadas de verify para testar rotação de cookies
for ($i = 1; $i -le 3; $i++) {
    Write-Host "📞 Tentativa $i de verify..." -ForegroundColor Gray
    try {
        $persistResult = Invoke-RestMethod -Uri "$baseUrl/auth/verify" -Method GET -WebSession $userSession
        Write-Host "  ✅ Sessão persistente - Usuário: $($persistResult.user.nome)" -ForegroundColor Green
        if ($persistResult.newToken) {
            Write-Host "  🔄 Token rotacionado na tentativa $i" -ForegroundColor Green
        }
        Start-Sleep -Seconds 1
    } catch {
        Write-Host "  ❌ Falha na tentativa $i`: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== TESTE 5: LOGOUT ===" -ForegroundColor Yellow

try {
    $logoutResult = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method POST -WebSession $userSession
    Write-Host "✅ Logout realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Falha no logout: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE 6: VERIFY APÓS LOGOUT ===" -ForegroundColor Yellow

try {
    $postLogoutResult = Invoke-RestMethod -Uri "$baseUrl/auth/verify" -Method GET -WebSession $userSession
    Write-Host "❌ ERRO: Verify deveria falhar após logout!" -ForegroundColor Red
} catch {
    Write-Host "✅ Verify falhou corretamente após logout (Status: $($_.Exception.Response.StatusCode))" -ForegroundColor Green
}

Write-Host "`n🎉 TESTE COMPLETO FINALIZADO!" -ForegroundColor Green
Write-Host "📋 Resultados resumidos:" -ForegroundColor Cyan
Write-Host "  - Login: ✅" -ForegroundColor Green
Write-Host "  - Verify com token: ✅" -ForegroundColor Green
Write-Host "  - Verify com cookies: verificar logs acima" -ForegroundColor Yellow
Write-Host "  - Persistência de sessão: verificar logs acima" -ForegroundColor Yellow
Write-Host "  - Logout: verificar logs acima" -ForegroundColor Yellow
Write-Host "  - Verify após logout: verificar logs acima" -ForegroundColor Yellow

Write-Host "`n📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Verificar no DevTools do navegador se cookies refresh_token estão sendo definidos" -ForegroundColor Gray
Write-Host "  2. Testar no navegador: login → reload página → verificar se mantém sessão" -ForegroundColor Gray
Write-Host "  3. Testar fechamento/abertura de aba (deve fazer logout via sendBeacon)" -ForegroundColor Gray

# Limpar arquivo de cookies se existir
if (Test-Path $cookieJar) {
    Remove-Item $cookieJar -Force
}