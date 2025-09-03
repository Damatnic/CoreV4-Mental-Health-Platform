const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('eslint-final.json', 'utf8'));
  let totalErrors = 0;
  let totalWarnings = 0;
  let filesWithErrors = [];

  data.forEach(file => {
    if (file.errorCount > 0) {
      totalErrors += file.errorCount;
      filesWithErrors.push({
        path: file.filePath.replace(/^.*CoreV4[\\\/]/, ''),
        errors: file.errorCount,
        warnings: file.warningCount
      });
    }
    totalWarnings += file.warningCount;
  });

  console.log('=================================');
  console.log(`TOTAL ERRORS: ${totalErrors}`);
  console.log(`TOTAL WARNINGS: ${totalWarnings}`);
  console.log('=================================\n');
  
  // Sort by error count and show top 10
  filesWithErrors.sort((a, b) => b.errors - a.errors);
  console.log('TOP FILES WITH ERRORS:');
  filesWithErrors.slice(0, 10).forEach(file => {
    console.log(`  ${file.errors} errors - ${file.path}`);
  });
} catch (error) {
  console.error('Error reading ESLint output:', error.message);
}