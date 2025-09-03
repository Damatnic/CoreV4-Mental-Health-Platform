# PowerShell script to systematically fix ESLint errors

Write-Host "Starting ESLint error fixing process..." -ForegroundColor Green

# Step 1: Get all ESLint errors
Write-Host "`nAnalyzing current ESLint errors..." -ForegroundColor Yellow
npx eslint . --ext .ts,.tsx --format json > eslint-errors.json 2>&1

# Step 2: Count current errors
$errorCount = (npx eslint . --ext .ts,.tsx 2>&1 | Select-String -Pattern "error|warning").Count
Write-Host "Current error/warning count: $errorCount" -ForegroundColor Red

# Step 3: Try auto-fix first
Write-Host "`nRunning ESLint auto-fix..." -ForegroundColor Yellow
npx eslint . --ext .ts,.tsx --fix 2>&1 | Out-Null

# Step 4: Count remaining errors
$newErrorCount = (npx eslint . --ext .ts,.tsx 2>&1 | Select-String -Pattern "error|warning").Count
$fixed = $errorCount - $newErrorCount
Write-Host "Auto-fixed $fixed issues" -ForegroundColor Green
Write-Host "Remaining errors/warnings: $newErrorCount" -ForegroundColor $(if($newErrorCount -eq 0) {"Green"} else {"Yellow"})

# Step 5: Show remaining high-priority errors
if ($newErrorCount -gt 0) {
    Write-Host "`nRemaining high-priority issues:" -ForegroundColor Yellow
    npx eslint . --ext .ts,.tsx 2>&1 | Select-String -Pattern "error" | Select-Object -First 20
}

Write-Host "`nESLint error fixing process complete!" -ForegroundColor Green