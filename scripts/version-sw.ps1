# Script PowerShell para versionar Service Worker
# Uso: .\scripts\version-sw.ps1 <patch|minor|major> [mensagem]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("patch", "minor", "major")]
    [string]$VersionType,
    
    [Parameter(Mandatory=$false)]
    [string]$Message = "Service Worker $VersionType update"
)

Write-Host "🚀 Versionando Service Worker..." -ForegroundColor Green

try {
    # Executar o script Node.js
    node version-sw.js $VersionType $Message
} catch {
    Write-Host "❌ Erro ao executar versionamento: $_" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Versionamento concluído!" -ForegroundColor Green
