import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to create a simple SVG icon
function createSVGIcon(size, maskable = false) {
    const padding = maskable ? size * 0.1 : 0;
    const viewBox = `0 0 ${size} ${size}`;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background gradient -->
    <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#E8F4FD;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#B3E5FC;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#5E92F3;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#4A7FDB;stop-opacity:1" />
        </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="${size}" height="${size}" fill="url(#bg-gradient)"/>
    
    <!-- Heart symbol centered -->
    <g transform="translate(${size/2}, ${size/2})">
        <path d="M 0,${size * 0.15}
                 C ${-size * 0.25},${-size * 0.05} ${-size * 0.25},${-size * 0.2} ${-size * 0.1},${-size * 0.2}
                 C ${-size * 0.05},${-size * 0.2} 0,${-size * 0.15} 0,${-size * 0.15}
                 C 0,${-size * 0.15} ${size * 0.05},${-size * 0.2} ${size * 0.1},${-size * 0.2}
                 C ${size * 0.25},${-size * 0.2} ${size * 0.25},${-size * 0.05} 0,${size * 0.15} Z"
              fill="url(#heart-gradient)"/>
    </g>
    
    ${maskable ? `<!-- Safe area circle for maskable -->
    <circle cx="${size/2}" cy="${size/2}" r="${(size - padding * 2) / 2 - 10}" 
            fill="none" stroke="white" stroke-width="${size * 0.02}" opacity="0.3"/>` : ''}
</svg>`;
}

// Function to create shortcut icons
function createShortcutSVG(type, size) {
    const symbols = {
        crisis: { text: 'SOS', color: '#FF6B6B' },
        breathing: { text: '◯', color: '#4ECDC4' },
        safety: { text: '✓', color: '#95E77E' }
    };
    
    const symbol = symbols[type] || { text: '❤', color: '#5E92F3' };
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#E8F4FD;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#B3E5FC;stop-opacity:1" />
        </linearGradient>
    </defs>
    
    <rect width="${size}" height="${size}" fill="url(#bg-gradient)"/>
    <text x="${size/2}" y="${size/2}" 
          text-anchor="middle" 
          dominant-baseline="central" 
          font-family="Arial, sans-serif" 
          font-size="${size * 0.3}" 
          font-weight="bold"
          fill="${symbol.color}">${symbol.text}</text>
</svg>`;
}

// Generate all required icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

console.log('Generating PWA icons...');

// Generate regular icons
sizes.forEach(size => {
    const svg = createSVGIcon(size, false);
    const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
    fs.writeFileSync(filename, svg);
    console.log(`Created: icon-${size}x${size}.svg`);
});

// Generate maskable icons
maskableSizes.forEach(size => {
    const svg = createSVGIcon(size, true);
    const filename = path.join(iconsDir, `maskable-icon-${size}x${size}.svg`);
    fs.writeFileSync(filename, svg);
    console.log(`Created: maskable-icon-${size}x${size}.svg`);
});

// Generate shortcut icons
['crisis', 'breathing', 'safety'].forEach(type => {
    const svg = createShortcutSVG(type, 96);
    const filename = path.join(iconsDir, `${type}-96x96.svg`);
    fs.writeFileSync(filename, svg);
    console.log(`Created: ${type}-96x96.svg`);
});

console.log('\nIcon generation complete!');
console.log('Note: SVG icons have been created. For better compatibility, you may want to convert these to PNG format.');