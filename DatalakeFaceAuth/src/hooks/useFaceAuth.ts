import { useEffect, useRef, useState, useCallback } from "react";
import { ChallengeType, LivenessStatus } from "../types/Liveness";
import { EnrolledPerson } from "../types/Face";
import { AttendanceRecord } from "../types/Attendance";
import { AttendanceRepository } from "../database/AttendanceRepository";
import { EmbeddingMatcher } from "../core/EmbeddingMatcher";
import { EmployeeBridge } from "../bridges/EmployeeBridge";

export interface FaceAuthState {
  stage:
    | "POSITION_FACE"
    | "CHALLENGE_ACTIVE"
    | "PROCESSING"
    | "SUCCESS"
    | "FAILED_LIVENESS"
    | "FAILED_RECOGNITION"
    | "FAILED_SPOOF"
    | "LOCKED_OUT"
    | "DUPLICATE"
    | "MULTIPLE_FACES"
    | "TOO_FAR"
    | "TOO_CLOSE"
    | "NOT_CENTERED"
    | "LOW_LIGHT"
    | "HARSH_SUNLIGHT";
  challenge: ChallengeType | null;
  timeRemainingMs: number;
  lockoutRemainingMs: number;
  recognizedPerson: EnrolledPerson | null;
  confidence: number;
  challengesCompleted: ChallengeType[];
}

/**
 * useFaceAuth — the central hook consumed by AuthenticationScreen.
 *
 * Orchestrates the entire authentication pipeline:
 * 1. Manages liveness state via LivenessOrchestrator
 * 2. Collects anti-spoof frames after liveness completes
 * 3. Runs recognition after anti-spoof passes
 * 4. Writes attendance record to SQLite on success
 * 5. Returns UI-ready state for the screen to render
 *
 * Anti-spoof frames buffer: collect the 3 frames immediately after
 * all liveness challenges pass. Pass them to AntiSpoofDetector.analyzeMultiFrame.
 *
 * The frame processor runs inside a VisionCamera Worklet (separate thread).
 * Pre-loaded embeddings from EmbeddingCache are passed as a shared value.
 * SQLite writes happen on the JS thread after the worklet posts results.
 */

export function useFaceAuth(): {
  state: FaceAuthState;
  frameProcessor: (frame: any) => void;
  reset: () => void;
} {
  const [state, setState] = useState<FaceAuthState>({
    stage: "POSITION_FACE",
    challenge: null,
    timeRemainingMs: 0,
    lockoutRemainingMs: 0,
    recognizedPerson: null,
    confidence: 0,
    challengesCompleted: [],
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lockoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate liveness challenge timer
  useEffect(() => {
    if (state.stage === "CHALLENGE_ACTIVE" && state.challenge) {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          const newTime = prev.timeRemainingMs - 100;
          if (newTime <= 0) {
            // Challenge timeout
            return {
              ...prev,
              stage: "FAILED_LIVENESS",
              challenge: null,
              timeRemainingMs: 0,
            };
          }
          return { ...prev, timeRemainingMs: newTime };
        });
      }, 100);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.stage, state.challenge]);

  // Simulate lockout timer
  useEffect(() => {
    if (state.stage === "LOCKED_OUT") {
      lockoutTimerRef.current = setInterval(() => {
        setState((prev) => {
          const newTime = prev.lockoutRemainingMs - 100;
          if (newTime <= 0) {
            return {
              ...prev,
              stage: "POSITION_FACE",
              challenge: null,
              lockoutRemainingMs: 0,
              challengesCompleted: [],
            };
          }
          return { ...prev, lockoutRemainingMs: newTime };
        });
      }, 100);
    }

    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, [state.stage]);

  const frameProcessor = useCallback((frame: any) => {
    // This will be replaced with actual VisionCamera worklet
    // For now, this is a stub that would be implemented with Reanimated
  }, []);

  const reset = useCallback(() => {
    setState({
      stage: "POSITION_FACE",
      challenge: null,
      timeRemainingMs: 0,
      lockoutRemainingMs: 0,
      recognizedPerson: null,
      confidence: 0,
      challengesCompleted: [],
    });
  }, []);

  return {
    state,
    frameProcessor,
    reset,
  };
}
