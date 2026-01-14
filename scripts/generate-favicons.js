/**
 * Favicon Generator Script
 * Converts SVG favicons to PNG format
 * 
 * Usage:
 *   npm install sharp
 *   node scripts/generate-favicons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const publicDir = path.join(__dirname, '..', 'public');

const conversions = [
  {
    input: 'favicon-16x16.svg',
    output: 'favicon-16x16.png',
    size: 16,
    description: 'Small browser tab icon'
  },
  {
    input: 'favicon-32x32.svg',
    output: 'favicon-32x32.png',
    size: 32,
    description: 'Standard browser tab icon'
  },
  {
    input: 'apple-touch-icon.svg',
    output: 'apple-touch-icon.png',
    size: 180,
    description: 'iOS home screen icon'
  },
  {
    input: 'android-chrome-192x192.svg',
    output: 'android-chrome-192x192.png',
    size: 192,
    description: 'Android icon (small)'
  },
  {
    input: 'android-chrome-512x512.svg',
    output: 'android-chrome-512x512.png',
    size: 512,
    description: 'Android icon (large)'
  }
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║   ABSpider Favicon Generator          ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error(`${colors.red}✗ Error: 'sharp' package not found${colors.reset}`);
  console.log(`${colors.yellow}  Please install it first:${colors.reset}`);
  console.log(`  npm install sharp\n`);
  process.exit(1);
}

// Generate favicons
let successCount = 0;
let errorCount = 0;

async function generateFavicons() {
  console.log(`${colors.cyan}Starting favicon generation...${colors.reset}\n`);

  for (const config of conversions) {
    const inputPath = path.join(publicDir, config.input);
    const outputPath = path.join(publicDir, config.output);

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`${colors.red}✗ ${config.input} not found${colors.reset}`);
      errorCount++;
      continue;
    }

    try {
      await sharp(inputPath)
        .resize(config.size, config.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);

      console.log(`${colors.green}✓ ${config.output}${colors.reset}`);
      console.log(`  ${colors.cyan}${config.description} (${config.size}x${config.size})${colors.reset}`);
      successCount++;
    } catch (error) {
      console.error(`${colors.red}✗ Error generating ${config.output}:${colors.reset}`);
      console.error(`  ${error.message}`);
      errorCount++;
    }
  }

  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✓ Successfully generated: ${successCount}${colors.reset}`);
  if (errorCount > 0) {
    console.log(`${colors.red}✗ Failed: ${errorCount}${colors.reset}`);
  }
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  // Additional instructions
  if (successCount > 0) {
    console.log(`${colors.yellow}Next steps:${colors.reset}`);
    console.log(`1. Clear browser cache (Ctrl+Shift+Delete)`);
    console.log(`2. Hard refresh (Ctrl+Shift+R)`);
    console.log(`3. Verify favicon appears in browser tab`);
    console.log(`4. Test on mobile devices\n`);
  }

  // Generate favicon.ico (optional)
  console.log(`${colors.cyan}Optional: Generate favicon.ico${colors.reset}`);
  console.log(`Run: convert favicon-16x16.png favicon-32x32.png favicon.ico\n`);
}

// Run the generator
generateFavicons().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
