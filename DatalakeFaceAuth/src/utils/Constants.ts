export const Constants = {
  // ── Face detection ────────────────────────────────────────────────────────
  DETECTION_INPUT_SIZE: 128,
  MIN_FACE_RATIO: 0.08, // Face must cover at least 8% of frame area
  MAX_FACE_RATIO: 0.7, // Face must not cover more than 70% of frame
  DETECTION_CONFIDENCE: 0.7,
  CENTER_TOLERANCE: 0.25, // Face center must be within 25% of frame center

  // ── Face recognition ──────────────────────────────────────────────────────
  RECOGNITION_INPUT_SIZE: 112,
  EMBEDDING_DIMS: 512,
  MATCH_THRESHOLD: 0.65, // Cosine similarity above this = match
  REJECT_THRESHOLD: 0.45, // Below this = definite non-match
  MAX_EMBEDDINGS_PER_PERSON: 5, // Capture 5 frames at enrollment

  // ── Liveness ──────────────────────────────────────────────────────────────
  NUM_CHALLENGES: 2,
  CHALLENGE_TIMEOUT_MS: 8000, // 8 seconds per challenge
  MAX_LIVENESS_ATTEMPTS: 3,
  LOCKOUT_DURATION_MS: 30000, // 30-second lockout after 3 failures

  // Blink (Eye Aspect Ratio)
  EAR_CLOSED_THRESHOLD: 0.21,
  EAR_MIN_CLOSED_FRAMES: 2, // Eyes must be closed for 2+ consecutive frames

  // Smile
  SMILE_MIN_FRAMES: 12, // Smile must sustain for ~400ms at 30fps
  SMILE_RELATIVE_INCREASE: 0.15, // Mouth width must increase 15% above baseline

  // Head turn
  HEAD_YAW_THRESHOLD: 20, // Degrees of yaw to register as a turn
  HEAD_SUSTAIN_FRAMES: 15, // Turn must sustain for ~500ms at 30fps

  // ── Anti-spoofing ─────────────────────────────────────────────────────────
  ANTI_SPOOF_THRESHOLD: 0.6,
  ANTI_SPOOF_CROP_RATIO_1: 2.7,
  ANTI_SPOOF_CROP_RATIO_2: 4.0,
  ANTI_SPOOF_FRAMES: 3, // Average score across 3 frames

  // ── Performance ───────────────────────────────────────────────────────────
  PIPELINE_TIMEOUT_MS: 800, // Total pipeline must finish within 800ms

  // ── Database ──────────────────────────────────────────────────────────────
  DB_NAME: "datalake_faceauth.db",
  DUPLICATE_WINDOW_MS: 60000, // Block duplicate attendance within 60 seconds

  // ── Sync ──────────────────────────────────────────────────────────────────
  SYNC_BATCH_SIZE: 50,
  SYNC_MAX_RETRIES: 3,
  SYNC_BACKOFF_BASE_MS: 2000,
};
