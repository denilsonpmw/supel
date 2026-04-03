# Script para testar se o cookie está sendo enviado corretamente via proxy Vite
Write-Host "🧪 Testando comunicação frontend-backend com cookies..." -ForegroundColor Green

# Simular requisição como se viesse do Vite (porta 5173)
$headers = @{
    'Content-Type' = 'application/json'
    'Origin' = 'http://localhost:5173'
    'Referer' = 'http://localhost:5173/login'
}

Write-Host "`n=== TESTE 1: LOGIN VIA PROXY VITE ===" -ForegroundColor Yellow

# Fazer login simulando origem do frontend
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $loginBody = @{
        email = "denilson.pmw@gmail.com"
        senha = "cd1526"
    } | ConvertTo-Json

    $loginResult = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -Headers $headers -WebSession $session
    Write-Host "✅ Login via proxy funcionou!" -ForegroundColor Green
    Write-Host "👤 Usuário: $($loginResult.user.nome)" -ForegroundColor Cyan
    
    # Mostrar cookies recebidos
    $cookies = $session.Cookies.GetCookies("http://localhost:3001")
    if ($cookies.Count -gt 0) {
        Write-Host "🍪 Cookies recebidos:" -ForegroundColor Cyan
        foreach ($cookie in $cookies) {
            Write-Host "  - $($cookie.Name): $($cookie.Value.Substring(0,20))..." -ForegroundColor Gray
            Write-Host "    Domain: $($cookie.Domain), Path: $($cookie.Path)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Nenhum cookie foi recebido!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE 2: VERIFY COM COOKIES VIA PROXY ===" -ForegroundColor Yellow

try {
    $verifyResult = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/verify" -Method GET -Headers $headers -WebSession $session
    Write-Host "✅ Verify com cookies via proxy funcionou!" -ForegroundColor Green
    Write-Host "👤 Usuário: $($verifyResult.user.nome)" -ForegroundColor Cyan
    
    if ($verifyResult.newToken) {
        Write-Host "🔄 Token rotacionado: $($verifyResult.newToken.Substring(0,20))..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro no verify: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📊 Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`n📋 RESULTADO:" -ForegroundColor Cyan
Write-Host "Se ambos os testes passaram, o problema está na configuração do Vite proxy" -ForegroundColor Gray
Write-Host "Se falharam, há problema na configuração de CORS do servidor" -ForegroundColor Gray