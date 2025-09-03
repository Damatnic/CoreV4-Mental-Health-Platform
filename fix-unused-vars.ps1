# PowerShell script to fix all unused variable errors by prefixing with underscore

Write-Host "Fixing unused variable errors..." -ForegroundColor Green

# Get all ESLint errors and filter for unused vars
$eslintOutput = npx eslint . --ext .ts,.tsx 2>&1

# Parse unused variable errors
$unusedVarErrors = @()
$currentFile = ""

foreach ($line in $eslintOutput -split "`n") {
    if ($line -match "^H:\\") {
        $currentFile = $line.Trim()
    }
    elseif ($line -match "(\d+):(\d+)\s+error\s+'([^']+)' is (defined but never used|assigned a value but never used)") {
        $unusedVarErrors += @{
            File = $currentFile
            Line = [int]$matches[1]
            Column = [int]$matches[2]
            Variable = $matches[3]
        }
    }
}

Write-Host "Found $($unusedVarErrors.Count) unused variable errors" -ForegroundColor Yellow

# Group errors by file
$errorsByFile = $unusedVarErrors | Group-Object -Property File

foreach ($fileGroup in $errorsByFile) {
    $filePath = $fileGroup.Name
    
    if (Test-Path $filePath) {
        Write-Host "Processing $filePath..." -ForegroundColor Cyan
        $content = Get-Content $filePath -Raw
        $lines = $content -split "`n"
        
        # Sort errors by line number in reverse to avoid offset issues
        $sortedErrors = $fileGroup.Group | Sort-Object -Property Line -Descending
        
        foreach ($error in $sortedErrors) {
            $lineIndex = $error.Line - 1
            if ($lineIndex -ge 0 -and $lineIndex -lt $lines.Count) {
                $line = $lines[$lineIndex]
                $varName = $error.Variable
                
                # Different patterns for replacing unused variables
                if ($line -match "\b$varName\b") {
                    # Simple variable declaration
                    $lines[$lineIndex] = $line -replace "\b$varName\b", "_$varName"
                    Write-Host "  Fixed: $varName -> _$varName (line $($error.Line))" -ForegroundColor Gray
                }
            }
        }
        
        # Write back the fixed content
        $lines -join "`n" | Set-Content $filePath -NoNewline
    }
}

# Check remaining errors
Write-Host "`nChecking remaining errors..." -ForegroundColor Yellow
$remainingErrors = (npx eslint . --ext .ts,.tsx 2>&1 | Select-String " error ").Count
Write-Host "Remaining errors: $remainingErrors" -ForegroundColor $(if($remainingErrors -eq 0) {"Green"} else {"Red"})