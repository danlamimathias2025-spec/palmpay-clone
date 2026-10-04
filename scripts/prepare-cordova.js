/**
 * Prepare Cordova Distribution Directory
 * Copies the built React web assets into Cordova's www/ directory.
 */
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const wwwDir = path.resolve('www');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

console.log('Preparing Cordova www/ bundle...');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ directory not found. Please run vite build first.');
  process.exit(1);
}

if (fs.existsSync(wwwDir)) {
  fs.rmSync(wwwDir, { recursive: true, force: true });
}
fs.mkdirSync(wwwDir, { recursive: true });

// Copy built client assets into www/
copyRecursiveSync(distDir, wwwDir);

// Verify index.html exists in www/
if (fs.existsSync(path.join(wwwDir, 'index.html'))) {
  console.log('Successfully prepared Cordova www/ assets for Android APK compilation!');
} else {
  console.warn('Warning: index.html not found in www/.');
}
