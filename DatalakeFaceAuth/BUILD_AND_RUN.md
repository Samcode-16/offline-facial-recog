# Step 17 — Build and Run Instructions

This guide covers compiling and running the DatalakeFaceAuth application on iOS and Android.

---

## Prerequisites

Ensure all steps 1-16 are complete:

- ✅ npm packages installed
- ✅ TypeScript source files created
- ✅ Native bridge modules (Android/iOS)
- ✅ Models downloaded to `models/` directory
- ✅ Android Manifest configured
- ✅ iOS Info.plist configured
- ✅ Babel and Metro configured
- ✅ .env file created with AWS credentials

---

## Step 1: Download Models

Download the required TensorFlow Lite models before building:

```bash
cd scripts
chmod +x download_models.sh
./download_models.sh
cd ..
```

**Models downloaded to:** `models/`

- `blazeface.tflite` (face detection)
- `face_mesh.tflite` (landmarks)
- `mobilefacenet.tflite` (embeddings)
- `antispy_l.tflite` (anti-spoofing low-res)
- `antispy_h.tflite` (anti-spoofing high-res)

If download fails, manually place `.tflite` files in `models/` directory or contact the development team.

---

## iOS Build

### 1. Install Dependencies

```bash
cd ios
pod install
cd ..
```

**Expected output:** Pods installed successfully

**Troubleshooting:**

- If pod install fails, try: `pod repo update && pod install`
- Clear cache: `rm -rf Pods && pod install`
- Check Xcode version: Xcode 14.0+ required

### 2. Build and Run

```bash
npx react-native run-ios
```

**Expected behavior:**

- Metro bundler starts on port 8081
- Xcode builds the app
- Simulator launches (iPhone 14 Pro default)
- App starts with loading spinner
- After 3-5 seconds, home screen appears with "Mark Attendance" and "Register Face" buttons

**Troubleshooting:**

#### TFLite Link Errors

```
error: module compiled with Swift 5.9 but target supports Swift 5.8
```

**Fix:**

- In Xcode: Build Settings → Swift Language Version → 5.9
- Or update Xcode to latest version

#### TFLite Pod Not Found

```
error: 'TensorFlowLiteC/TensorFlowLiteC.h' file not found
```

**Fix:**

- Verify Podfile has: `pod 'TensorFlowLiteC'`
- Run: `pod install --repo-update`
- Restart Xcode: `xcode-select --install`

#### Worklet/Reanimated Errors

```
Reanimated: error while parsing reanimated value
```

**Fix:**

- Verify Babel config has `react-native-worklets-core/plugin` as FIRST plugin
- Clear: `rm -rf node_modules && npm install`
- Rebuild: `npx react-native run-ios --verbose`

#### CocoaPods Version Mismatch

```
Specs satisfying the `React` dependency could not be found
```

**Fix:**

- Update CocoaPods: `sudo gem install cocoapods`
- Run: `pod setup`
- Retry: `pod install`

---

## Android Build

### 1. Build APK

```bash
npx react-native run-android
```

**Expected behavior:**

- Gradle builds the project
- APK is compiled and installed on connected device/emulator
- App launches with loading spinner
- After 3-5 seconds, home screen appears

**Troubleshooting:**

#### TFLite Link Errors

```
error: cannot find -ltensorflowlite
```

**Fix:**

- Verify `android/app/build.gradle` has:
  ```gradle
  implementation 'org.tensorflow:tensorflow-lite:2.14.0'
  implementation 'org.tensorflow:tensorflow-lite-support:0.4.4'
  ```
- Run: `./gradlew clean build`

#### MultiDex Errors

```
java.lang.RuntimeException: Unable to execute dex
```

**Fix:**

- Add to `android/app/build.gradle`:
  ```gradle
  android {
      defaultConfig {
          multiDexEnabled true
      }
  }
  ```

#### Metro Cannot Find .tflite Files

```
error: Cannot find asset 'blazeface.tflite'
```

**Fix:**

- Verify `metro.config.js` has:
  ```javascript
  assetExts: [...defaultAssetExts, "tflite", "onnx"];
  ```
- Place model files in `models/` directory
- Clear Metro cache: `npx react-native start --reset-cache`

#### React Native Config Not Reading .env

```
process.env.AWS_ACCESS_KEY_ID is undefined
```

**Fix:**

- Ensure `.env` file exists at project root (not in .gitignore)
- Format: `AWS_ACCESS_KEY_ID=xxx` (no quotes)
- Restart Metro: `npx react-native start --reset-cache`
- Rebuild: `npx react-native run-android`

#### Gradle Build Cache Issues

```
Gradle sync failed
```

**Fix:**

```bash
./gradlew clean
./gradlew build
```

#### Java Version Mismatch

```
error: invalid source release 11
```

**Fix:**

- Add to `android/app/build.gradle`:
  ```gradle
  android {
      compileOptions {
          sourceCompatibility JavaVersion.VERSION_11
          targetCompatibility JavaVersion.VERSION_11
      }
  }
  ```

### 2. Build Release APK (for Production)

```bash
cd android
./gradlew assembleRelease
cd ..
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

---

## Testing the Build

### 1. Verify App Launches

- [ ] App shows loading spinner on start
- [ ] After 3-5 seconds, home screen appears
- [ ] No red error banner

### 2. Test Camera Permission

- [ ] Grant camera permission when prompted
- [ ] "Mark Attendance" button navigates to camera
- [ ] Oval guide appears with pulsing animation

### 3. Test Offline Mode

- [ ] Turn off network (airplane mode)
- [ ] App continues to work (face detection, enrollment)
- [ ] Records marked as pending in SQLite
- [ ] SyncBadge shows pending count

### 4. Test Enrollment (if faces already enrolled)

- [ ] Select employee from dropdown
- [ ] Camera shows numbered guide "Photo 1 of 5"
- [ ] Auto-capture occurs when face is stable
- [ ] After 5 captures, success message appears

### 5. Verify Models Loaded

- [ ] First auth attempt is slow (models loading)
- [ ] Subsequent attempts are fast (models cached)

---

## Debugging

### Enable Debug Overlay

Set in `src/utils/Constants.ts`:

```typescript
export const ENABLE_DEBUG_OVERLAY = true;
```

**Shows:**

- FPS counter
- Frame processing times (ms)
- Face detection confidence
- Liveness challenge status
- Current UI stage

### View Console Logs

**iOS:**

```bash
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "DatalakeFaceAuth"' 2>&1 | grep -i "datalakefaceauth"
```

**Android:**

```bash
adb logcat | grep "DatalakeFaceAuth"
```

### Network Monitoring

- Open DevTools: `cmd+D` (iOS) or `cmd+M` (Android)
- Select "Show Network Inspector"
- Monitor S3 upload calls

### Database Inspection

**iOS (via Xcode):**

- Window → Devices and Simulators
- Simulator → Application Container → DatalakeFaceAuth
- Download Container
- Open `Documents/datalake_faceauth.db` with SQLite viewer

**Android (via adb):**

```bash
adb pull /data/data/com.datalakefaceauth/databases/datalake_faceauth.db
# Open with SQLite viewer
```

---

## Performance Profiling

### Measure Pipeline Speed

In `useFaceAuth.ts`, log timing:

```typescript
const startTime = Date.now();
// ... run detection, liveness, recognition
const elapsedMs = Date.now() - startTime;
console.log(`[useFaceAuth] Full pipeline: ${elapsedMs}ms`);
```

**Target:** < 800ms total

### Profile Individual Steps

Add timing around each module:

```typescript
const t1 = Date.now();
const detected = await faceDetector.detect(frame);
console.log(`[Timing] Detection: ${Date.now() - t1}ms`);
```

**Targets:**

- Face detection: < 15ms
- Face mesh: < 35ms
- Anti-spoof: < 100ms
- Embedding extraction: < 80ms

---

## Common Issues and Solutions

| Issue                                      | Cause                        | Solution                                             |
| ------------------------------------------ | ---------------------------- | ---------------------------------------------------- |
| Black screen on startup                    | Models not downloaded        | Run `scripts/download_models.sh`                     |
| "Module not found" error                   | Missing npm package          | `npm install` or `npm install --legacy-peer-deps`    |
| App crashes on auth                        | Native bridge not registered | Check `android/app/build.gradle` or iOS native files |
| Blank camera                               | Permission denied            | Grant camera permission in Settings                  |
| Attendance records sync with 0 MB uploaded | S3 credentials invalid       | Check `.env` file AWS keys                           |
| Metro bundler fails                        | Port 8081 in use             | `lsof -i :8081` then `kill -9 <PID>`                 |

---

## Next Steps

1. **Enroll test faces** using EnrollmentScreen
2. **Test authentication** on enrolled faces
3. **Record attendance** and verify SQLite entries
4. **Disconnect network** and test sync pending behavior
5. **Reconnect network** and verify sync completes
6. **Profile performance** on target device (Snapdragon 665 class)

---

## Release Checklist

Before releasing to users:

- [ ] All edge cases handled (see EDGE_CASES.md)
- [ ] Performance targets met (see Step 18)
- [ ] Models correctly bundled (< 20 MB total)
- [ ] AWS S3 credentials configured for production bucket
- [ ] Camera and location permissions working
- [ ] Database migrations tested on fresh install
- [ ] Sync tested with unreliable network (enable throttling in dev tools)
- [ ] Tested on target device (Snapdragon 665), not just emulator
- [ ] Battery drain acceptable (models run efficiently on CPU only)
- [ ] No console errors or warnings
