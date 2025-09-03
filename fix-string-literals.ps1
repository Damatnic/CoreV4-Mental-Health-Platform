# PowerShell script to fix all parsing errors from corrupted string literals
Write-Host "Starting to fix parsing errors in string literals..." -ForegroundColor Green

# Get all TypeScript and JavaScript files
$files = Get-ChildItem -Path . -Include *.ts,*.tsx,*.js,*.jsx -Recurse | Where-Object { $_.FullName -notmatch "node_modules|dist|build|coverage|\.next" }

$totalFiles = $files.Count
$fixedFiles = 0
$totalFixes = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content
        
        # Fix &apos; that appears inside string literals
        # Pattern 1: Inside single quotes
        $content = $content -replace "('(?:[^'\\]|\\.)*?)(&apos;)((?:[^'\\]|\\.)*?')", '$1''$3'
        
        # Pattern 2: Inside double quotes  
        $content = $content -replace '("(?:[^"\\]|\\.)*?)(&apos;)((?:[^"\\]|\\.)*?")', '$1''$3'
        
        # Pattern 3: Inside template literals
        $content = $content -replace '(`(?:[^`\\]|\\.)*?)(&apos;)((?:[^`\\]|\\.)*?`)', '$1''$3'
        
        # Fix cases where the closing quote got corrupted
        # This pattern finds strings that end with &apos; instead of a proper closing quote
        $content = $content -replace "('(?:[^'\\]|\\.)*?)&apos;(?=\s*[,;}\)\]]))", '$1'''
        $content = $content -replace '("(?:[^"\\]|\\.)*?)&apos;(?=\s*[,;}\)\]])', '$1"'
        
        # Fix any remaining standalone &apos; in code context (not in comments)
        # Only replace if it's clearly in a string context
        $lines = $content -split "`n"
        $newLines = @()
        
        foreach ($line in $lines) {
            # Skip comment lines
            if ($line -match '^\s*//' -or $line -match '^\s*\*') {
                $newLines += $line
                continue
            }
            
            # If line contains &apos; and has string delimiters, fix it
            if ($line -match '&apos;' -and ($line -match '[''"`]')) {
                $fixedLine = $line -replace '&apos;', "'"
                $newLines += $fixedLine
                if ($fixedLine -ne $line) {
                    $totalFixes++
                }
            } else {
                $newLines += $line
            }
        }
        
        $content = $newLines -join "`n"
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
            $fixedFiles++
            Write-Host "Fixed: $($file.Name)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`nCompleted!" -ForegroundColor Green
Write-Host "Total files processed: $totalFiles" -ForegroundColor Cyan
Write-Host "Files fixed: $fixedFiles" -ForegroundColor Cyan
Write-Host "Total fixes applied: $totalFixes" -ForegroundColor Cyan

# Run ESLint to check for remaining errors
Write-Host "`nRunning ESLint to check remaining errors..." -ForegroundColor Green
& npx eslint . --ext .ts,.tsx,.js,.jsx 2>&1 | Select-String -Pattern "error" | Select-Object -First 50