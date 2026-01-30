const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const inputFile = path.join(__dirname, '../public/logo.png');
  const outputDir = path.join(__dirname, '../public');

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error('Error: logo.png not found in public directory');
    process.exit(1);
  }

  try {
    // Generate 192x192 icon
    await sharp(inputFile)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'logo-192.png'));
    console.log('✓ Generated logo-192.png');

    // Generate 512x512 icon
    await sharp(inputFile)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'logo-512.png'));
    console.log('✓ Generated logo-512.png');

    console.log('\n✅ All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
