import { loadTFLiteModel, TFLiteModel } from "react-native-fast-tflite";
import { BoundingBox } from "../types/Face";
import { Constants } from "../utils/Constants";

/**
 * Passive anti-spoofing using the Silent-Face-Anti-Spoofing two-model approach.
 *
 * The same face is cropped at two different scales:
 *   Scale 1 (crop_ratio = 2.7): wider context crop → model 1
 *   Scale 2 (crop_ratio = 4.0): tighter crop → model 2
 *
 * Crop formula for each scale (ratio = r):
 *   centerX = box.x + box.width / 2
 *   centerY = box.y + box.height / 2
 *   halfSize = Math.max(box.width, box.height) * r / 2
 *   cropX    = centerX - halfSize
 *   cropY    = centerY - halfSize * 0.75   ← slight upward offset
 *   cropSize = halfSize * 2
 * Resize crop to 80×80 pixels. Input: float32 normalized to [0, 1].
 *
 * Each model outputs [spoof_score, real_score].
 * Final real_score = average of both models' real_score.
 * If final real_score > ANTI_SPOOF_THRESHOLD (0.60) → REAL face → pass.
 *
 * Run across ANTI_SPOOF_FRAMES (3) consecutive frames and average.
 * This reduces false positives from single-frame noise.
 */
export class AntiSpoofDetector {
  private model1: TFLiteModel | null = null;
  private model2: TFLiteModel | null = null;

  async initialize(): Promise<void> {
    [this.model1, this.model2] = await Promise.all([
      loadTFLiteModel(require("../models/anti_spoof_1.tflite")),
      loadTFLiteModel(require("../models/anti_spoof_2.tflite")),
    ]);
  }

  analyzeFrame(
    frame: Uint8Array,
    box: BoundingBox,
    frameW: number,
    frameH: number,
  ): { realScore: number; spoofScore: number } {
    const crop1 = this.cropFace(
      frame,
      box,
      frameW,
      frameH,
      Constants.ANTI_SPOOF_CROP_RATIO_1,
    );
    const crop2 = this.cropFace(
      frame,
      box,
      frameW,
      frameH,
      Constants.ANTI_SPOOF_CROP_RATIO_2,
    );

    const out1 = this.model1!.runSync([crop1])[0] as Float32Array;
    const out2 = this.model2!.runSync([crop2])[0] as Float32Array;

    const realScore = (out1[1] + out2[1]) / 2;
    return { realScore, spoofScore: 1 - realScore };
  }

  analyzeMultiFrame(
    frames: Array<{
      data: Uint8Array;
      box: BoundingBox;
      frameW: number;
      frameH: number;
    }>,
  ): { isReal: boolean; realScore: number } {
    const scores = frames.map((f) =>
      this.analyzeFrame(f.data, f.box, f.frameW, f.frameH),
    );
    const avg = scores.reduce((s, r) => s + r.realScore, 0) / scores.length;
    return { isReal: avg > Constants.ANTI_SPOOF_THRESHOLD, realScore: avg };
  }

  private cropFace(
    frame: Uint8Array,
    box: BoundingBox,
    frameW: number,
    frameH: number,
    ratio: number,
  ): Float32Array {
    // Implement: apply crop formula above, bilinear resize to 80×80, normalize to [0,1]
    throw new Error(
      "Implement: crop at given ratio, resize to 80×80, normalize to Float32Array",
    );
  }
}
