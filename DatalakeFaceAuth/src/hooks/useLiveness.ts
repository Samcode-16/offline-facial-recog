import { useState, useCallback, useRef } from "react";
import { ChallengeType, LivenessStatus } from "../types/Liveness";
import { LivenessOrchestrator } from "../core/LivenessOrchestrator";

/**
 * useLiveness — manages liveness challenge orchestration
 *
 * Provides:
 * - Current liveness status and challenge
 * - Challenge completion tracking
 * - Timeout and retry management
 * - Lockout mechanism
 */

export function useLiveness(): {
  status: LivenessStatus;
  currentChallenge: ChallengeType | null;
  challengesCompleted: ChallengeType[];
  attemptsRemaining: number;
  timeRemainingMs: number;
  startLiveness: () => void;
  completeChallenge: (challenge: ChallengeType) => void;
  failChallenge: () => void;
  reset: () => void;
} {
  const [status, setStatus] = useState<LivenessStatus>("IDLE");
  const [currentChallenge, setCurrentChallenge] =
    useState<ChallengeType | null>(null);
  const [challengesCompleted, setChallengesCompleted] = useState<
    ChallengeType[]
  >([]);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [timeRemainingMs, setTimeRemainingMs] = useState(8000);

  const orchestratorRef = useRef(LivenessOrchestrator.getInstance());
  const challengeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startLiveness = useCallback(() => {
    setStatus("CHALLENGE_ACTIVE");
    // Select random challenges via LivenessOrchestrator
    const nextChallenge = orchestratorRef.current.getNextChallenge();
    setCurrentChallenge(nextChallenge);
    setTimeRemainingMs(8000);

    // Start countdown
    challengeTimerRef.current = setInterval(() => {
      setTimeRemainingMs((prev) => {
        const newTime = prev - 100;
        if (newTime <= 0) {
          if (challengeTimerRef.current)
            clearInterval(challengeTimerRef.current);
          setStatus("FAILED");
          return 0;
        }
        return newTime;
      });
    }, 100);
  }, []);

  const completeChallenge = useCallback(
    (challenge: ChallengeType) => {
      if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);

      setChallengesCompleted((prev) => [...prev, challenge]);

      // If all challenges completed, move to next step
      if (challengesCompleted.length + 1 >= 2) {
        setStatus("ALL_PASSED");
        setCurrentChallenge(null);
      } else {
        // Get next challenge
        const nextChallenge = orchestratorRef.current.getNextChallenge();
        setCurrentChallenge(nextChallenge);
        setTimeRemainingMs(8000);
        startLiveness(); // Restart timer for next challenge
      }
    },
    [challengesCompleted.length, startLiveness],
  );

  const failChallenge = useCallback(() => {
    if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);

    const remaining = attemptsRemaining - 1;
    setAttemptsRemaining(remaining);

    if (remaining <= 0) {
      setStatus("LOCKED_OUT");
      // Lock for 30 seconds
      setTimeout(() => {
        reset();
      }, 30000);
    } else {
      reset();
    }
  }, [attemptsRemaining]);

  const reset = useCallback(() => {
    if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);
    setStatus("IDLE");
    setCurrentChallenge(null);
    setChallengesCompleted([]);
    setTimeRemainingMs(8000);
  }, []);

  return {
    status,
    currentChallenge,
    challengesCompleted,
    attemptsRemaining,
    timeRemainingMs,
    startLiveness,
    completeChallenge,
    failChallenge,
    reset,
  };
}
