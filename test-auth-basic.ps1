# Teste básico dos endpoints de autenticação
Write-Host "🧪 Teste básico dos endpoints de autenticação..." -ForegroundColor Green

$baseUrl = "http://localhost:3001/api"

Write-Host "`n=== TESTE 1: HEALTH CHECK ===" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Server health: $($health.status)" -ForegroundColor Green
    Write-Host "🕐 Uptime: $($health.uptime) segundos" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Servidor não está respondendo" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== TESTE 2: VERIFY SEM TOKEN (DEVE DAR 401) ===" -ForegroundColor Yellow
try {
    $verifyResult = Invoke-RestMethod -Uri "$baseUrl/auth/verify" -Method GET
    Write-Host "❌ ERRO: Verify deveria retornar 401 sem token!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Verify sem token corretamente retornou 401" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Verify retornou código inesperado: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host "`n=== TESTE 3: LOGIN COM DADOS INVÁLIDOS (DEVE DAR 401) ===" -ForegroundColor Yellow
$invalidLogin = @{
    email = "invalid@test.com"
    senha = "wrongpassword"
} | ConvertTo-Json -Compress

try {
    $loginResult = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $invalidLogin -ContentType "application/json"
    Write-Host "❌ ERRO: Login inválido deveria retornar 401!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 404) {
        Write-Host "✅ Login inválido corretamente rejeitado (Status: $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Login inválido retornou código inesperado: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host "`n=== TESTE 4: LOGOUT SEM TOKEN (DEVE DAR 401) ===" -ForegroundColor Yellow
try {
    $logoutResult = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method POST
    Write-Host "❌ ERRO: Logout sem token deveria retornar 401!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Logout sem token corretamente retornou 401" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Logout retornou código inesperado: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host "`n🎯 TESTE NO NAVEGADOR NECESSÁRIO!" -ForegroundColor Cyan
Write-Host "📋 Para completar o teste, abra o navegador e:" -ForegroundColor Yellow
Write-Host "  1. Acesse http://localhost:3000/login" -ForegroundColor Gray
Write-Host "  2. Faça login com suas credenciais" -ForegroundColor Gray
Write-Host "  3. Abra DevTools (F12) → Application/Aplicativo → Cookies" -ForegroundColor Gray
Write-Host "  4. Verifique se existe cookie 'refresh_token' com:" -ForegroundColor Gray
Write-Host "     - HttpOnly: ✓" -ForegroundColor Green
Write-Host "     - SameSite: Lax" -ForegroundColor Green
Write-Host "     - Expires: ~8 horas no futuro" -ForegroundColor Green
Write-Host "  5. Recarregue a página (F5) e verifique se mantém o login" -ForegroundColor Gray
Write-Host "  6. Feche a aba e abra novamente para testar logout automático" -ForegroundColor Gray

Write-Host "`n✅ Testes básicos dos endpoints completados!" -ForegroundColor Green