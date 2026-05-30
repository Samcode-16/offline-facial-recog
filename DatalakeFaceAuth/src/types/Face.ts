export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Keypoint {
  x: number;
  y: number;
}

export interface DetectedFace {
  boundingBox: BoundingBox;
  keypoints: Keypoint[]; // 6 keypoints from BlazeFace
  confidence: number;
}

export interface LandmarkPoint {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  z: number; // depth (relative)
}

export interface EnrolledPerson {
  id: string;
  name: string;
  employeeId: string;
  department?: string;
  enrolledAt: number;
  isActive: boolean;
}

export interface FaceEmbedding {
  id: string;
  personId: string;
  embedding: string; // base64-encoded encrypted Float32Array
  lightingCondition: string;
  createdAt: number;
}

export interface RecognitionResult {
  matched: boolean;
  person?: EnrolledPerson;
  confidence: number; // 0.0 to 1.0
  processingTimeMs: number;
}
