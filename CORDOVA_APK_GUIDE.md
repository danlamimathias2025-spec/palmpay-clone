# Turn PalmPay Web App into an Android APK using Apache Cordova

This guide explains how to package this React/Vite web application into an Android APK using Apache Cordova.

---

## Prerequisites
Before compiling the APK on your machine or server, ensure you have:
1. **Node.js** (v18 or higher)
2. **Java JDK** (JDK 17 recommended)
3. **Android Studio & Android SDK** (API level 33 or 34, Android Build-Tools)
4. **Gradle** (v8.x or provided by Cordova)

---

## Step 1: Install Cordova Globally
```bash
npm install -g cordova
```

---

## Step 2: Build the Web App Assets
Run the build script to compile the React application with relative base paths into the `www/` directory:
```bash
npm run build:cordova
```

---

## Step 3: Add Android Platform
Add the modern Android platform engine to Cordova:
```bash
cordova platform add android@13.0.0
```

---

## Step 4: Add Recommended Native Plugins
Install native device plugins for status bar, splash screen, biometrics, and network permissions:
```bash
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-splashscreen
cordova plugin add cordova-plugin-whitelist
cordova plugin add cordova-plugin-fingerprint-aio
cordova plugin add cordova-plugin-vibration
```

---

## Step 5: Build the Android APK

### A. Debug APK (For immediate testing on any phone)
```bash
cordova build android --debug
```
The compiled APK will be generated at:
`platforms/android/app/build/outputs/apk/debug/app-debug.apk`

### B. Release APK (For production & distribution)
```bash
cordova build android --release -- --packageType=apk
```
The release APK will be generated at:
`platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## Step 6: Install & Run on Connected Device
Connect your Android phone via USB with USB Debugging enabled, then run:
```bash
cordova run android
```

---

## Key Features Configured for Cordova APK:
- **`config.xml`**: Pre-configured with package ID `com.palmpay.mobile`, Android 14 (API 34) support, hardware back button handlers, and required Android permissions.
- **`vite.config.ts`**: Configured with `base: './'` for proper file resolution inside `file:///android_asset/www/`.
- **`index.html`**: Embedded offline splash screen + automatic `cordova.js` bridge detection.
- **`useCordova` Hook**: Handles Android hardware back button (modal dismissal & navigation) and native status bar theming.
