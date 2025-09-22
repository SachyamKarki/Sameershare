#!/bin/bash

# Professional Android Build Script for LFG Alarm App
# This script ensures all components are properly set up before building

echo "🚀 Starting Professional Android Build Process..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Project root confirmed ✓"

# Step 1: Clean previous builds
print_status "Step 1: Cleaning previous builds..."
if [ -d "android/app/build" ]; then
    rm -rf android/app/build
    print_success "Cleaned android/app/build"
fi

if [ -d "android/build" ]; then
    rm -rf android/build
    print_success "Cleaned android/build"
fi

# Step 2: Ensure LFG audio asset is in place
print_status "Step 2: Verifying LFG audio asset..."
if [ ! -f "android/app/src/main/assets/audio/lfg_default.mp3" ]; then
    print_warning "LFG audio asset not found in Android assets. Creating..."
    mkdir -p android/app/src/main/assets/audio
    if [ -f "assets/audio/lfg_default.mp3" ]; then
        cp assets/audio/lfg_default.mp3 android/app/src/main/assets/audio/
        print_success "LFG audio asset copied to Android assets"
    else
        print_error "LFG audio asset not found in assets/audio/"
        exit 1
    fi
else
    print_success "LFG audio asset verified ✓"
fi

# Step 3: Verify Android manifest
print_status "Step 3: Verifying AndroidManifest.xml..."
if grep -q "NativeAlarmPackage" android/app/src/main/java/com/shakshamkarki/practice/MainApplication.kt; then
    print_success "NativeAlarmPackage registered in MainApplication ✓"
else
    print_error "NativeAlarmPackage not found in MainApplication.kt"
    exit 1
fi

if grep -q "AlarmAudioService" android/app/src/main/AndroidManifest.xml; then
    print_success "AlarmAudioService declared in AndroidManifest.xml ✓"
else
    print_error "AlarmAudioService not found in AndroidManifest.xml"
    exit 1
fi

# Step 4: Install dependencies
print_status "Step 4: Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed ✓"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 5: Clean and prepare Android
print_status "Step 5: Preparing Android project..."
cd android
./gradlew clean
if [ $? -eq 0 ]; then
    print_success "Android project cleaned ✓"
else
    print_error "Failed to clean Android project"
    exit 1
fi

# Step 6: Build debug APK
print_status "Step 6: Building debug APK..."
./gradlew assembleDebug
if [ $? -eq 0 ]; then
    print_success "Debug APK built successfully ✓"
    print_status "APK location: android/app/build/outputs/apk/debug/app-debug.apk"
else
    print_error "Failed to build debug APK"
    exit 1
fi

cd ..

# Step 7: Final verification
print_status "Step 7: Final verification..."
if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    print_success "Build completed successfully! 🎉"
    print_status "You can now install the APK on your device or emulator"
    print_status "Run: adb install android/app/build/outputs/apk/debug/app-debug.apk"
else
    print_error "APK not found after build"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Install the APK on your device: adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo "2. Grant all required permissions in Settings → Apps → Practice"
echo "3. Test the alarm functionality"
echo "4. Check the logs: adb logcat | grep -E '(AlarmReceiver|AlarmAudioService|NativeAlarmModule)'"
echo ""
print_success "Professional Android build process completed! 🚀"