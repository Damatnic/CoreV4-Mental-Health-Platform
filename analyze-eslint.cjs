const fs = require('fs');
const { execSync } = require('child_process');

console.log('Analyzing ESLint errors...\n');

try {
  // Run ESLint and get JSON output (ignore exit code since ESLint returns non-zero when there are errors)
  let eslintOutput;
  try {
    eslintOutput = execSync('npx eslint . --format json', { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
  } catch (e) {
    // ESLint exits with non-zero when there are errors, but stdout still has the JSON
    eslintOutput = e.stdout;
  }
  
  const data = JSON.parse(eslintOutput);
  
  // Get top files with errors
  const sorted = data
    .filter(f => f.errorCount > 0)
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 20);
  
  console.log('Top 20 files with most errors:');
  sorted.forEach((f, i) => {
    const relativePath = f.filePath.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
    console.log(`${i + 1}. ${f.errorCount} errors: ${relativePath}`);
  });
  
  // Count error types
  const errorTypes = {};
  data.forEach(file => {
    file.messages.forEach(msg => {
      if (msg.severity === 2) { // errors only
        errorTypes[msg.ruleId] = (errorTypes[msg.ruleId] || 0) + 1;
      }
    });
  });
  
  console.log('\nTop error types:');
  const sortedTypes = Object.entries(errorTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  sortedTypes.forEach(([rule, count]) => {
    console.log(`  ${rule}: ${count} errors`);
  });
  
  // Overall stats
  const totalErrors = data.reduce((sum, f) => sum + f.errorCount, 0);
  const totalWarnings = data.reduce((sum, f) => sum + f.warningCount, 0);
  const filesWithErrors = data.filter(f => f.errorCount > 0).length;
  
  console.log('\nOverall Stats:');
  console.log(`  Total errors: ${totalErrors}`);
  console.log(`  Total warnings: ${totalWarnings}`);
  console.log(`  Files with errors: ${filesWithErrors}`);
  console.log(`  Reduction from original: ${3415 - (totalErrors + totalWarnings)} fixed (${Math.round((3415 - (totalErrors + totalWarnings)) / 3415 * 100)}%)`);
  
} catch (error) {
  console.error('Error running ESLint:', error.message);
}
