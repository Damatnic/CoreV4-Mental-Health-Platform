const fs = require('fs');
const path = require('path');

// Map of undefined variables to their correct replacements
const replacements = {
  // Common undefined variables from the error report
  '_post': 'post',
  '_startDate': 'startDate',
  '_tag': 'tag',
  '_dateFilter': 'dateFilter',
  '_filter': 'filter',
  '_data': 'data',
  '_type': 'type',
  '_formData': 'formData',
  '_index': 'index',
  '_skipBoot': 'skipBoot',
  '_inputText': 'inputText',
  '_utterance': 'utterance',
  '_confidence': 'confidence',
  '_isListening': 'isListening',
  '_specialty': 'specialty',
  '_therapist': 'therapist',
  '_userId': 'userId',
  '_req': 'req',
  '_200': '200',
  '_201': '201',
  '_400': '400',
  '_401': '401',
  '_500': '500'
};

// Files to process
const filesToProcess = [
  'src/components/community/CommunityPosts.tsx',
  'src/components/community/CommunityEvents.tsx',
  'src/components/community/SupportGroups.tsx',
  'src/components/console/ConsoleBootSequence.tsx',
  'src/components/ai/TherapistChat.tsx',
  'src/components/ai/TherapistSelector.tsx',
  'src/components/accessibility/VoiceNavigation.tsx'
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Replace each undefined variable
  Object.entries(replacements).forEach(([wrong, correct]) => {
    // Use word boundaries to ensure we only replace exact matches
    const regex = new RegExp(`\\b${wrong}\\b`, 'g');
    const originalContent = content;
    content = content.replace(regex, correct);
    if (originalContent !== content) {
      modified = true;
      console.log(`  Replaced ${wrong} with ${correct} in ${filePath}`);
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Fixed ${filePath}`);
  } else {
    console.log(`  No changes needed for ${filePath}`);
  }
}

console.log('Fixing no-undef errors...\n');
filesToProcess.forEach(fixFile);
console.log('\n✓ Done!');