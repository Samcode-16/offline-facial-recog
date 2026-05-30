# DatalakeFaceAuth — Complete Build Specification

## Project Summary

**DatalakeFaceAuth** is a production-ready, cross-platform React Native mobile application that authenticates field personnel using **offline facial recognition** and **liveness detection**. The app works with zero internet connection. All AI inference runs entirely on-device using TensorFlow Lite. Attendance records are stored locally in SQLite and synced to AWS S3 when connectivity is restored.

This is a **self-contained module** designed for integration into Datalake 3.0. It uses a clean adapter pattern (`EmployeeBridge.ts`) so that when Datalake 3.0 source code is available, only **7 minimal changes** are required to integrate it.

---

## Non-Negotiable Constraints

| Constraint    | Exact Requirement                              |
| ------------- | ---------------------------------------------- |
| Framework     | React Native (Android & iOS from one codebase) |
| Model size    | All models ≤ 20 MB (currently 8.25 MB)         |
| Speed         | < 1 second total pipeline on Snapdragon 665    |
| Offline       | Zero network calls for inference               |
| Hardware      | CPU only. Android 8.0+ (API 26), iOS 12+       |
| Accuracy      | > 95% face recognition accuracy                |
| Open source   | No paid SDKs                                   |
| Liveness      | Blink, smile, head-turn challenges             |
| Anti-spoofing | Rejects photos and screen displays             |
| Sync          | Records sync to AWS S3 with acknowledgment     |
| Purge         | Safe deletion only after confirmed ACK         |

---

## Directory Structure

```
DatalakeFaceAuth/
├── README.md (this file)
├── BUILD_AND_RUN.md (step-by-step build instructions)
├── EDGE_CASES.md (all 30+ error scenarios)
├── PERFORMANCE_TARGETS.md (benchmarking guide)
├── DATALAKE_3_INTEGRATION.md (integration 7-step guide)
├── index.js (app entry point)
├── package.json (npm dependencies)
├── tsconfig.json (TypeScript config)
├── babel.config.js (Babel with worklets first)
├── metro.config.js (Metro with .tflite support)
├── .env (AWS credentials template)
├── .gitignore
│
├── src/
│   ├── App.tsx (initialization sequence)
│   │
│   ├── bridges/
│   │   └── EmployeeBridge.ts (ONLY integration point)
│   │
│   ├── types/ (TypeScript interfaces)
│   │   ├── Face.ts
│   │   ├── Attendance.ts
│   │   ├── Liveness.ts
│   │   └── Navigation.ts
│   │
│   ├── utils/ (constants and helpers)
│   │   ├── Constants.ts (50+ centralized values)
│   │   ├── EmbeddingUtils.ts (L2 norm, cosine similarity)
│   │   ├── LightingCorrector.ts (CLAHE for poor lighting)
│   │   ├── SecurityUtils.ts (AES-256 encryption)
│   │   └── PerformanceProfiler.ts (timing instrumentation)
│   │
│   ├── core/ (AI inference modules)
│   │   ├── FaceDetector.ts (BlazeFace)
│   │   ├── FaceRecognizer.ts (MobileFaceNet)
│   │   ├── BlinkDetector.ts (Eye Aspect Ratio)
│   │   ├── SmileDetector.ts (mouth width increase)
│   │   ├── HeadPoseEstimator.ts (yaw calculation)
│   │   ├── LivenessOrchestrator.ts (challenge state machine)
│   │   ├── AntiSpoofDetector.ts (Silent-Face dual-scale)
│   │   ├── EmbeddingCache.ts (in-memory ~1 MB)
│   │   └── EmbeddingMatcher.ts (cosine similarity matching)
│   │
│   ├── database/ (SQLite operations)
│   │   ├── schemas.ts (CREATE TABLE statements)
│   │   ├── DatabaseManager.ts (lifecycle)
│   │   ├── FaceRepository.ts (enrollment CRUD)
│   │   └── AttendanceRepository.ts (records + sync status)
│   │
│   ├── sync/ (cloud synchronization)
│   │   ├── NetworkMonitor.ts (connectivity detection)
│   │   ├── S3Uploader.ts (batch upload with ETag ACK)
│   │   └── SyncManager.ts (orchestration + purge safety)
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx (6-screen stack)
│   │
│   ├── screens/ (UI screens)
│   │   ├── HomeScreen.tsx (main hub with buttons)
│   │   ├── AuthenticationScreen.tsx (full pipeline)
│   │   ├── EnrollmentScreen.tsx (5-capture flow)
│   │   ├── AttendanceListScreen.tsx (records list)
│   │   ├── SyncStatusScreen.tsx (sync info)
│   │   └── SettingsScreen.tsx (app config)
│   │
│   ├── components/ (reusable UI)
│   │   ├── CameraView.tsx (VisionCamera + oval guide)
│   │   ├── FaceOverlay.tsx (bounding box + landmarks)
│   │   ├── LivenessPrompt.tsx (challenge display)
│   │   ├── ProgressRing.tsx (countdown timer)
│   │   ├── SyncBadge.tsx (pending count)
│   │   └── ConfidenceBar.tsx (recognition score)
│   │
│   └── hooks/ (state management)
│       ├── useFaceAuth.ts (14-state orchestrator)
│       ├── useSyncStatus.ts (polling + manual sync)
│       ├── useCamera.ts (VisionCamera lifecycle)
│       └── useLiveness.ts (challenge state machine)
│
├── models/ (TensorFlow Lite models)
│   ├── blazeface.tflite (2.1 MB)
│   ├── face_mesh.tflite (1.9 MB)
│   ├── mobilefacenet.tflite (2.4 MB)
│   ├── antispy_l.tflite (1.0 MB)
│   └── antispy_h.tflite (1.3 MB)
│
├── scripts/
│   └── download_models.sh (fetch from official sources)
│
├── android/
│   ├── app/
│   │   ├── build.gradle (TFLite + multiDex)
│   │   ├── src/main/AndroidManifest.xml (permissions)
│   │   └── src/main/java/com/datalakefaceauth/
│   │       └── FaceRecognitionModule.java (native bridge)
│   └── gradle.properties
│
└── ios/
    ├── Podfile (TensorFlowLiteC pod)
    ├── DatalakeFaceAuth/
    │   ├── Info.plist (camera + location permissions)
    │   ├── FaceRecognitionModule.h (bridge header)
    │   └── FaceRecognitionModule.m (native implementation)
    └── Packages.swift (iOS 17+ SPM config)
```

---

## Technology Stack

### Frontend

- **React Native 0.73.6** — cross-platform mobile
- **TypeScript** — strict type safety
- **React Navigation 6.1.17** — stack-based routing
- **React Native Vision Camera 4.7.3** — camera access + frame processor worklets
- **React Native Worklets Core 1.3.3** — separate thread frame processing
- **React Native Reanimated** — smooth animations

### AI Inference

- **TensorFlow Lite 2.14.0** — CPU-only on-device inference
- **BlazeFace** — 192×192 face detection (~15ms)
- **MediaPipe Face Mesh** — 478 landmarks (~35ms)
- **MobileFaceNet** — 512-dim embeddings (~80ms)
- **Silent-Face** — dual-scale anti-spoofing (~100ms)

### Local Storage

- **SQLite (react-native-sqlite-storage)** — 4 tables with integrity constraints
- **React Native Encrypted Storage** — iOS Keychain / Android Keystore
- **React Native AES Crypto** — AES-256 embedding encryption

### Cloud Sync

- **AWS S3** — batch attendance record upload
- **AWS SDK v2** — S3 PutObject + ETag acknowledgment
- **React Native NetInfo** — connectivity monitoring

### Development

- **Babel** — transpilation with worklets plugin (must be first)
- **Metro** — bundler with .tflite asset support
- **ESLint** — code quality
- **Prettier** — code formatting

---

## Core Concepts

### 1. Offline-First Architecture

- All models bundled as app assets (no network required for inference)
- Face detection, liveness, recognition, anti-spoofing all run on-device
- Attendance records stored immediately in SQLite
- Sync to S3 happens asynchronously when network available
- If network never restores, records remain safely in SQLite

### 2. Singleton Pattern

All managers are singletons (single instance per app):

- `DatabaseManager` — SQLite access
- `EmbeddingCache` — in-memory face embeddings
- `NetworkMonitor` — connectivity listener
- `SyncManager` — S3 upload orchestration
- `LivenessOrchestrator` — challenge state machine

### 3. Adapter Pattern (Datalake 3.0 Integration)

`EmployeeBridge.ts` is the **only** file connecting face auth to external systems:

- `getById()` — lookup employee by ID
- `getAll()` — fetch active employees
- `reportAttendance()` — notify Datalake 3.0 of attendance

Currently uses mock data. When Datalake 3.0 code available, replace only this file.

### 4. State Machine: Authentication Pipeline

```
POSITION_FACE
    ↓ (face detected + valid)
CHALLENGE_ACTIVE (blink/smile/turn/turn)
    ↓ (challenge 1 passed)
CHALLENGE_ACTIVE (different challenge)
    ↓ (challenge 2 passed)
PROCESSING (anti-spoof + recognition)
    ↓
SUCCESS (attendance recorded)
    or
FAILED_* (liveness/spoof/recognition)
    or
LOCKED_OUT (3 failures → 30s lockout)
```

### 5. Fisher-Yates Randomized Challenges

Each liveness session randomly selects 2 challenges:

- Challenge 1: BLINK, SMILE, TURN_LEFT, or TURN_RIGHT
- Challenge 2: Different from Challenge 1, plus turn-left/turn-right are mutually exclusive
- Prevents user memorizing sequence
- 2 challenges = ~6 seconds user interaction time

### 6. Embedding Cache: ~1 MB Capacity

- Pre-loaded on app startup
- Holds 500 embeddings (100 persons × 5 embeddings each)
- 512-dim float32 × 4 bytes × 500 = 1 MB
- Kept in memory (SQLite cannot be read from VisionCamera worklets)
- Reloaded after enrollment completes

### 7. Sync Safety: Confirmed Acknowledgment Before Purge

```
┌─ AttendanceRepository.getPending()
├─ S3Uploader.uploadBatch()
├─ Receive ETag as ackId
├─ AttendanceRepository.markSynced(records, ackId)
├─ AttendanceRepository.purgeSynced() [synced=1 only]
└─ Done

If upload fails → records stay at synced=0
If app crashes → records stay at synced=0, can retry on relaunch
```

---

## AI Pipeline Performance

### Real-Time Frame Processing Loop (30 fps = 33 ms/frame)

```
Frame arrives
    ↓ (~15 ms)
BlazeFace detection
    ↓ (validation: size, centering, confidence)
FaceMesh landmarks (~35 ms)
    ↓ (if liveness active: check blink/smile/yaw)
Update UI
    ↓
Next frame
```

### Per-Authcycle (After Liveness Completes)

```
Collect 3 frames (~100 ms)
    ↓
AntiSpoofDetector.analyzeMultiFrame() (~100 ms)
    ↓
FaceRecognizer.extractEmbedding() (~80 ms)
    ↓
EmbeddingMatcher.match() (~10 ms)
    ↓
SQLite insert + UI update
    ═════════════════════════
    Total: ~300 ms (+ 3-6 sec user interaction for challenges)
```

---

## Key Files by Responsibility

### Configuration (No Magic Numbers)

- **Constants.ts** — 50+ values (thresholds, timeouts, sizes)

### Face Detection & Recognition

- **FaceDetector.ts** — BlazeFace + validation
- **FaceRecognizer.ts** — MobileFaceNet + preprocessing
- **EmbeddingMatcher.ts** — Cosine similarity matching
- **AntiSpoofDetector.ts** — Dual-scale silent-face

### Liveness

- **BlinkDetector.ts** — Eye Aspect Ratio
- **SmileDetector.ts** — Mouth width
- **HeadPoseEstimator.ts** — Yaw angle
- **LivenessOrchestrator.ts** — Challenge state machine

### Data Persistence

- **DatabaseManager.ts** — SQLite lifecycle
- **FaceRepository.ts** — Enrollment CRUD
- **AttendanceRepository.ts** — Records + sync status
- **EmbeddingCache.ts** — In-memory embeddings

### Cloud Sync

- **NetworkMonitor.ts** — Connectivity listener
- **S3Uploader.ts** — Batch upload + ACK
- **SyncManager.ts** — Orchestration + purge safety

### Screens & Hooks

- **AuthenticationScreen.tsx** — Uses `useFaceAuth` hook
- **EnrollmentScreen.tsx** — 5-capture flow
- **useFaceAuth.ts** — Central orchestrator (14 states)
- **useSyncStatus.ts** — SQLite polling + manual sync

---

## Getting Started

### 1. Prerequisites

- Node 18+, npm 9+
- Xcode 14+ (iOS) or Android Studio Dolphin+ (Android)
- CocoaPods 1.12+ (iOS)

### 2. Quick Start

```bash
# Clone repo
cd DatalakeFaceAuth

# Install npm packages
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Download models
chmod +x scripts/download_models.sh
./scripts/download_models.sh

# Configure AWS credentials
cp .env.example .env
# Edit .env with your AWS S3 bucket details

# Run on iOS
npx react-native run-ios

# Or Android
npx react-native run-android
```

### 3. Test Enrollment

1. Tap "Register Face"
2. Select employee
3. Let app auto-capture 5 photos
4. Success message

### 4. Test Authentication

1. Tap "Mark Attendance"
2. Position face in oval
3. Complete 2 random liveness challenges
4. "Attendance Marked" confirms record created

### 5. Test Sync

1. Mark several attendances (offline mode)
2. SyncBadge shows pending count
3. Enable network
4. App auto-syncs to S3

---

## Documentation Files

- **BUILD_AND_RUN.md** — Step-by-step compilation + troubleshooting
- **EDGE_CASES.md** — All 30+ error scenarios + handling code
- **PERFORMANCE_TARGETS.md** — Benchmarking guide + profiling tools
- **DATALAKE_3_INTEGRATION.md** — 7-step integration checklist

---

## Verification Checklist

Before deployment:

- [ ] All npm packages installed without peer conflicts
- [ ] TypeScript compilation with no errors
- [ ] iOS build succeeds with all TFLite pods linked
- [ ] Android build succeeds with multiDex enabled
- [ ] Models downloaded to models/ directory (8.25 MB total)
- [ ] Camera permission works on both platforms
- [ ] Face enrollment captures 5 embeddings correctly
- [ ] Authentication recognizes enrolled faces
- [ ] Anti-spoof rejects photos and screens
- [ ] Liveness challenges randomized (2 per session)
- [ ] Attendance records appear in SQLite
- [ ] Sync uploads to S3 with ETag ACK
- [ ] Purge only deletes synced=1 records
- [ ] Performance targets met on Snapdragon 665 device
- [ ] Edge cases handled (10+ scenarios tested)
- [ ] No console errors or warnings
- [ ] Works offline (no network required for inference)

---

## Troubleshooting

**App crashes on startup:**

- Check `.env` file for AWS credentials
- Run `npm install` again
- Clear Metro cache: `npx react-native start --reset-cache`

**Face detection not working:**

- Verify models downloaded to models/
- Check metro.config.js has 'tflite' in assetExts
- Ensure TensorFlowLite pod installed (iOS) or gradle dep (Android)

**Liveness challenges not showing:**

- Verify `useLiveness.ts` hook is used in AuthenticationScreen
- Check `LivenessPrompt.tsx` component renders correctly
- Check browser console for errors

**Sync not uploading:**

- Verify AWS S3 bucket exists and credentials are correct in .env
- Check network is actually online (test internet.com reachability)
- Look for errors in console: `[S3Uploader] Error:`

**Performance slow (> 800 ms):**

- Profile on target device (Snapdragon 665), not emulator
- Check device storage (low storage causes GC pauses)
- Reduce model input sizes or increase inference threads

---

## License & Credits

All models and packages are open source:

- BlazeFace: Google MediaPipe (Apache 2.0)
- Face Mesh: Google MediaPipe (Apache 2.0)
- MobileFaceNet: Zhang et al. (MIT)
- Silent-Face: Silent Face Anti-Spoofing Challenge dataset (public)
- TensorFlow Lite: Google (Apache 2.0)
- React Native: Meta (MIT)

No paid SDKs used. Fully open source.

---

## Contact & Support

For questions about:

- **Build issues:** See BUILD_AND_RUN.md → Troubleshooting
- **Edge cases:** See EDGE_CASES.md implementation checklist
- **Performance:** See PERFORMANCE_TARGETS.md benchmarking guide
- **Datalake 3.0 integration:** See DATALAKE_3_INTEGRATION.md

For development team: contact via GitHub issues or email.
