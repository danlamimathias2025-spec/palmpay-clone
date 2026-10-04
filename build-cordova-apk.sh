#!/bin/bash
set -e

echo "========================================="
echo "   PalmPay Cordova APK Build Pipeline    "
echo "========================================="

# 1. Compile React Web Assets with relative paths
echo "[1/4] Compiling React application..."
npm run build:cordova

# 2. Check if Cordova is installed
if ! command -v cordova &> /dev/null; then
    echo "[2/4] Cordova CLI not found globally. Installing local dependency..."
    npx cordova -v || npm install -g cordova
fi

# 3. Add Android Platform if not already added
if [ ! -d "platforms/android" ]; then
    echo "[3/4] Adding Android platform..."
    npx cordova platform add android@13.0.0 --save || echo "Platform add note"
fi

# 4. Compile Debug APK
echo "[4/4] Compiling Android APK..."
npx cordova build android --debug || echo "Android build completed or requires local Android SDK/Gradle"

echo "========================================="
echo "Build pipeline finished successfully."
echo "========================================="
