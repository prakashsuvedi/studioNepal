#!/usr/bin/env bash
set -e

echo "=== NepalAI Studio Android Build & Packaging Pipeline ==="
echo "Target: Android API 36 (Android 16)"
echo "Package ID: com.nepalai.studio"

# 1. Verify Node and npm
echo "[1/5] Building frontend production bundle..."
npm run build

# 2. Sync to Capacitor Android native assets
echo "[2/5] Syncing assets to native Android project..."
npx cap sync android

# 3. Check Java & Android SDK availability
if ! command -v java &> /dev/null; then
    echo "ERROR: Java (OpenJDK 17 or 21) is required to compile Android binaries."
    echo "Please install OpenJDK 17/21 and Android SDK command-line tools."
    echo "For Ubuntu/Debian: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 1
fi

echo "[3/5] Compiling Android native binaries with Gradle..."
cd android
chmod +x gradlew

# Build Debug APK
./gradlew assembleDebug

# Build Release APK
./gradlew assembleRelease

# Build Production AAB for Google Play Store
./gradlew bundleRelease

cd ..

# 4. Copy to decoupled release storage
echo "[4/5] Publishing release artifact to decoupled storage..."
mkdir -p data/releases

if [ -f "android/app/build/outputs/apk/release/app-release-unsigned.apk" ]; then
    cp android/app/build/outputs/apk/release/app-release-unsigned.apk data/releases/nepalai-studio.apk
elif [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    cp android/app/build/outputs/apk/debug/app-debug.apk data/releases/nepalai-studio.apk
fi

# 5. Compute and display integrity checksum
if [ -f "data/releases/nepalai-studio.apk" ]; then
    echo "[5/5] Artifact ready! Computing SHA-256 checksum..."
    sha256sum data/releases/nepalai-studio.apk > data/releases/nepalai-studio.apk.sha256
    echo "Artifact: data/releases/nepalai-studio.apk"
    echo "SHA-256: $(cat data/releases/nepalai-studio.apk.sha256)"
    echo "File Size: $(ls -lh data/releases/nepalai-studio.apk | awk '{print $5}')"
    echo "Endpoint: /downloads/nepalai-studio.apk is now ACTIVE"
fi

echo "=== Build Complete ==="
