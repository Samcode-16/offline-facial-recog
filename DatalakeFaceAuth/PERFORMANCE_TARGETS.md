# Step 18 — Performance Targets and Profiling

This document specifies the performance requirements for the DatalakeFaceAuth application and provides instrumentation to measure them.

---

## Performance Targets

All targets must be verified on a **real mid-range Android device** (Snapdragon 665 class, 3-4 GB RAM), NOT on an emulator or high-end device.

### Target Device Specification

**Recommended:** Redmi Note 9 / Samsung Galaxy A32 / Realme 8

- **Processor:** Qualcomm Snapdragon 665 (or equivalent mid-range SoC)
- **RAM:** 3-4 GB
- **Storage:** 64 GB
- **Camera:** 13-16 MP rear camera
- **OS:** Android 10-11
- **Network:** 4G/LTE

Emulators and high-end phones (Pixel 6, iPhone 13) will show artificially good performance.

---

## Individual Module Targets

| Module               | Operation                                      | Target         | Notes                                         |
| -------------------- | ---------------------------------------------- | -------------- | --------------------------------------------- |
| **Face Detection**   | BlazeFace inference + NMS per frame            | < 15 ms        | 30 fps = 33ms/frame; leaves 18ms buffer       |
| **Face Mesh**        | Landmark extraction per frame                  | < 35 ms        | MediaPipe Face Mesh                           |
| **Anti-Spoof**       | Dual-scale inference × 3 frames                | < 100 ms total | (2.7x + 4.0x scale) × 3 frames = 6 inferences |
| **Face Recognition** | MobileFaceNet embedding extraction             | < 80 ms        | 112×112 crop + preprocessing                  |
| **Embedding Match**  | Cosine similarity (100 persons × 5 embeddings) | < 10 ms        | 500 embeddings in-memory cache                |
| **SQLite Write**     | Insert single attendance record                | < 50 ms        | Local database, no network                    |
| **S3 Upload**        | Batch of 50 records (typical sync)             | 2-5 sec        | Network-dependent; not included in pipeline   |

---

## End-to-End Pipeline Target

**Full authentication from "position face" to "attendance marked":** < 800 ms

### Pipeline Breakdown

```
User starts auth
    ↓
[Face Detection Loop] 100-200 ms until stable face detected
    ↓
[Liveness Orchestration]
  Challenge 1 (BLINK/SMILE/TURN): 2-3 seconds (user interaction)
  Challenge 2 (TURN/BLINK): 2-3 seconds (user interaction)
    ↓
[Anti-Spoof Analysis] < 100 ms
    ↓
[Face Recognition] < 80 ms
    ↓
[Duplicate Check] < 50 ms
    ↓
[SQLite Insert] < 50 ms
    ↓
[UI Update] < 100 ms
    ═══════════════════════════════════════════════════
Total UI/AI: ~500-600 ms (excluding user interaction time for challenges)
```

The 800 ms target applies to the **AI and database portion only**, excluding:

- User's time to perform liveness challenges (3-6 seconds user-dependent)
- Network latency (sync happens asynchronously in background)

---

## Instrumentation Setup

### 1. Add Timing Constants

In `src/utils/Constants.ts`, add:

```typescript
export const ENABLE_PERFORMANCE_LOGGING = true;
export const PERFORMANCE_LOG_PREFIX = "[TIMING]";

// Performance targets (ms)
export const TARGET_FACE_DETECTION_MS = 15;
export const TARGET_FACE_MESH_MS = 35;
export const TARGET_ANTI_SPOOF_MS = 100;
export const TARGET_EMBEDDING_EXTRACTION_MS = 80;
export const TARGET_EMBEDDING_MATCH_MS = 10;
export const TARGET_PIPELINE_TOTAL_MS = 800;
```

### 2. Create Profiling Utility

Create `src/utils/PerformanceProfiler.ts`:

```typescript
/**
 * PerformanceProfiler — measures and logs timing for each pipeline step.
 *
 * Usage:
 *   const prof = new PerformanceProfiler('Face Detection');
 *   prof.start();
 *   // ... do work
 *   prof.end();
 *   prof.log();
 */

import { Constants } from "./Constants";

export class PerformanceProfiler {
  private startTime: number = 0;
  private endTime: number = 0;
  private label: string;

  constructor(label: string) {
    this.label = label;
  }

  start(): void {
    this.startTime = Date.now();
  }

  end(): void {
    this.endTime = Date.now();
  }

  elapsed(): number {
    return this.endTime - this.startTime;
  }

  log(target?: number): void {
    const elapsed = this.elapsed();
    const status = target && elapsed > target ? "❌ SLOW" : "✅ OK";
    console.log(
      `${Constants.PERFORMANCE_LOG_PREFIX} ${this.label}: ${elapsed}ms ${status}`,
    );
  }

  logWithTarget(target: number): void {
    this.log(target);
  }
}
```

### 3. Instrument Face Detection

In `src/core/FaceDetector.ts`, wrap detect():

```typescript
async detect(frame: any): Promise<DetectedFace[]> {
  const prof = new PerformanceProfiler('Face Detection');
  prof.start();

  // ... existing detection logic

  prof.end();
  prof.logWithTarget(Constants.TARGET_FACE_DETECTION_MS);

  return detectedFaces;
}
```

### 4. Instrument Face Recognition

In `src/core/FaceRecognizer.ts`:

```typescript
async extractEmbedding(face: DetectedFace, frame: any): Promise<FaceEmbedding> {
  const prof = new PerformanceProfiler('Face Recognition');
  prof.start();

  // ... existing recognition logic

  prof.end();
  prof.logWithTarget(Constants.TARGET_EMBEDDING_EXTRACTION_MS);

  return embedding;
}
```

### 5. Instrument Anti-Spoof

In `src/core/AntiSpoofDetector.ts`:

```typescript
async analyzeMultiFrame(frames: any[]): Promise<{ isReal: boolean; score: number }> {
  const prof = new PerformanceProfiler('Anti-Spoof (3 frames)');
  prof.start();

  // ... existing analysis logic

  prof.end();
  prof.logWithTarget(Constants.TARGET_ANTI_SPOOF_MS);

  return { isReal, score };
}
```

### 6. Instrument Embedding Match

In `src/core/EmbeddingMatcher.ts`:

```typescript
match(embedding: Float32Array): RecognitionResult {
  const prof = new PerformanceProfiler('Embedding Match (500 embeddings)');
  prof.start();

  // ... existing match logic

  prof.end();
  prof.logWithTarget(Constants.TARGET_EMBEDDING_MATCH_MS);

  return result;
}
```

### 7. Instrument End-to-End Pipeline

In `src/hooks/useFaceAuth.ts`:

```typescript
export function useFaceAuth() {
  const [pipelineStartTime, setPipelineStartTime] = useState<number>(0);

  // When authentication starts
  const startPipeline = useCallback(() => {
    setPipelineStartTime(Date.now());
  }, []);

  // When attendance is recorded
  useEffect(() => {
    if (state.stage === "SUCCESS" && pipelineStartTime > 0) {
      const elapsed = Date.now() - pipelineStartTime;
      console.log(
        `${Constants.PERFORMANCE_LOG_PREFIX} Full Pipeline: ${elapsed}ms (target: ${Constants.TARGET_PIPELINE_TOTAL_MS}ms)`,
      );
    }
  }, [state.stage, pipelineStartTime]);

  return {
    /* ... */
  };
}
```

---

## Profiling on Device

### 1. Enable Debug Overlay

In `src/utils/Constants.ts`:

```typescript
export const ENABLE_DEBUG_OVERLAY = true;
```

This adds an overlay showing:

- FPS counter (target: 30 fps on camera stream)
- Current stage
- Latest timing logs

### 2. Run Multiple Test Cycles

Perform 10 complete authentication cycles and log results:

```bash
# Cycle 1-10: Measure pipeline timing
# Record average time
# Note any outliers (slow cycles indicate frame drops or GC pauses)
```

### 3. Monitor System Stats

**Android:**

```bash
adb shell dumpsys batterystats | grep "SLOW"
adb shell dumpsys meminfo com.datalakefaceauth
```

**iOS:**

```bash
# Use Xcode Instruments:
# Xcode → Product → Profile
# Select: "System Trace" or "Core Animation" tool
```

### 4. Check Frame Drops

Monitor via console logs during 10 auth cycles:

```
[TIMING] Face Detection: 12ms ✅ OK
[TIMING] Face Mesh: 31ms ✅ OK
[TIMING] Anti-Spoof: 95ms ✅ OK
[TIMING] Face Recognition: 78ms ✅ OK
[TIMING] Embedding Match: 8ms ✅ OK
[TIMING] Full Pipeline: 724ms ✅ OK
```

**Success criteria:**

- All modules under target
- No ❌ SLOW messages
- FPS stays >= 25 (occasional dips ok)

---

## Optimization Strategies

If any target is missed:

### Face Detection Slow (> 15 ms)

**Causes:**

- Model input size too large (use 192×192, not larger)
- NMS threshold too low (should be 0.3)
- Too many faces being detected

**Solutions:**

1. Reduce input size to model: `const INPUT_SIZE = 192;`
2. Increase NMS IoU threshold: `const NMS_THRESHOLD = 0.4;`
3. Skip frames (run detection every 2nd frame): frame counter modulo

### Face Mesh Slow (> 35 ms)

**Causes:**

- Computing landmarks for every face (should be face with highest confidence only)
- High-resolution frame input

**Solutions:**

1. Run face mesh only on 1 face (best confidence)
2. Downscale frame before processing: `downscale(frame, 0.5)`
3. Cache landmarks from previous frame

### Anti-Spoof Slow (> 100 ms for 3 frames)

**Causes:**

- Running on full-resolution crops (should be 80×80)
- Both models running on every frame

**Solutions:**

1. Ensure crop size is 80×80: `const CROP_SIZE = 80;`
2. Ensure models are quantized INT8 (not FP32)
3. Run only 1 model per frame (alternate)

### Embedding Extraction Slow (> 80 ms)

**Causes:**

- Input crop not preprocessed (should be aligned by eyes, CLAHE, normalized)
- Model file corrupted or wrong size

**Solutions:**

1. Ensure preprocessing pipeline is complete (eye alignment, CLAHE, normalization)
2. Verify model file size: MobileFaceNet INT8 should be ~2 MB
3. Re-download model from official source

### Embedding Match Slow (> 10 ms for 500 embeddings)

**Causes:**

- Embeddings not pre-loaded in memory (should use EmbeddingCache)
- Computing full distance matrix instead of per-person best match

**Solutions:**

1. Verify EmbeddingCache is loaded before auth
2. Use early termination: break after finding match > 0.75
3. Pre-sort embeddings by timestamp (recent first)

### Full Pipeline Slow (> 800 ms)

**Causes:**

- Garbage collection pause
- Network access blocking pipeline
- Unnecessary database queries

**Solutions:**

1. Profile with Xcode Instruments to find GC pauses
2. Verify no network calls during inference (`isOnline()` should not block)
3. Use batch database reads, not individual queries

---

## Monitoring in Production

### Add Crash Analytics

Log timing data to crash analytics (Firebase Crashlytics, etc.):

```typescript
logTiming({
  module: "Face Recognition",
  elapsedMs: 78,
  target: 80,
  passed: true,
  timestamp: Date.now(),
});
```

Track:

- % of cycles meeting all targets
- P95 and P99 latency (not just average)
- Correlation with device model (some phones slow)

### Alert Thresholds

Set alerts if:

- Pipeline avg > 1000ms (something is broken)
- Any single module > 2× target (optimization regression)
- FPS < 20 for > 10 consecutive frames

---

## Performance Test Report Template

Use this format after testing on target device:

```markdown
# DatalakeFaceAuth Performance Report

**Test Date:** YYYY-MM-DD
**Device:** Snapdragon 665, 4GB RAM
**Test Cycles:** 10 complete auth cycles
**Network:** Airplane mode (offline)

## Results

| Module            | Target      | Measured      | Status |
| ----------------- | ----------- | ------------- | ------ |
| Face Detection    | < 15ms      | 12ms avg      | ✅     |
| Face Mesh         | < 35ms      | 32ms avg      | ✅     |
| Anti-Spoof        | < 100ms     | 98ms avg      | ✅     |
| Face Recognition  | < 80ms      | 75ms avg      | ✅     |
| Embedding Match   | < 10ms      | 8ms avg       | ✅     |
| **Full Pipeline** | **< 800ms** | **725ms avg** | **✅** |

## Notes

- No frame drops observed
- Battery drain acceptable (5% per 100 auth cycles)
- Temperature: 35°C (normal)

## Recommendations

- [If any ❌: list optimization steps]
```

---

## Next Steps

1. **Instrument code** with PerformanceProfiler (all 6 modules)
2. **Run on target device** (Snapdragon 665)
3. **Record timings** for 10 cycles
4. **Compare against targets**
5. **Optimize slow modules** (if needed)
6. **Re-test** after optimizations
7. **Generate report** before release
