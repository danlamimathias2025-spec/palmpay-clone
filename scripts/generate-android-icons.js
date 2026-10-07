import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImage = fs.existsSync(path.resolve('public/palmpay_official_icon.png'))
  ? path.resolve('public/palmpay_official_icon.png')
  : path.resolve('public/icon-512.png');

console.log(`Using source image for Android icons: ${sourceImage}`);

const resDir = path.resolve('android/app/src/main/res');

const iconSizes = [
  { folder: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { folder: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { folder: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { folder: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { folder: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
];

async function generateIcons() {
  if (!fs.existsSync(resDir)) {
    console.warn(`Target Android res directory does not exist at ${resDir}. Skipping icon injection.`);
    return;
  }

  for (const { folder, launcher, foreground } of iconSizes) {
    const targetFolder = path.join(resDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // 1. Standard ic_launcher.png
    await sharp(sourceImage)
      .resize(launcher, launcher, { fit: 'cover' })
      .toFile(path.join(targetFolder, 'ic_launcher.png'));

    // 2. Round ic_launcher_round.png
    const circleSvg = Buffer.from(
      `<svg><circle cx="${launcher / 2}" cy="${launcher / 2}" r="${launcher / 2}" fill="#fff"/></svg>`
    );

    const resized = await sharp(sourceImage)
      .resize(launcher, launcher, { fit: 'cover' })
      .toBuffer();

    await sharp(resized)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

    // 3. Adaptive ic_launcher_foreground.png
    await sharp(sourceImage)
      .resize(foreground, foreground, { fit: 'cover' })
      .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));

    console.log(`✓ Generated icons for ${folder} (${launcher}x${launcher})`);
  }

  console.log('Successfully generated all PalmPay Android app launcher icons!');
}

generateIcons().catch((err) => {
  console.error('Error generating Android icons:', err);
  process.exit(1);
});
