const fs = require('fs');
const path = require('path');

// Files with issues
const filesToClean = [
  'src/components/ui/EnhancedLayout.tsx',
  'src/components/wellness/BreathingExercises.tsx', 
  'src/components/wellness/MeditationTimer.tsx',
  'src/components/wellness/TherapeuticJournal.tsx'
];

function cleanFile(filePath) {
  console.log(`Cleaning ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Find the last valid export statement
    let lastExportLine = -1;
    let exportCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^export (const|function|default)/)) {
        exportCount++;
        if (exportCount === 1) {
          // Keep going until we find the end of the first export
          for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('};') || lines[j].includes('}')) {
              // Check if this is likely the end of the component
              if (j + 1 < lines.length && lines[j + 1].trim() === '') {
                lastExportLine = j + 1;
                break;
              } else if (j + 1 < lines.length && lines[j + 1].match(/^export/)) {
                lastExportLine = j;
                break;
              }
            }
          }
          break;
        }
      }
    }
    
    if (lastExportLine > 0 && exportCount > 1) {
      // Keep only the first complete component
      const cleanedLines = lines.slice(0, lastExportLine + 1);
      const cleanedContent = cleanedLines.join('\n');
      
      // Ensure file ends with a newline
      const finalContent = cleanedContent.endsWith('\n') ? cleanedContent : cleanedContent + '\n';
      
      fs.writeFileSync(filePath, finalContent, 'utf8');
      console.log(`  Cleaned ${filePath} - removed ${lines.length - cleanedLines.length} duplicate lines`);
    } else {
      console.log(`  ${filePath} appears clean or couldn't be processed safely`);
    }
  } catch (error) {
    console.error(`  Error cleaning ${filePath}:`, error.message);
  }
}

// Clean each file
filesToClean.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    cleanFile(fullPath);
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});

console.log('Cleanup complete!');