export type ChallengeType = "BLINK" | "SMILE" | "TURN_LEFT" | "TURN_RIGHT";

export type LivenessStatus =
  | "IDLE"
  | "DETECTING_FACE"
  | "CHALLENGE_ACTIVE"
  | "CHALLENGE_PASSED"
  | "ALL_PASSED"
  | "FAILED"
  | "LOCKED_OUT";

export interface LivenessState {
  status: LivenessStatus;
  currentChallenge: ChallengeType | null;
  challengeQueue: ChallengeType[];
  completedChallenges: ChallengeType[];
  attemptsUsed: number;
  timeRemainingMs: number;
  sessionToken: string;
  lockoutEndsAt?: number;
  failureReason?: string;
}
