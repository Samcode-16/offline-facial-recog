import { loadTFLiteModel, TFLiteModel } from "react-native-fast-tflite";
import { DetectedFace, RecognitionResult, EnrolledPerson } from "../types/Face";
import { l2Normalize } from "../utils/EmbeddingUtils";
import { LightingCorrector } from "../utils/LightingCorrector";
import { Constants } from "../utils/Constants";

/**
 * Extracts 512-dimensional face embeddings using MobileFaceNet INT8.
 *
 * Preprocessing pipeline (must be applied in this exact order):
 * 1. Crop face region using bounding box with 20% padding on each side
 * 2. Apply face alignment: rotate image so both eye keypoints are horizontal
 * 3. Apply CLAHE lighting correction
 * 4. Resize to 112×112
 * 5. Normalize pixels: value = (pixel - 127.5) / 128.0  → range [-1, 1]
 * 6. Flatten to Float32Array in HWC format: [112, 112, 3]
 *
 * Output: L2-normalized 512-dimensional Float32Array (unit vector)
 */
export class FaceRecognizer {
  private model: TFLiteModel | null = null;
  private lightingCorrector = new LightingCorrector();

  async initialize(): Promise<void> {
    this.model = await loadTFLiteModel(
      require("../models/face_recognizer.tflite"),
    );
  }

  preprocess(
    frame: Uint8Array,
    face: DetectedFace,
    frameW: number,
    frameH: number,
  ): Float32Array {
    // Implement: crop with 20% padding, align by eye keypoints, CLAHE, resize 112×112, normalize
    throw new Error("Implement face preprocessing pipeline");
  }

  extractEmbedding(preprocessed: Float32Array): Float32Array {
    if (!this.model) throw new Error("FaceRecognizer not initialized");
    const outputs = this.model.runSync([preprocessed]);
    return l2Normalize(new Float32Array(outputs[0]));
  }
}
