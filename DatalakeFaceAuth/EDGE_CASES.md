# Step 15 — Edge Cases Handling Guide

This document specifies **all** error scenarios that must be handled in the DatalakeFaceAuth application. None of these are optional. Each must have corresponding code in the authentication and enrollment pipelines.

---

## Camera and Frame Processing

### 1. Camera Permission Denied

**Trigger:** User denies camera permission on first app launch  
**Response:**

- Show modal dialog explaining why camera is needed
- Display "Open Settings" button that redirects to app settings
- Block access to AuthenticationScreen and EnrollmentScreen until permission is granted
- **Code location:** `AuthenticationScreen.tsx`, `EnrollmentScreen.tsx`

### 2. No Face Detected

**Trigger:** No face appears in frame for 2+ seconds  
**Response:**

- Show message: "Position your face in the oval"
- Keep showing live camera feed
- Display directional arrows (↑↓←→) based on face position if partially visible
- **Code location:** Frame processor worklet, `LivenessPrompt.tsx`

### 3. Multiple Faces Detected

**Trigger:** More than 1 face detected in frame  
**Response:**

- Show: "Please ensure only one person is in frame."
- Pause liveness orchestration
- Resume when only 1 face is detected
- **Threshold:** Multiple faces = detection count > 1
- **Code location:** `useFaceAuth.ts` state machine

### 4. Face Too Small (Too Far)

**Trigger:** Face bounding box width < 10% of screen width  
**Response:**

- Show: "Move closer" with ↑ arrow
- Pause liveness challenges
- **Code location:** `FaceDetector.validate()` method

### 5. Face Too Large (Too Close)

**Trigger:** Face bounding box width > 70% of screen width  
**Response:**

- Show: "Move back" with ↓ arrow
- Pause liveness challenges
- **Code location:** `FaceDetector.validate()` method (existing checks)

### 6. Face Not Centered

**Trigger:** Face center is > ±25% from screen center  
**Response:**

- Show directional arrows pointing toward center
- Calculate direction: if face.x < centerX, show ← ; if face.x > centerX, show →
- Pause liveness challenges
- **Code location:** `FaceDetector.validate()` method, arrows in `FaceOverlay.tsx`

### 7. Low Light Conditions

**Trigger:** Average frame brightness < 60 (normalized 0-255)  
**Response:**

- Apply CLAHE in `LightingCorrector.applyCLAHE()`
- Show warning: "Move to a brighter area"
- Continue liveness (CLAHE improves visibility)
- **Code location:** `LightingCorrector.detectCondition()`, `FaceRecognizer.preprocess()`

### 8. Harsh Sunlight

**Trigger:** Average frame brightness > 200 (normalized 0-255)  
**Response:**

- Apply CLAHE in `LightingCorrector.applyCLAHE()`
- Show warning: "Avoid direct sunlight"
- Continue liveness (CLAHE improves visibility)
- **Code location:** `LightingCorrector.detectCondition()`

### 9. Extreme Head Angle

**Trigger:** Yaw from HeadPoseEstimator > 45° in either direction  
**Response:**

- Show: "Face the camera directly"
- Pause liveness challenges
- Resume when yaw ≤ 45°
- **Code location:** `HeadPoseEstimator`, `useFaceAuth.ts`

### 10. Phone Motion Blur

**Trigger:** Frame-to-frame face center shift > 50 pixels in single frame interval  
**Response:**

- Show: "Hold phone steady"
- Pause pipeline (wait for stabilization)
- **Implementation:** Track previous frame face center, compute delta
- **Code location:** Frame processor worklet

---

## Liveness Detection

### 1. Challenge Timeout (8 seconds)

**Trigger:** Challenge active but user doesn't complete it after 8000ms  
**Response:**

- Increment attempt counter
- Re-randomize challenges (new Fisher-Yates shuffle)
- Show same UI state (CHALLENGE_ACTIVE) with new prompt
- Show new countdown
- **Code location:** `useLiveness.ts`, `LivenessOrchestrator.getNextChallenge()`

### 2. Eyes Already Closed at BLINK Start

**Trigger:** BLINK challenge starts but EAR is already below threshold  
**Response:**

- Wait for eyes to open first (EAR rises above 0.2)
- Then start detecting the blink
- Do NOT count the initial closed state as blink
- **Code location:** `BlinkDetector.detectBlink()` — track state machine

### 3. User Performs Wrong Gesture

**Trigger:** While BLINK challenge active, user smiles instead  
**Response:**

- Ignore the smile gesture
- Continue waiting for blink
- Do NOT advance to next challenge
- **Code location:** Frame processor — only execute detector for active challenge

### 4. Gesture Performed Before Challenge Shown

**Trigger:** User blinks before CHALLENGE_ACTIVE UI displays  
**Response:**

- Ignore the gesture
- Only count gestures AFTER challenge is displayed
- Timestamp-based: start counting from challenge display time
- **Code location:** Track `challengeStartTime` in `useFaceAuth.ts`

### 5. Challenge Attempt 3 Fails

**Trigger:** User fails liveness on 3rd attempt  
**Response:**

- Set stage to LOCKED_OUT
- Show: "Too many attempts. Please wait 30 seconds." with countdown
- Lock liveness for 30000ms
- After lockout expires, reset to POSITION_FACE
- **Code location:** `useFaceAuth.ts`, lockout timer logic

### 6. App Backgrounded Mid-Challenge

**Trigger:** User presses Home or receives call while challenge is active  
**Response:**

- Detect app background (React Native lifecycle)
- Reset liveness state completely on foreground return
- Set stage back to POSITION_FACE
- Clear challengesCompleted array
- **Code location:** App.tsx lifecycle, `useLiveness.ts` reset method

### 7. Quick Eye Flick (< 2 Frames)

**Trigger:** User blinks very quickly (< 66ms at 30fps)  
**Response:**

- Reject as valid blink
- Require EAR_MIN_CLOSED_FRAMES = 2 consecutive frames minimum
- In BlinkDetector: only count as blink if `closedFrameCount >= 2`
- **Code location:** `BlinkDetector.detectBlink()`, `Constants.EAR_MIN_CLOSED_FRAMES`

---

## Face Recognition

### 1. Person Not Enrolled

**Trigger:** Cosine similarity < 0.45 for all enrolled persons  
**Response:**

- Set recognizedPerson = null
- Stage = FAILED_RECOGNITION
- Show: "Face not recognized. Contact administrator."
- Never reveal candidate's name or partial match
- **Code location:** `EmbeddingMatcher.match()`, `AuthenticationScreen.tsx`

### 2. Confidence in Uncertain Zone (0.45–0.65)

**Trigger:** Best match confidence between 0.45 and 0.65  
**Response:**

- Set recognizedPerson = null (suppress name)
- Stage = FAILED_RECOGNITION
- Show: "Unable to verify. Please try again."
- Do NOT say which person was close
- Do NOT create attendance record
- **Code location:** `EmbeddingMatcher.match()`, logic in useFaceAuth

### 3. Person Account Deactivated

**Trigger:** recognizedPerson.is_active = 0 in database  
**Response:**

- Check is_active flag after match
- Show: "Account deactivated. Contact administrator."
- Prevent attendance record creation
- **Code location:** After recognition, before attendance insert

### 4. Duplicate Attendance Within 60 Seconds

**Trigger:** `AttendanceRepository.hasDuplicate()` returns true  
**Response:**

- Show: "Attendance already recorded for [Name]."
- Name is safe to reveal here (already matched)
- Do NOT create new attendance record
- **Code location:** `AuthenticationScreen.tsx`, check before InsertAttendance

### 5. Anti-Spoof Score Below Threshold

**Trigger:** AntiSpoofDetector.analyzeMultiFrame() returns score < 0.60  
**Response:**

- Stage = FAILED_SPOOF
- Show: "Verification failed. Please try again."
- Never mention "spoof", "fake", or "photo"
- User should retry from POSITION_FACE
- **Code location:** After liveness passes, before recognition

### 6. Database Empty (No Enrolled Persons)

**Trigger:** EmbeddingCache.getAllEmbeddings() returns empty or EmbeddingCache.loadAll() finds 0 enrolled persons  
**Response:**

- On app launch: show prompt in HomeScreen
- On AuthenticationScreen: show modal "No faces enrolled. Please enroll first."
- Prevent authentication attempts
- Navigation to EnrollmentScreen should work
- **Code location:** App.tsx initialization, HomeScreen.tsx

---

## Database and Storage

### 1. SQLite Open Failure

**Trigger:** DatabaseManager.initialize() throws exception  
**Response:**

- Catch in App.tsx
- Show critical error: "Database error. Contact administrator."
- Log full error to console: `[DatabaseManager] Error: ${error.message}`
- Block app navigation
- Show retry button
- **Code location:** App.tsx try-catch, setError state

### 2. Encryption Key Not Found After Reinstall

**Trigger:** SecurityUtils.getOrCreateEncryptionKey() fails; previous device key was stored in Keychain/Keystore and is now missing  
**Response:**

- Detect unreadable embeddings on decryption
- Show: "Re-enrollment required. Your device security key was reset."
- EmbeddingCache.loadAll() skips corrupted embeddings
- Block authentication
- Allow new enrollment
- **Code location:** `EmbeddingCache.loadAll()`, error handler

### 3. Device Storage < 10 MB

**Trigger:** Check free storage on app launch and periodically  
**Response:**

- Show persistent warning banner on HomeScreen:
  "Low storage: {freeSpace}MB remaining. Please free up space."
- **Code location:** HomeScreen.tsx, utils/StorageUtils.ts (new)

### 4. Device Storage < 1 MB

**Trigger:** Free storage < 1 MB  
**Response:**

- Block creation of new attendance records
- Show error: "Device storage full. Cannot record attendance."
- Sync and purge operations can still proceed
- **Code location:** Before `AttendanceRepository.insert()` in useFaceAuth

### 5. Enrollment Transaction Failure Mid-Capture

**Trigger:** Database error after capturing 2-4 embeddings during 5-capture enrollment  
**Response:**

- Detect error during enrollment flow
- Roll back all inserted embeddings for that attempt:
  ```sql
  DELETE FROM face_embeddings
  WHERE person_id = ? AND created_at >= ?
  ```
- Show: "Enrollment failed. Please try again."
- Reset UI to allow restart
- **Code location:** `EnrollmentScreen.tsx`, `FaceRepository.deleteEmbeddingsByPersonId()`

---

## Sync

### 1. Server Unreachable (Timeout)

**Trigger:** S3Uploader.uploadBatch() times out after 30s  
**Response:**

- Retry up to 3 times with exponential backoff:
  - 1st retry: 2000ms
  - 2nd retry: 4000ms
  - 3rd retry: 8000ms
- If all fail, keep records at synced=0
- Show: "Sync failed. Will retry when connected."
- **Code location:** `SyncManager.startSync()`, retry loop

### 2. HTTP 4xx from S3

**Trigger:** S3 returns 400, 403, 404, etc.  
**Response:**

- Do NOT retry
- Log error: `[S3Uploader] HTTP 4xx: ${error.status}`
- Records remain at synced=0
- Show user warning: "Sync error. Please contact administrator."
- **Code location:** `S3Uploader.uploadBatch()`, error handling

### 3. HTTP 5xx from S3

**Trigger:** S3 returns 500, 502, 503, etc.  
**Response:**

- Retry up to 3 times with exponential backoff (same as timeout case)
- If all fail, keep records at synced=0
- Show: "Server error. Will retry later."
- **Code location:** `SyncManager.startSync()`

### 4. App Killed During Sync

**Trigger:** User force-closes app while `SyncManager.startSync()` is running  
**Response:**

- Records remain at synced=0 in SQLite
- On app relaunch, NetworkMonitor detects connectivity
- Sync resumes automatically
- No data loss
- **Code location:** Database schema guarantees (synced=0 = pending)

### 5. Sync Queue > 500 Records

**Trigger:** `AttendanceRepository.getPending().length > 500`  
**Response:**

- Before starting sync, check queue size
- If > 500, show warning:
  "Many records pending ({count}). Please ensure stable internet connection."
- Still proceed with sync
- **Code location:** `SyncManager.startSync()` initial check

### 6. NEVER Purge synced=0 Records

**INVARIANT (CRITICAL):** This is a data safety requirement enforced in code.  
**Trigger:** Any purge or delete operation  
**Response:**

- `AttendanceRepository.purgeSynced()` MUST use guard:
  ```sql
  DELETE FROM attendance_records WHERE synced = 1
  ```
- **NEVER** use:
  ```sql
  DELETE FROM attendance_records
  ```
- If purge is called without synced=1 filter, throw error
- **Code location:** `AttendanceRepository.purgeSynced()` — guard in DELETE statement

---

## Implementation Checklist

Before marking face auth complete, verify every item below has code:

- [ ] Camera permission request + permission denial screen
- [ ] Face detection confidence validation (10% - 70%)
- [ ] Face centering check (±25%)
- [ ] Multiple faces detection
- [ ] Lighting condition detection (low light < 60, harsh > 200)
- [ ] CLAHE applied for poor lighting
- [ ] Head angle validation (yaw ≤ 45°)
- [ ] Motion blur detection (frame shift > 50px)
- [ ] Challenge timeout handling (8s countdown)
- [ ] Blink detector state machine (eyes open first)
- [ ] Wrong gesture ignored
- [ ] Gesture-before-challenge-display ignored
- [ ] Lockout after 3 failures (30s duration)
- [ ] App background → liveness reset
- [ ] Quick eye flick rejection (< 2 frames)
- [ ] Uncertain zone handling (0.45 - 0.65)
- [ ] Deactivated person check (is_active = 0)
- [ ] Duplicate attendance check (60s window)
- [ ] Anti-spoof failure messaging
- [ ] No enrolled persons blocking auth
- [ ] SQLite error handling with user message
- [ ] Encryption key loss detection
- [ ] Device storage warnings (< 10MB)
- [ ] Storage-full blocking (< 1MB)
- [ ] Enrollment transaction rollback
- [ ] Sync retry with exponential backoff (2s, 4s, 8s)
- [ ] 4xx error no-retry policy
- [ ] 5xx error retry policy
- [ ] Background sync on reconnection
- [ ] Sync queue warning (> 500 records)
- [ ] Purge guard: `WHERE synced = 1` only
