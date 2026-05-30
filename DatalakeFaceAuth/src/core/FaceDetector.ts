import { loadTFLiteModel, TFLiteModel } from "react-native-fast-tflite";
import { DetectedFace, BoundingBox, Keypoint } from "../types/Face";
import { Constants } from "../utils/Constants";

/**
 * Wraps the BlazeFace TFLite model.
 * Input: 128×128 RGB float32 tensor normalized to [0, 1]
 * Output: decoded bounding boxes + 6 keypoints per face
 *
 * BlazeFace output tensors:
 *   Tensor 0: [1, 896, 16] raw box regressions (before anchor decoding)
 *   Tensor 1: [1, 896, 1]  classification scores (sigmoid → confidence)
 *
 * Anchor decoding:
 *   cx = score_cx * anchor_w + anchor_cx
 *   cy = score_cy * anchor_h + anchor_cy
 * Apply NMS with IoU threshold 0.3 to remove duplicates.
 */
export class FaceDetector {
  private model: TFLiteModel | null = null;

  async initialize(): Promise<void> {
    this.model = await loadTFLiteModel(
      require("../models/face_detector.tflite"),
    );
  }

  detect(inputTensor: Float32Array): DetectedFace[] {
    if (!this.model) throw new Error("FaceDetector not initialized");
    const outputs = this.model.runSync([inputTensor]);
    return this.decodeOutputs(outputs);
  }

  private decodeOutputs(outputs: any[]): DetectedFace[] {
    // Full implementation: decode BlazeFace anchors, apply sigmoid to scores,
    // filter by confidence > Constants.DETECTION_CONFIDENCE,
    // apply non-maximum suppression with IoU threshold 0.3,
    // return array of DetectedFace sorted by confidence descending.
    throw new Error("Implement BlazeFace output decoding and NMS");
  }

  /**
   * Validates that exactly one suitable face is in the frame.
   * Returns { valid: true, face } or { valid: false, reason: string }
   */
  validate(
    faces: DetectedFace[],
    frameW: number,
    frameH: number,
  ): { valid: boolean; reason?: string; face?: DetectedFace } {
    if (faces.length === 0) return { valid: false, reason: "NO_FACE" };
    if (faces.length > 1) return { valid: false, reason: "MULTIPLE_FACES" };

    const f = faces[0];
    const ratio =
      (f.boundingBox.width * f.boundingBox.height) / (frameW * frameH);
    if (ratio < Constants.MIN_FACE_RATIO)
      return { valid: false, reason: "TOO_FAR" };
    if (ratio > Constants.MAX_FACE_RATIO)
      return { valid: false, reason: "TOO_CLOSE" };
    if (f.confidence < Constants.DETECTION_CONFIDENCE)
      return { valid: false, reason: "LOW_CONFIDENCE" };

    const cx = f.boundingBox.x + f.boundingBox.width / 2;
    const cy = f.boundingBox.y + f.boundingBox.height / 2;
    if (Math.abs(cx - frameW / 2) > frameW * Constants.CENTER_TOLERANCE)
      return { valid: false, reason: "NOT_CENTERED" };
    if (Math.abs(cy - frameH / 2) > frameH * Constants.CENTER_TOLERANCE)
      return { valid: false, reason: "NOT_CENTERED" };

    return { valid: true, face: f };
  }
}
