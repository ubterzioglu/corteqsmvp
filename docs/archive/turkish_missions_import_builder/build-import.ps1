$ErrorActionPreference = "Stop"

Write-Host "Turkish missions import builder" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js bulunamadı. Önce Node.js LTS kurun: https://nodejs.org/"
}

if (-not (Test-Path ".\node_modules")) {
    Write-Host "Node bağımlılıkları kuruluyor..."
    npm install
}

Write-Host "Playwright Chromium kurulumu kontrol ediliyor..."
npx playwright install chromium

Write-Host "Resmî MFA sayfaları taranıyor..."
node .\scrape-and-build-import.mjs

Write-Host ""
Write-Host "Tamamlandı. Import dosyası:" -ForegroundColor Green
Write-Host ".\output\turkish_missions_import.sql"
Write-Host ""
Write-Host "Supabase SQL Editor içinde önce schema.sql, ardından output\turkish_missions_import.sql çalıştırın."
