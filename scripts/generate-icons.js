#!/usr/bin/env node
// scripts/generate-icons.js
// Run: node scripts/generate-icons.js
// Requires: npm install sharp --save-dev

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
    sharp = require('sharp');
} catch {
    console.log('\n❌ sharp not installed. Run: npm install sharp --save-dev\n');
    console.log('Then run this script again: node scripts/generate-icons.js\n');
    process.exit(1);
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('📁 Created public/icons/ directory');
}

// SVG icon for DailyAI — purple background with ⚡ bolt
function generateSVG(size) {
    const padding = Math.round(size * 0.15);
    const boltSize = Math.round(size * 0.55);
    const boltX = Math.round((size - boltSize) / 2);
    const boltY = Math.round((size - boltSize) / 2);
    const radius = Math.round(size * 0.22);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#9f5bff"/>
    </linearGradient>
    <linearGradient id="bolt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#e0d4ff"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${Math.round(size * 0.025)}" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  
  <!-- Subtle inner highlight -->
  <rect width="${size}" height="${Math.round(size * 0.5)}" rx="${radius}" 
        fill="rgba(255,255,255,0.08)"/>
  
  <!-- Lightning bolt ⚡ -->
  <text 
    x="${size / 2}" 
    y="${size / 2 + Math.round(size * 0.18)}" 
    font-size="${boltSize}" 
    text-anchor="middle" 
    filter="url(#glow)"
  >⚡</text>
</svg>`;
}

async function generateIcons() {
    console.log('\n⚡ Generating DailyAI PWA icons...\n');

    for (const size of SIZES) {
        const svg = generateSVG(size);
        const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

        try {
            await sharp(Buffer.from(svg))
                .resize(size, size)
                .png({ quality: 95 })
                .toFile(outputPath);

            console.log(`  ✅ icon-${size}x${size}.png`);
        } catch (err) {
            console.error(`  ❌ Failed ${size}x${size}:`, err.message);
        }
    }

    console.log('\n🎉 All icons generated in public/icons/\n');
    console.log('Next steps:');
    console.log('  1. Copy the updated files into your project');
    console.log('  2. Run your dev server: npm run dev');
    console.log('  3. Open on Android Chrome and tap "Add to Home Screen"\n');
}

generateIcons();