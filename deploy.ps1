# ============================================================
# deploy.ps1 — УМНЫЙ ДЕПЛОЙ (автоматически синхронизирует версию)
# ============================================================
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY vgatk_bd (Авто-версия)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json не найден." -ForegroundColor Red
    exit 1
}

# 1. Загружаем теги с GitHub (чтобы точно знать актуальную версию)
Write-Host "🔄 Синхронизация с GitHub..." -ForegroundColor Yellow
git fetch --tags --quiet

# 2. Находим самый большой тег (по версии, а не по дате)
$allTags = git tag --list "v*" | Where-Object { $_ -match '^v\d+\.\d+\.\d+$' }
$lastVersion = "0.0.0"

if ($allTags) {
    $maxMajor = 0; $maxMinor = 0; $maxPatch = 0
    foreach ($tag in $allTags) {
        if ($tag -match '^v(\d+)\.(\d+)\.(\d+)$') {
            $maj = [int]$Matches[1]; $min = [int]$Matches[2]; $pat = [int]$Matches[3]
            if ($maj -gt $maxMajor -or ($maj -eq $maxMajor -and $min -gt $maxMinor) -or ($maj -eq $maxMajor -and $min -eq $maxMinor -and $pat -gt $maxPatch)) {
                $maxMajor = $maj; $maxMinor = $min; $maxPatch = $pat
                $lastVersion = "$maj.$min.$pat"
            }
        }
    }
}

Write-Host "🏷️  Самая высокая версия на GitHub: v$lastVersion" -ForegroundColor Yellow

# 3. Читаем файл
$pkg = Get-Content package.json -Raw -Encoding UTF8 | ConvertFrom-Json
$currentVersion = $pkg.version

# Если файл отстает от GitHub — принудительно выравниваем (без коммита, просто чтобы дальше считать правильно)
$isFileOld = $false
if ($currentVersion -match '^(\d+)\.(\d+)\.(\d+)$' -and $lastVersion -match '^(\d+)\.(\d+)\.(\d+)$') {
    $fMaj = [int]$Matches[1]; $fMin = [int]$Matches[2]; $fPat = [int]$Matches[3] # Ложь, тут перезаписывается
}
# Простое сравнение строк версий (работает если major одинаковый)
if ([version]$currentVersion -lt [version]$lastVersion) {
    $isFileOld = $true
    $currentVersion = $lastVersion
    Write-Host "⚠️  В package.json была старая версия. Исправляю на $lastVersion." -ForegroundColor Red
}

# Парсим текущую (выровненную) версию для шага
$vParts = $currentVersion -split '\.'
$major = [int]$vParts[0]; $minor = [int]$vParts[1]; $patch = [int]$vParts[2]

Write-Host "📦 Текущая версия (база): $currentVersion" -ForegroundColor Yellow
Write-Host ""

# 4. Спрашиваем, что делать
Write-Host "Какой тип обновления?" -ForegroundColor Cyan
Write-Host "  [1] patch  ($currentVersion → $major.$minor.$($patch+1))   — багфикс" -ForegroundColor White
Write-Host "  [2] minor  ($currentVersion → $major.$($minor+1).0)   — новая фича" -ForegroundColor White
Write-Host "  [3] major  ($currentVersion → $($major+1).0.0)   — ломающие изменения" -ForegroundColor White
Write-Host "  [4] не менять (только push)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Введи 1, 2, 3 или 4"

$newVersion = $currentVersion
$bump = $false

switch ($choice) {
    "1" { $newVersion = "$major.$minor.$($patch+1)"; $bump = $true }
    "2" { $newVersion = "$major.$($minor+1).0"; $bump = $true }
    "3" { $newVersion = "$($major+1).0.0"; $bump = $true }
    "4" { $bump = $false }
    default { Write-Host "❌ Неверный выбор." -ForegroundColor Red; exit 1 }
}

# 5. Записываем новую версию в файлы (даже если bump = false, мы могли выровнять)
$pkgRaw = Get-Content package.json -Raw -Encoding UTF8
$pkgRaw = $pkgRaw -replace '("version"\s*:\s*")[^"]+(")', ('${1}' + $newVersion + '${2}')
Set-Content -Path "package.json" -Value $pkgRaw -Encoding UTF8 -NoNewline

if (Test-Path "package-lock.json") {
    $lockRaw = Get-Content "package-lock.json" -Raw -Encoding UTF8
    $lockRaw = [regex]::Replace($lockRaw, '("version"\s*:\s*")[^"]+(")', ('${1}' + $newVersion + '${2}'), [System.Text.RegularExpressions.RegexOptions]::None, [TimeSpan]::FromSeconds(2))
    Set-Content -Path "package-lock.json" -Value $lockRaw -Encoding UTF8 -NoNewline
}

if ($bump) {
    Write-Host "🚀 Новая версия: $currentVersion → $newVersion" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Версия: $newVersion (без изменений)" -ForegroundColor Yellow
}

# 6. Git add + commit + push
Write-Host "📝 [1/4] git add -A ..." -ForegroundColor Cyan
git add -A

$statusOutput = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace($statusOutput)) {
    Write-Host "📝 [2/4] git commit ..." -ForegroundColor Cyan
    $msg = if ($bump) { "Release v$newVersion ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))" } else { "Update ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))" }
    git commit -m $msg
}

Write-Host "📤 [3/4] git push origin main ..." -ForegroundColor Cyan
git push origin main

# 7. Тег
if ($bump) {
    $newTag = "v$newVersion"
    $existingTags = git tag --list $newTag
    if ([string]::IsNullOrWhiteSpace($existingTags)) {
        Write-Host "🏷️  [4/4] Создаю тег $newTag ..." -ForegroundColor Cyan
        git tag $newTag
        git push origin $newTag
        Write-Host "✅ ГОТОВО! GitHub Actions соберёт релиз $newTag." -ForegroundColor Green
    } else {
        Write-Host "⚠️ Тег $newTag уже есть." -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  [4/4] Тег не создан (версия не менялась)." -ForegroundColor Yellow
}
Write-Host "=========================================" -ForegroundColor Cyan
