# Teste de logout automático ao fechar navegador
Write-Host "🧪 Teste de logout automático..." -ForegroundColor Green

Write-Host "`n📋 INSTRUÇÕES DE TESTE:" -ForegroundColor Cyan
Write-Host "1. Faça login em http://localhost:5173/login" -ForegroundColor Gray
Write-Host "2. Abra DevTools (F12) → Console para ver logs" -ForegroundColor Gray
Write-Host "3. Teste os cenários abaixo:" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray

Write-Host "🔍 CENÁRIO 1: Fechar aba (Ctrl+W)" -ForegroundColor Yellow
Write-Host "   - Deve aparecer log: '🚪 SendBeacon logout enviado (unload)'" -ForegroundColor Gray
Write-Host "   - Deve limpar cookie refresh_token" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray

Write-Host "🔍 CENÁRIO 2: Fechar navegador inteiro (Alt+F4)" -ForegroundColor Yellow
Write-Host "   - Deve aparecer log de sendBeacon" -ForegroundColor Gray
Write-Host "   - Deve limpar cookie refresh_token" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray

Write-Host "🔍 CENÁRIO 3: Mudar de aba (Ctrl+Tab)" -ForegroundColor Yellow
Write-Host "   - NÃO deve fazer logout" -ForegroundColor Gray
Write-Host "   - Deve manter sessão" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray

Write-Host "🔍 CENÁRIO 4: Recarregar página (F5)" -ForegroundColor Yellow
Write-Host "   - NÃO deve fazer logout" -ForegroundColor Gray
Write-Host "   - Deve manter sessão via cookie" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray

Write-Host "✅ VALIDAÇÃO:" -ForegroundColor Green
Write-Host "Após cada teste de fechamento, abra novamente:" -ForegroundColor Gray
Write-Host "http://localhost:5173" -ForegroundColor Gray
Write-Host "Deve ser redirecionado para /login (sessão limpa)" -ForegroundColor Gray

Write-Host "`n📊 Para monitorar logs do servidor:" -ForegroundColor Cyan
Write-Host "Observe o terminal do servidor para mensagens de logout" -ForegroundColor Gray