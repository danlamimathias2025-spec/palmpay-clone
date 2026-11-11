import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Primary source: User-provided authentic PalmPay brand asset
const userAsset = path.resolve('public/assets/aistudio/download__1__15dfc463.png');
const fallbackAsset = path.resolve('public/assets/banks/palmpay.png');
const sourceFile = fs.existsSync(userAsset) ? userAsset : fallbackAsset;

console.log(`[Icon Generation] Using authentic source asset: ${sourceFile}`);

/**
 * Creates an ultra-clean transparent version of the PalmPay logo:
 * Uses flood-fill from outer corners so outer white background becomes transparent,
 * while preserving the interior white interlocking lines and diamond perfectly.
 */
async function createTransparentLogo() {
  const { data, info } = await sharp(sourceFile)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const isOuterWhite = new Uint8Array(width * height);
  const queue = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];

  for (const [sx, sy] of queue) {
    isOuterWhite[sy * width + sx] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = ny * width + nx;
        if (!isOuterWhite[idx]) {
          const pixelIdx = idx * 3;
          const r = data[pixelIdx],
            g = data[pixelIdx + 1],
            b = data[pixelIdx + 2];
          if (r > 235 && g > 235 && b > 235) {
            isOuterWhite[idx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = isOuterWhite[i] ? 0 : 255;
  }

  const transparentBuffer = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();

  return transparentBuffer;
}

const iconSizes = [
  { folder: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { folder: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { folder: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { folder: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { folder: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
];

async function generateAllIcons() {
  const transparentLogo = await createTransparentLogo();

  // 1. Update web public assets (PWA, Favicon, Touch Icons)
  await sharp(transparentLogo)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toFile(path.resolve('public/icon-512.png'));

  await sharp(transparentLogo)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toFile(path.resolve('public/icon-192.png'));

  await sharp(transparentLogo)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toFile(path.resolve('public/apple-touch-icon.png'));

  await sharp(transparentLogo)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toFile(path.resolve('public/palmpay_official_icon.png'));

  await sharp(transparentLogo).toFile(path.resolve('public/assets/banks/palmpay.png'));

  console.log('✓ Updated public PWA and web branding assets');

  // 2. Android App Resources
  const resDir = path.resolve('android/app/src/main/res');
  if (!fs.existsSync(resDir)) {
    console.warn(`[Icon Generation] Android directory does not exist yet at ${resDir}. (Will run during build)`);
    return;
  }

  // A. Ensure values/colors.xml has #ffffff background (NO Capacitor blue!)
  const valuesDir = path.join(resDir, 'values');
  if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });

  // Prevent duplicate resource merge error in Gradle (AAPT2) by removing standalone ic_launcher_background.xml
  const duplicateBgXml = path.join(valuesDir, 'ic_launcher_background.xml');
  if (fs.existsSync(duplicateBgXml)) {
    fs.unlinkSync(duplicateBgXml);
    console.log('✓ Removed duplicate ic_launcher_background.xml to avoid Gradle resource collision');
  }

  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#ffffff</color>
    <color name="colorPrimary">#6c1cf5</color>
    <color name="colorPrimaryDark">#5512c9</color>
    <color name="colorAccent">#6c1cf5</color>
</resources>
`;
  fs.writeFileSync(path.join(valuesDir, 'colors.xml'), colorsXml, 'utf8');

  // Ensure styles.xml exists with AppTheme and AppTheme.NoActionBarLaunch
  const stylesXmlPath = path.join(valuesDir, 'styles.xml');
  if (!fs.existsSync(stylesXmlPath)) {
    const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
    </style>

    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
        <item name="android:background">@color/ic_launcher_background</item>
    </style>
</resources>
`;
    fs.writeFileSync(stylesXmlPath, stylesXml, 'utf8');
  }

  // Ensure strings.xml has authentic PalmPay branding
  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">PalmPay</string>
    <string name="title_activity_main">PalmPay</string>
    <string name="package_name">com.palmpay.app</string>
    <string name="custom_url_scheme">com.palmpay.app</string>
</resources>
`;
  fs.writeFileSync(path.join(valuesDir, 'strings.xml'), stringsXml, 'utf8');

  // B. Ensure mipmap-anydpi-v26 contains the adaptive icon specifications
  const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });

  const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveIconXml, 'utf8');
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveIconXml, 'utf8');

  // C. Generate densities
  for (const { folder, launcher, foreground } of iconSizes) {
    const targetFolder = path.join(resDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // 1. ic_launcher.png (Legacy launcher square icon on white rounded background)
    const logoScale = Math.round(launcher * 0.78);
    const logoResized = await sharp(transparentLogo)
      .resize(logoScale, logoScale, { fit: 'contain' })
      .toBuffer();

    await sharp({
      create: {
        width: launcher,
        height: launcher,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: logoResized, gravity: 'center' }])
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher.png'));

    // 2. ic_launcher_round.png (Circular legacy icon)
    const circleSvg = Buffer.from(
      `<svg><circle cx="${launcher / 2}" cy="${launcher / 2}" r="${launcher / 2}" fill="#fff"/></svg>`
    );
    const roundBase = await sharp({
      create: {
        width: launcher,
        height: launcher,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: logoResized, gravity: 'center' },
        { input: circleSvg, blend: 'dest-in' },
      ])
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

    // 3. ic_launcher_foreground.png (Adaptive icon foreground: 108dp canvas, safe-zone ~68%)
    // The safe zone for adaptive icons is a 72dp diameter circle centered in the 108dp canvas.
    // Sizing the logo to 68% guarantees it will never be cropped on Samsung, Pixel, Xiaomi, etc.
    const adaptiveLogoSize = Math.round(foreground * 0.68);
    const adaptiveLogo = await sharp(transparentLogo)
      .resize(adaptiveLogoSize, adaptiveLogoSize, { fit: 'contain' })
      .toBuffer();

    await sharp({
      create: {
        width: foreground,
        height: foreground,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent canvas
      },
    })
      .composite([{ input: adaptiveLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));

    console.log(`✓ Generated official PalmPay icons for ${folder} (${launcher}x${launcher})`);
  }

  console.log(' Successfully generated all authentic PalmPay Android app launcher icons!');
}

generateAllIcons().catch((err) => {
  console.error('Error generating Android icons:', err);
  process.exit(1);
});
