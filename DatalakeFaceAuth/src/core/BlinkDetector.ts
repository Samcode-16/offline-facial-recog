import { LandmarkPoint } from "../types/Face";
import { Constants } from "../utils/Constants";

/**
 * Detects a complete blink using Eye Aspect Ratio (EAR).
 *
 * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 * where p1..p6 are the 6 eye landmarks in order.
 *
 * MediaPipe Face Mesh indices:
 *   LEFT eye  (subject's left): p1=362, p2=385, p3=387, p4=263, p5=373, p6=380
 *   RIGHT eye (subject's right): p1=33, p2=160, p3=158, p4=133, p5=153, p6=144
 *
 * A valid blink requires:
 * Phase 1: BOTH eyes have avg EAR < EAR_CLOSED_THRESHOLD for ≥ 2 consecutive frames
 * Phase 2: THEN EAR rises back above threshold (eye opens again)
 * This two-phase requirement prevents counting a photo (permanently closed eyes) as a blink.
 * A challenge starting with already-closed eyes must wait for eyes to open first.
 */
export class BlinkDetector {
  private phase: "WAITING_OPEN" | "OPEN" | "CLOSED" = "WAITING_OPEN";
  private closedCount = 0;

  processFrame(landmarks: LandmarkPoint[]): boolean {
    const left = this.calcEAR(landmarks, [362, 385, 387, 263, 373, 380]);
    const right = this.calcEAR(landmarks, [33, 160, 158, 133, 153, 144]);
    const ear = (left + right) / 2;

    switch (this.phase) {
      case "WAITING_OPEN":
        if (ear > Constants.EAR_CLOSED_THRESHOLD) this.phase = "OPEN";
        return false;
      case "OPEN":
        if (ear < Constants.EAR_CLOSED_THRESHOLD) {
          this.phase = "CLOSED";
          this.closedCount = 1;
        }
        return false;
      case "CLOSED":
        if (ear < Constants.EAR_CLOSED_THRESHOLD) {
          this.closedCount++;
          return false;
        }
        // Eyes reopened
        if (this.closedCount >= Constants.EAR_MIN_CLOSED_FRAMES) {
          this.reset();
          return true; // Valid blink detected
        }
        this.phase = "OPEN";
        this.closedCount = 0;
        return false;
    }
  }

  private calcEAR(lm: LandmarkPoint[], idx: number[]): number {
    const d = (a: LandmarkPoint, b: LandmarkPoint) =>
      Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    return (
      (d(lm[idx[1]], lm[idx[5]]) + d(lm[idx[2]], lm[idx[4]])) /
      (2 * d(lm[idx[0]], lm[idx[3]]) + 1e-6)
    );
  }

  reset(): void {
    this.phase = "WAITING_OPEN";
    this.closedCount = 0;
  }
}
