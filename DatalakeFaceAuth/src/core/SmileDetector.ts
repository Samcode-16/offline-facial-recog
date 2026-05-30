import { LandmarkPoint } from "../types/Face";
import { Constants } from "../utils/Constants";

/**
 * Detects a smile by measuring relative increase in mouth width.
 *
 * Method:
 *   mouthWidth = distance between lip corners (landmarks 61 and 291)
 *   interEyeDist = distance between outer eye corners (landmarks 33 and 263)
 *   normalizedWidth = mouthWidth / interEyeDist
 *
 * Approach: Baseline the normalized width over the first 10 frames.
 * A smile is detected when the current normalizedWidth exceeds the
 * baseline by more than SMILE_RELATIVE_INCREASE (15%) for at least
 * SMILE_MIN_FRAMES (12) consecutive frames.
 *
 * The relative approach handles people who naturally have wider mouths.
 */
export class SmileDetector {
  private baselineFrames: number[] = [];
  private consecutiveFrames = 0;
  private baseline: number | null = null;

  processFrame(landmarks: LandmarkPoint[]): boolean {
    const mW = this.dist(landmarks[61], landmarks[291]);
    const iE = this.dist(landmarks[33], landmarks[263]);
    const normalized = mW / (iE + 1e-6);

    if (this.baseline === null) {
      this.baselineFrames.push(normalized);
      if (this.baselineFrames.length >= 10) {
        this.baseline = this.baselineFrames.reduce((a, b) => a + b, 0) / 10;
      }
      return false;
    }

    if (normalized > this.baseline * (1 + Constants.SMILE_RELATIVE_INCREASE)) {
      this.consecutiveFrames++;
    } else {
      this.consecutiveFrames = 0;
    }

    return this.consecutiveFrames >= Constants.SMILE_MIN_FRAMES;
  }

  private dist(a: LandmarkPoint, b: LandmarkPoint): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  reset(): void {
    this.baselineFrames = [];
    this.consecutiveFrames = 0;
    this.baseline = null;
  }
}
