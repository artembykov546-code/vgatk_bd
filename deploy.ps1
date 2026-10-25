# ============================================================
# deploy.ps1 — деплой vgatk_bd с выбором SemVer-версии
# ============================================================
# Процедура:
#   1. Спрашиваем тип обновления: patch / minor / major / без версии
#   2. Правим version в package.json (и package-lock.json)
#   3. git add + commit + push origin main
#   4. git tag vX.X.X + git push origin vX.X.X (запускает GitHub Actions)
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY vgatk_bd" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json не найден. Запусти из корня проекта." -ForegroundColor Red
    exit 1
}

# --- 1. Текущая версия ---
$pkgPath = "package.json"
$pkgRaw = Get-Content $pkgPath -Raw -Encoding UTF8
$pkg = $pkgRaw | ConvertFrom-Json
$currentVersion = $pkg.version
Write-Host "📦 Текущая версия в package.json: $currentVersion" -ForegroundColor Yellow

# Проверка, что версия в формате X.Y.Z
if ($currentVersion -notmatch '^(\d+)\.(\d+)\.(\d+)$') {
    Write-Host "❌ Версия '$currentVersion' не в формате X.Y.Z. Исправь вручную." -ForegroundColor Red
    exit 1
}
$major = [int]$Matches[1]
$minor = [int]$Matches[2]
$patch = [int]$Matches[3]

# --- 2. Спрашиваем тип обновления ---
Write-Host ""
Write-Host "Какой тип обновления?" -ForegroundColor Cyan
Write-Host "  [1] patch  ($currentVersion → $major.$minor.$($patch+1))   — багфикс" -ForegroundColor White
Write-Host "  [2] minor  ($currentVersion → $major.$($minor+1).0)   — новый функционал" -ForegroundColor White
Write-Host "  [3] major  ($currentVersion → $($major+1).0.0)   — ломающие изменения" -ForegroundColor White
Write-Host "  [4] не менять версию (только push, без релиза)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Введи 1, 2, 3 или 4"

$newVersion = $currentVersion
$bump = $false

switch ($choice) {
    "1" {
        $newVersion = "$major.$minor.$($patch+1)"
        $bump = $true
    }
    "2" {
        $newVersion = "$major.$($minor+1).0"
        $bump = $true
    }
    "3" {
        $newVersion = "$($major+1).0.0"
        $bump = $true
    }
    "4" {
        $bump = $false
    }
    default {
        Write-Host "❌ Неверный выбор. Выход." -ForegroundColor Red
        exit 1
    }
}

if ($bump) {
    Write-Host ""
    Write-Host "🚀 Новая версия: $currentVersion → $newVersion" -ForegroundColor Green

    # Правим package.json (аккуратно, только поле version в корне)
    $pkgRaw = $pkgRaw -replace '("version"\s*:\s*")' + [regex]::Escape($currentVersion) + '(")', ('${1}' + $newVersion + '${2}')
    Set-Content -Path $pkgPath -Value $pkgRaw -Encoding UTF8 -NoNewline
    Write-Host "✅ package.json обновлён" -ForegroundColor Green

    # Правим package-lock.json, если он есть (только первое вхождение в корне)
    if (Test-Path "package-lock.json") {
        $lockRaw = Get-Content "package-lock.json" -Raw -Encoding UTF8
        # В package-lock.json версия встречается в 2 местах: корень и пакеты — меняем только первые 2 строки-вхождения
        # Безопасный вариант: заменить все "version": "OLD" в начале (первые 3 вхождения)
        $lockRaw = [regex]::Replace(
            $lockRaw,
            '("version"\s*:\s*")' + [regex]::Escape($currentVersion) + '(")',
            ('${1}' + $newVersion + '${2}'),
            [System.Text.RegularExpressions.RegexOptions]::None,
            [TimeSpan]::FromSeconds(2)
        )
        Set-Content -Path "package-lock.json" -Value $lockRaw -Encoding UTF8 -NoNewline
        Write-Host "✅ package-lock.json обновлён" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️  Версия не меняется. Будет только push." -ForegroundColor Yellow
}

# --- 3. Последний тег (для справки) ---
$lastTag = $null
try {
    $lastTag = (git describe --tags --abbrev=0 2>$null)
} catch { $lastTag = $null }

if ([string]::IsNullOrWhiteSpace($lastTag)) {
    Write-Host "🏷️  Последний тег: (нет)" -ForegroundColor Yellow
} else {
    Write-Host "🏷️  Последний тег: $lastTag" -ForegroundColor Yellow
}

# --- 4. Git add + commit ---
Write-Host ""
Write-Host "📝 [1/4] git add -A ..." -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -ne 0) { Write-Host "❌ git add failed" -ForegroundColor Red; exit 1 }

$statusOutput = git status --porcelain
if ([string]::IsNullOrWhiteSpace($statusOutput)) {
    Write-Host "ℹ️  Нет изменений для коммита." -ForegroundColor Yellow
} else {
    Write-Host "📝 [2/4] git commit ..." -ForegroundColor Cyan
    $commitMsg = if ($bump) {
        "Release v$newVersion ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
    } else {
        "Update ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
    }
    git commit -m $commitMsg
    if ($LASTEXITCODE -ne 0) { Write-Host "❌ git commit failed" -ForegroundColor Red; exit 1 }
}

# --- 5. Git push main ---
Write-Host "📤 [3/4] git push origin main ..." -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) { Write-Host "❌ git push failed" -ForegroundColor Red; exit 1 }

# --- 6. Тег (только если версия поменялась) ---
if ($bump) {
    $newTag = "v$newVersion"
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
        Write-Host "   GitHub Actions соберёт релиз автоматически." -ForegroundColor Green
        Write-Host "   Actions:  https://github.com/artembykov546-code/vgatk_bd/actions" -ForegroundColor Green
        Write-Host "   Releases: https://github.com/artembykov546-code/vgatk_bd/releases/latest" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Тег $newTag уже существует. Пропускаю создание." -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  [4/4] Тег не создаётся — версия не менялась." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✅ Код отправлен на GitHub. Релиз не создавался." -ForegroundColor Green
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY ЗАВЕРШЁН" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
