# PowerShell script to find and report all any types by file
Write-Host "Finding all TypeScript files with 'any' types..." -ForegroundColor Cyan

$eslintOutput = npx eslint . --ext .ts,.tsx --format json 2>$null | ConvertFrom-Json

$fileStats = @{}
$totalCount = 0

foreach ($file in $eslintOutput) {
    $anyWarnings = $file.messages | Where-Object { $_.ruleId -eq "@typescript-eslint/no-explicit-any" }
    if ($anyWarnings.Count -gt 0) {
        $relativePath = $file.filePath -replace [regex]::Escape($PWD.Path + "\"), ""
        $fileStats[$relativePath] = $anyWarnings.Count
        $totalCount += $anyWarnings.Count
    }
}

Write-Host "`nTotal 'any' types found: $totalCount" -ForegroundColor Yellow
Write-Host "`nFiles with most 'any' types:" -ForegroundColor Green

$fileStats.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20 | ForEach-Object {
    Write-Host "$($_.Value.ToString().PadLeft(4)) - $($_.Key)" -ForegroundColor White
}

Write-Host "`nBy directory:" -ForegroundColor Green
$dirStats = @{}

foreach ($file in $fileStats.Keys) {
    $dir = Split-Path -Parent $file
    if (-not $dirStats.ContainsKey($dir)) {
        $dirStats[$dir] = 0
    }
    $dirStats[$dir] += $fileStats[$file]
}

$dirStats.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "$($_.Value.ToString().PadLeft(4)) - $($_.Key)" -ForegroundColor White
}