$ErrorActionPreference = "Stop"
Write-Host "DEPLOY vgatk_bd" -ForegroundColor Cyan

if (-not (Test-Path "package.json")) { Write-Host "Нет package.json"; exit 1 }

# 1. Загружаем теги
git fetch --tags --quiet
$allTags = git tag --list "v*" | Where-Object { $_ -match '^v\d+\.\d+\.\d+$' }
$lastVersion = "0.0.0"
if ($allTags) {
    $maxMajor=0; $maxMinor=0; $maxPatch=0
    foreach ($tag in $allTags) {
        if ($tag -match '^v(\d+)\.(\d+)\.(\d+)$') {
            $maj=[int]$Matches[1]; $min=[int]$Matches[2]; $pat=[int]$Matches[3]
            if ($maj -gt $maxMajor -or ($maj -eq $maxMajor -and $min -gt $maxMinor) -or ($maj -eq $maxMajor -and $min -eq $maxMinor -and $pat -gt $maxPatch)) {
                $maxMajor=$maj; $maxMinor=$min; $maxPatch=$pat; $lastVersion="$maj.$min.$pat"
            }
        }
    }
}
Write-Host "Последний тег: v$lastVersion" -ForegroundColor Yellow

# 2. Читаем версию
$pkg = Get-Content package.json -Raw -Encoding UTF8 | ConvertFrom-Json
$currentVersion = $pkg.version
if ([version]$currentVersion -lt [version]$lastVersion) {
    Write-Host "Выравниваю версию до $lastVersion" -ForegroundColor Red
    $currentVersion = $lastVersion
}
$vParts = $currentVersion -split '\.'
$major=[int]$vParts[0]; $minor=[int]$vParts[1]; $patch=[int]$vParts[2]
Write-Host "Текущая версия: $currentVersion" -ForegroundColor Yellow

# 3. Выбор
Write-Host "[1] patch ($major.$minor.$($patch+1))  [2] minor ($major.$($minor+1).0)  [3] major ($($major+1).0.0)  [4] не менять" -ForegroundColor Cyan
$choice = Read-Host "Введи 1,2,3,4"
$newVersion = $currentVersion
$bump = $false
switch ($choice) {
    "1" { $newVersion="$major.$minor.$($patch+1)"; $bump=$true }
    "2" { $newVersion="$major.$($minor+1).0"; $bump=$true }
    "3" { $newVersion="$($major+1).0.0"; $bump=$true }
    "4" { $bump=$false }
    default { Write-Host "Неверный выбор"; exit 1 }
}

# 4. Меняем ТОЛЬКО package.json
$pkgRaw = Get-Content package.json -Raw -Encoding UTF8
$pkgRaw = $pkgRaw -replace '("version"\s*:\s*")[^"]+(")', ('${1}' + $newVersion + '${2}')
Set-Content -Path "package.json" -Value $pkgRaw -Encoding UTF8 -NoNewline
if ($bump) { Write-Host "Новая версия: $newVersion" -ForegroundColor Green }

# 5. СИНХРОНИЗИРУЕМ lock через npm (НЕ регуляркой!)
if (Test-Path "package-lock.json") {
    npm install --package-lock-only --ignore-scripts 2>$null
    Write-Host "package-lock.json обновлён через npm" -ForegroundColor Green
}

# 6. Git
git add -A
$statusOutput = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace($statusOutput)) {
    $msg = if ($bump) { "Release v$newVersion" } else { "Update" }
    git commit -m $msg
}
git push origin main

# 7. Тег
if ($bump) {
    $newTag = "v$newVersion"
    $existing = git tag --list $newTag
    if ([string]::IsNullOrWhiteSpace($existing)) {
        git tag $newTag
        git push origin $newTag
        Write-Host "Тег $newTag создан" -ForegroundColor Green
    } else { Write-Host "Тег $newTag уже есть" -ForegroundColor Yellow }
} else { Write-Host "Без тега" -ForegroundColor Yellow }
