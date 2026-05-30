import {
  ChallengeType,
  LivenessState,
  LivenessStatus,
} from "../types/Liveness";
import { LandmarkPoint } from "../types/Face";
import { BlinkDetector } from "./BlinkDetector";
import { SmileDetector } from "./SmileDetector";
import { HeadPoseEstimator } from "./HeadPoseEstimator";
import { SecurityUtils } from "../utils/SecurityUtils";
import { Constants } from "../utils/Constants";

/**
 * Orchestrates the full active liveness detection flow.
 *
 * Challenge selection rules:
 * - Always pick exactly NUM_CHALLENGES (2) challenges per session
 * - Challenge pool: [BLINK, SMILE, TURN_LEFT, TURN_RIGHT]
 * - TURN_LEFT and TURN_RIGHT are mutually exclusive — never both in same session
 * - Order is randomized using Fisher-Yates shuffle
 * - A new random session token is generated per liveness attempt
 *
 * Session security:
 * - Gestures detected BEFORE a challenge is displayed do not count
 * - Session token changes on each new attempt to prevent state replay
 */
export class LivenessOrchestrator {
  private blink = new BlinkDetector();
  private smile = new SmileDetector();
  private head = new HeadPoseEstimator();
  private challengeStartTime = 0;

  createInitialState(): LivenessState {
    return {
      status: "IDLE",
      currentChallenge: null,
      challengeQueue: [],
      completedChallenges: [],
      attemptsUsed: 0,
      timeRemainingMs: Constants.CHALLENGE_TIMEOUT_MS,
      sessionToken: SecurityUtils.generateSessionToken(),
    };
  }

  startSession(state: LivenessState): LivenessState {
    const queue = this.buildQueue();
    this.resetDetectors();
    this.challengeStartTime = Date.now();
    return {
      ...state,
      status: "CHALLENGE_ACTIVE",
      challengeQueue: queue.slice(1),
      currentChallenge: queue[0],
      completedChallenges: [],
      timeRemainingMs: Constants.CHALLENGE_TIMEOUT_MS,
      sessionToken: SecurityUtils.generateSessionToken(),
    };
  }

  processFrame(
    landmarks: LandmarkPoint[],
    state: LivenessState,
  ): LivenessState {
    if (state.status !== "CHALLENGE_ACTIVE") return state;

    const elapsed = Date.now() - this.challengeStartTime;
    const remaining = Constants.CHALLENGE_TIMEOUT_MS - elapsed;

    if (remaining <= 0) return this.handleTimeout(state);

    const detected = this.checkGesture(landmarks, state.currentChallenge!);

    if (detected) {
      const completed = [...state.completedChallenges, state.currentChallenge!];
      if (state.challengeQueue.length === 0) {
        return {
          ...state,
          status: "ALL_PASSED",
          completedChallenges: completed,
          timeRemainingMs: 0,
        };
      }
      const next = state.challengeQueue[0];
      this.resetDetectors();
      this.challengeStartTime = Date.now();
      return {
        ...state,
        status: "CHALLENGE_ACTIVE",
        currentChallenge: next,
        challengeQueue: state.challengeQueue.slice(1),
        completedChallenges: completed,
        timeRemainingMs: Constants.CHALLENGE_TIMEOUT_MS,
      };
    }

    return { ...state, timeRemainingMs: remaining };
  }

  handleFailure(state: LivenessState): LivenessState {
    const attempts = state.attemptsUsed + 1;
    if (attempts >= Constants.MAX_LIVENESS_ATTEMPTS) {
      return {
        ...state,
        status: "LOCKED_OUT",
        attemptsUsed: attempts,
        lockoutEndsAt: Date.now() + Constants.LOCKOUT_DURATION_MS,
      };
    }
    return { ...this.createInitialState(), attemptsUsed: attempts };
  }

  private checkGesture(
    landmarks: LandmarkPoint[],
    challenge: ChallengeType,
  ): boolean {
    switch (challenge) {
      case "BLINK":
        return this.blink.processFrame(landmarks);
      case "SMILE":
        return this.smile.processFrame(landmarks);
      case "TURN_LEFT":
        return this.head.processFrame(landmarks, "LEFT");
      case "TURN_RIGHT":
        return this.head.processFrame(landmarks, "RIGHT");
    }
  }

  private handleTimeout(state: LivenessState): LivenessState {
    return this.handleFailure({ ...state, failureReason: "TIMEOUT" });
  }

  private resetDetectors(): void {
    this.blink.reset();
    this.smile.reset();
    this.head.reset();
  }

  private buildQueue(): ChallengeType[] {
    const pool: ChallengeType[] = [
      "BLINK",
      "SMILE",
      Math.random() < 0.5 ? "TURN_LEFT" : "TURN_RIGHT",
    ];
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Constants.NUM_CHALLENGES);
  }
}
