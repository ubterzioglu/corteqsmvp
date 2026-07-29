# Bildirim dispatcher kurulumu — tek komutla calisir:
#
#   .\scripts\setup-notification-dispatch.ps1                  # mevcut sirri kullanir
#   .\scripts\setup-notification-dispatch.ps1 -GenerateSecret  # yeni guclu sir uretip 3 yere yazar
#
# Yaptiklari:
#   1. .env.local'i yukler (Supabase anahtarlari orada yasar)
#   2. NOTIFY_DISPATCH_SECRET'i dogrular (bos / cok kisa / yer tutucu ise durur)
#   3. dispatch.url + dispatch.secret satirlarini notification_settings'e yazar
#   4. Edge Function'i secret ile cagirip 3 yerin (fonksiyon / .env.local / DB) eslestigini kanitlar
#
# Sir hicbir yerde ekrana basilmaz. Cok satirli komut yapistirma derdini ortadan kaldirmak
# icin yazildi — konsola yapistirilan cok satirli bloklar PS prompt'lariyla birlikte
# kopyalanip bozuk calisiyordu.

param(
  # Kriptografik rastgele bir sir uretir, .env.local'e yazar, `supabase secrets set` ile
  # Edge Function'a tanimlar ve DB'ye yazar. Sir hicbir yerde ekrana basilmaz.
  [switch]$GenerateSecret
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$projectRef = "injprdrsklkxgnaiixzh"
$poolerUrl = "postgresql://postgres.$projectRef@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"
$functionUrl = "https://$projectRef.supabase.co/functions/v1/send-notification-emails"
$configSql = "supabase\manual\2026-07-29_notification_dispatch_config.sql"

# --- 1. .env.local ---------------------------------------------------------
if (-not (Test-Path ".env.local")) {
  Write-Host "HATA: .env.local bulunamadi ($repoRoot)" -ForegroundColor Red
  exit 1
}

Get-Content ".env.local" | ForEach-Object {
  if ($_ -match '^\s*([^#=\s][^=]*?)\s*=\s*"?(.*?)"?\s*$') {
    Set-Item -Path "env:$($matches[1])" -Value $matches[2]
  }
}
Write-Host "[1/4] .env.local yuklendi." -ForegroundColor Green

# --- 2. Sir: uret ya da dogrula -------------------------------------------
if ($GenerateSecret) {
  $bytes = [byte[]]::new(32)
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  # URL-guvenli base64: header degeri olarak sorunsuz tasinir.
  $secret = [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')

  # .env.local'de satiri degistir; yoksa sona ekle. Dosyanin geri kalanina dokunulmaz.
  $lines = Get-Content ".env.local"
  if ($lines -match '^\s*NOTIFY_DISPATCH_SECRET\s*=') {
    $lines = $lines | ForEach-Object {
      if ($_ -match '^\s*NOTIFY_DISPATCH_SECRET\s*=') { "NOTIFY_DISPATCH_SECRET=`"$secret`"" } else { $_ }
    }
  } else {
    $lines += "NOTIFY_DISPATCH_SECRET=`"$secret`""
  }
  Set-Content -Path ".env.local" -Value $lines -Encoding utf8NoBOM
  $env:NOTIFY_DISPATCH_SECRET = $secret

  supabase secrets set NOTIFY_DISPATCH_SECRET="$secret" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "HATA: supabase secrets set basarisiz oldu." -ForegroundColor Red
    exit 1
  }
  Write-Host "[2/4] Yeni sir uretildi ($($secret.Length) karakter), .env.local + Edge Function guncellendi." -ForegroundColor Green
} else {
  $secret = $env:NOTIFY_DISPATCH_SECRET

  if ([string]::IsNullOrWhiteSpace($secret)) {
    Write-Host "HATA: .env.local icinde NOTIFY_DISPATCH_SECRET bos ya da yok." -ForegroundColor Red
    Write-Host "Yeni bir sir uretmek icin: .\scripts\setup-notification-dispatch.ps1 -GenerateSecret" -ForegroundColor Yellow
    exit 1
  }
  if ($secret.Trim().Length -lt 12) {
    Write-Host "HATA: NOTIFY_DISPATCH_SECRET yalnizca $($secret.Trim().Length) karakter - kaba kuvvete acik." -ForegroundColor Red
    Write-Host "Yeni bir sir uretmek icin: .\scripts\setup-notification-dispatch.ps1 -GenerateSecret" -ForegroundColor Yellow
    exit 1
  }
  if ($secret -match '(?i)(placeholder|change.?me|secret_here|buraya_?yaz|xxxx)') {
    Write-Host "HATA: NOTIFY_DISPATCH_SECRET yer tutucu metin gibi gorunuyor." -ForegroundColor Red
    exit 1
  }

  Write-Host "[2/4] Sir dogrulandi ($($secret.Trim().Length) karakter)." -ForegroundColor Green
  if ($secret.Trim().Length -lt 24) {
    Write-Host "      NOT: 24 karakterden kisa. Guclendirmek icin: -GenerateSecret" -ForegroundColor DarkYellow
  }
}

if (-not $env:SUPABASE_DB_PASSWORD) {
  Write-Host "HATA: .env.local icinde SUPABASE_DB_PASSWORD yok." -ForegroundColor Red
  exit 1
}

# --- 3. DB config ----------------------------------------------------------
# Pooler kullanilir: dogrudan baglanti (db.<ref>.supabase.co) bu agdan cozulmuyor.
$env:PGPASSWORD = $env:SUPABASE_DB_PASSWORD
psql $poolerUrl -v ON_ERROR_STOP=1 -v secret="$secret" -f $configSql
if ($LASTEXITCODE -ne 0) {
  Write-Host "HATA: dispatch config yazilamadi (psql cikis kodu $LASTEXITCODE)." -ForegroundColor Red
  exit 1
}
Write-Host "[3/4] dispatch.url + dispatch.secret yazildi." -ForegroundColor Green

# --- 4. Uctan uca kimlik testi --------------------------------------------
# Kuyrukta bekleyen kayit yok (94'unun hepsi 'skipped'), bu yuzden bu cagri
# KIMSEYE MAIL GONDERMEZ - yalnizca yetkilendirmeyi sinar.
$response = Invoke-WebRequest -SkipHttpErrorCheck -Uri $functionUrl -Method POST `
  -Body '{"source":"setup-test"}' `
  -Headers @{ "x-dispatch-secret" = $secret; "Content-Type" = "application/json" }

Write-Host ""
if ($response.StatusCode -eq 200) {
  Write-Host "[4/4] BASARILI - Edge Function 200 dondu: $($response.Content)" -ForegroundColor Green
  Write-Host ""
  Write-Host "Fonksiyon secret'i, .env.local ve DB birbirine uyuyor. Boru hatti hazir." -ForegroundColor Green
  Write-Host "Kalan: commit + Coolify deploy, sonra /admin/notifications'tan anahtarlari ac."
} elseif ($response.StatusCode -eq 401) {
  Write-Host "[4/4] BASARISIZ - Edge Function 401 dondu." -ForegroundColor Red
  Write-Host "Edge Function'daki secret .env.local'dekinden FARKLI. Duzeltmek icin:" -ForegroundColor Yellow
  Write-Host '  supabase secrets set NOTIFY_DISPATCH_SECRET="<.env.local icindeki deger>"'
  Write-Host "Sonra bu scripti tekrar calistir."
  exit 1
} else {
  Write-Host "[4/4] Beklenmeyen yanit: HTTP $($response.StatusCode)" -ForegroundColor Red
  Write-Host $response.Content
  exit 1
}
