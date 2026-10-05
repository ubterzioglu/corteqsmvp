#!/usr/bin/env pwsh
# SG1 · Sözleşme testi: docs/archive/backups izlenmemeli
#
# Bu test, DB dump'larının (PII + auth hash'leri) git'te izlenmediğini doğrular.
# S1 bulgusu: 16 dosya public repoda — KVKK/GDPR ihlali.
#
# Kullanım: ./scripts/check-no-backups-tracked.ps1
# Çıkış: 0 = temiz, 1 = izlenen dosya var

$ErrorActionPreference = "Stop"

$tracked = git ls-files docs/archive/backups 2>$null

if ($tracked) {
    Write-Host "❌ SG1 BAŞARISIZ: docs/archive/backups/ altında izlenen dosyalar var:" -ForegroundColor Red
    Write-Host $tracked
    Write-Host ""
    Write-Host "Çözüm: git rm --cached -r docs/archive/backups/" -ForegroundColor Yellow
    Write-Host "Sonra: git commit -m 'SG1: DB dump'ları izlenenden çıkar'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ SG1 OK: docs/archive/backups/ izlenmiyor" -ForegroundColor Green
exit 0
