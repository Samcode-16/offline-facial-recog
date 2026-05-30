import { LandmarkPoint } from "../types/Face";
import { Constants } from "../utils/Constants";

/**
 * Estimates head yaw from Face Mesh landmarks.
 *
 * Yaw estimation method:
 * Use the horizontal offset of the nose tip (landmark 1) relative to
 * the midpoint of the two ear landmarks (234 left ear, 454 right ear).
 * Normalize by the inter-ear distance to get a scale-invariant measure.
 * Map to approximate degrees: yaw_deg ≈ offset_ratio * 90
 *
 * Positive yaw = face turning to the left  (TURN_LEFT challenge)
 * Negative yaw = face turning to the right (TURN_RIGHT challenge)
 *
 * Sustain requirement: The turn must hold for HEAD_SUSTAIN_FRAMES consecutive
 * frames. A quick flick does not count.
 */
export class HeadPoseEstimator {
  private sustainCount = 0;

  estimateYaw(landmarks: LandmarkPoint[]): number {
    const noseTip = landmarks[1];
    const leftEar = landmarks[234];
    const rightEar = landmarks[454];

    const earMidX = (leftEar.x + rightEar.x) / 2;
    const interEarDist = Math.abs(leftEar.x - rightEar.x) + 1e-6;
    const offsetRatio = (noseTip.x - earMidX) / interEarDist;
    return offsetRatio * 90;
  }

  processFrame(
    landmarks: LandmarkPoint[],
    direction: "LEFT" | "RIGHT",
  ): boolean {
    const yaw = this.estimateYaw(landmarks);
    const turned =
      direction === "LEFT"
        ? yaw > Constants.HEAD_YAW_THRESHOLD
        : yaw < -Constants.HEAD_YAW_THRESHOLD;

    this.sustainCount = turned ? this.sustainCount + 1 : 0;
    return this.sustainCount >= Constants.HEAD_SUSTAIN_FRAMES;
  }

  reset(): void {
    this.sustainCount = 0;
  }
}
