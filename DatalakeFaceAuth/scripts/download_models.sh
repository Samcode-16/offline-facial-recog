(.venv) PS D:\BCA\hackathons\offline-facial-recog\DatalakeFaceAuth> npx metro start
Error: Cannot find module '@react-native/metro-config'
Require stack:
- D:\BCA\hackathons\offline-facial-recog\DatalakeFaceAuth\metro.config.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (D:\BCA\hackathons\offline-facial-recog\DatalakeFaceAuth\metro.config.js:1:43)
    at Module._compile (node:internal/modules/cjs/loader:1706:14)
(.venv) PS D:\BCA\hackathons\offline-facial-recog\DatalakeFaceAuth> #!/bin/bash
set -e
MODELS_DIR="src/models"
mkdir -p $MODELS_DIR

echo "Downloading BlazeFace detector..."
curl -L "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite" \
  -o "$MODELS_DIR/face_detector.tflite"

echo "Downloading Face Landmark model..."
curl -L "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task" \
  -o "$MODELS_DIR/face_landmark.tflite"

echo "Done. Now run: python scripts/convert_model.py to get MobileFaceNet and Anti-Spoof models."

# Copy to Android assets
mkdir -p android/app/src/main/assets/models
cp $MODELS_DIR/*.tflite android/app/src/main/assets/models/
echo "Copied to Android assets."
echo "For iOS: drag the models/ folder into Xcode under the DatalakeFaceAuth target."
