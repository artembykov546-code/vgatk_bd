# ============================================================
# deploy.ps1 — деплой vgatk_bd с автосозданием тега версии
# Логика:
#   1. Читаем version из package.json
#   2. Сравниваем с последним git-тегом
#   3. Если версия выше — пуш + создание тега vX.X.X
#      (тег триггерит GitHub Actions → сборка релиза)
#   4. Если версия та же — просто push без тега
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY vgatk_bd" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Читаем версию из package.json ---
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json не найден. Запусти из корня проекта." -ForegroundColor Red
    exit 1
}

$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$currentVersion = $pkg.version
Write-Host "📦 Версия в package.json: $currentVersion" -ForegroundColor Yellow

# --- 2. Получаем последний git-тег ---
$lastTag = $null
try {
    $lastTag = (git describe --tags --abbrev=0 2>$null)
} catch {
    $lastTag = $null
}

if ([string]::IsNullOrWhiteSpace($lastTag)) {
    Write-Host "ℹ️  Тегов ещё нет — это будет первый релиз." -ForegroundColor Yellow
    $lastVersion = "0.0.0"
} else {
    Write-Host "🏷️  Последний тег: $lastTag" -ForegroundColor Yellow
    $lastVersion = $lastTag -replace '^v', ''
}

# --- 3. Сравниваем версии ---
function Compare-Versions($a, $b) {
    # Возвращает $true если $a > $b
    $va = $a -split '\.' | ForEach-Object { [int]$_ }
    $vb = $b -split '\.' | ForEach-Object { [int]$_ }
    $max = [Math]::Max($va.Count, $vb.Count)
    for ($i = 0; $i -lt $max; $i++) {
        $x = if ($i -lt $va.Count) { $va[$i] } else { 0 }
        $y = if ($i -lt $vb.Count) { $vb[$i] } else { 0 }
        if ($x -gt $y) { return $true }
        if ($x -lt $y) { return $false }
    }
    return $false
}

$isNewVersion = Compare-Versions $currentVersion $lastVersion
$newTag = "v$currentVersion"

if ($isNewVersion) {
    Write-Host "🚀 Новая версия! Будет создан тег: $newTag" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Версия не изменилась. Тег создаваться не будет." -ForegroundColor Yellow
}
Write-Host ""

# --- 4. Git add + commit ---
Write-Host "📝 [1/4] git add -A ..." -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -ne 0) { Write-Host "❌ git add failed" -ForegroundColor Red; exit 1 }

$statusOutput = git status --porcelain
if ([string]::IsNullOrWhiteSpace($statusOutput)) {
    Write-Host "ℹ️  Нет изменений для коммита." -ForegroundColor Yellow
} else {
    Write-Host "📝 [2/4] git commit ..." -ForegroundColor Cyan
    $commitMsg = "Автоматическое обновление v$currentVersion ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
    git commit -m $commitMsg
    if ($LASTEXITCODE -ne 0) { Write-Host "❌ git commit failed" -ForegroundColor Red; exit 1 }
}

# --- 5. Git push main ---
Write-Host "📤 [3/4] git push origin main ..." -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) { Write-Host "❌ git push failed" -ForegroundColor Red; exit 1 }

# --- 6. Создаём и пушим тег (только если версия новая) ---
if ($isNewVersion) {
    # Проверяем, что тега ещё нет
    $existingTags = git tag --list $newTag
    if ([string]::IsNullOrWhiteSpace($existingTags)) {
        Write-Host "🏷️  [4/4] Создаю тег $newTag ..." -ForegroundColor Cyan
        git tag $newTag
        if ($LASTEXITCODE -ne 0) { Write-Host "❌ git tag failed" -ForegroundColor Red; exit 1 }

        Write-Host "🚀 Пушу тег $newTag (запустит GitHub Actions) ..." -ForegroundColor Cyan
        git push origin $newTag
        if ($LASTEXITCODE -ne 0) { Write-Host "❌ git push tag failed" -ForegroundColor Red; exit 1 }

        Write-Host ""
        Write-Host "✅ ГОТОВО! Тег $newTag создан и отправлен." -ForegroundColor Green
        Write-Host "   GitHub Actions запустит сборку релиза." -ForegroundColor Green
        Write-Host "   Проверить: https://github.com/artembykov546-code/vgatk_bd/actions" -ForegroundColor Green
        Write-Host "   Скачать:   https://github.com/artembykov546-code/vgatk_bd/releases/latest" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Тег $newTag уже существует. Пропускаю." -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  [4/4] Тег не требуется — версия не изменилась." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✅ Код отправлен на GitHub. Релиз не создавался." -ForegroundColor Green
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY ЗАВЕРШЁН" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
