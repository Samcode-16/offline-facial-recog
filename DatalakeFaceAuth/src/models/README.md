# TensorFlow Lite Models for Offline Facial Recognition

This directory contains TensorFlow Lite (.tflite) model files required for the face authentication system.

## Models Overview

| Model                    | Purpose                      | Size    | Source                          |
| ------------------------ | ---------------------------- | ------- | ------------------------------- |
| `face_detector.tflite`   | Detect faces in images       | ~350 KB | MediaPipe BlazeFace short-range |
| `face_landmark.tflite`   | Extract 468 facial landmarks | ~2.9 MB | MediaPipe Face Mesh             |
| `face_recognizer.tflite` | Generate face embeddings     | ~2 MB   | MobileFaceNet (INT8)            |
| `anti_spoof_1.tflite`    | Detect spoofing (scale 1)    | ~1.5 MB | Silent-Face-Anti-Spoofing       |
| `anti_spoof_2.tflite`    | Detect spoofing (scale 2)    | ~1.5 MB | Silent-Face-Anti-Spoofing       |

**Total Size:** ~8.25 MB (well within 20 MB budget)

---

## Download Instructions

### 1. Face Detector (`face_detector.tflite`)

**Model:** MediaPipe BlazeFace (short-range)  
**Size:** ~350 KB

**Option A: Direct Download**

```bash
# Using gdown
python -c "import gdown; gdown.download('https://storage.googleapis.com/mediapipe-tasks/face_detector/face_detection_short_range.tflite', 'src/models/face_detector.tflite', quiet=False)"
```

**Option B: Manual Download**
Visit: https://storage.googleapis.com/mediapipe-tasks/face_detector/face_detection_short_range.tflite

---

### 2. Face Landmark (`face_landmark.tflite`)

**Model:** MediaPipe Face Mesh (468 points)  
**Size:** ~2.9 MB

**Option A: Direct Download**

```bash
# Using gdown
python -c "import gdown; gdown.download('https://storage.googleapis.com/mediapipe-tasks/face_landmarker/face_landmarker.task', 'src/models/face_landmark.tflite', quiet=False)"
```

**Option B: Manual Download**
Visit: https://storage.googleapis.com/mediapipe-tasks/face_landmarker/face_landmarker.task

---

### 3. Face Recognizer (`face_recognizer.tflite`)

**Model:** MobileFaceNet INT8 Quantized  
**Size:** ~2 MB

**Steps:**

1. Clone the repository:

   ```bash
   git clone https://github.com/sirius-ai/MobileFaceNet_TF.git
   cd MobileFaceNet_TF
   ```

2. Follow the conversion guide in the repo to convert to TFLite

3. Or download pre-converted model:
   ```bash
   # Download from releases if available
   # Place the INT8 quantized model in src/models/face_recognizer.tflite
   ```

Repository: https://github.com/sirius-ai/MobileFaceNet_TF

---

### 4. Anti-Spoof Model Scale 1 (`anti_spoof_1.tflite`)

**Model:** Silent-Face-Anti-Spoofing (Scale 1)  
**Size:** ~1.5 MB

**Steps:**

1. Clone the repository:

   ```bash
   git clone https://github.com/minivision-ai/Silent-Face-Anti-Spoofing.git
   cd Silent-Face-Anti-Spoofing
   ```

2. Download the pretrained model and convert to TFLite

3. Or download from model zoo:
   ```bash
   # Follow repo instructions to get the model
   ```

Repository: https://github.com/minivision-ai/Silent-Face-Anti-Spoofing

---

### 5. Anti-Spoof Model Scale 2 (`anti_spoof_2.tflite`)

**Model:** Silent-Face-Anti-Spoofing (Scale 2)  
**Size:** ~1.5 MB

Same repository as anti_spoof_1. Download the scale 2 variant.

---

## Automated Download Script

Create a file `download_models.py` in the project root to automate downloads:

```python
import os
import gdown
from pathlib import Path

MODELS_DIR = Path("DatalakeFaceAuth/src/models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Model URLs (update with actual working URLs)
MODELS = {
    "face_detector.tflite": "https://storage.googleapis.com/mediapipe-tasks/face_detector/face_detection_short_range.tflite",
    "face_landmark.tflite": "https://storage.googleapis.com/mediapipe-tasks/face_landmarker/face_landmarker.task",
}

for model_name, url in MODELS.items():
    model_path = MODELS_DIR / model_name
    if model_path.exists():
        print(f"✓ {model_name} already exists")
    else:
        print(f"⬇️  Downloading {model_name}...")
        try:
            gdown.download(url, str(model_path), quiet=False)
            print(f"✓ Successfully downloaded {model_name}")
        except Exception as e:
            print(f"✗ Failed to download {model_name}: {e}")

print("\n📋 Model Status:")
for model_file in ["face_detector.tflite", "face_landmark.tflite", "face_recognizer.tflite", "anti_spoof_1.tflite", "anti_spoof_2.tflite"]:
    model_path = MODELS_DIR / model_file
    if model_path.exists():
        size_kb = model_path.stat().st_size / 1024
        print(f"  ✓ {model_file}: {size_kb:.1f} KB")
    else:
        print(f"  ✗ {model_file}: NOT FOUND")
```

Run with:

```bash
cd DatalakeFaceAuth && python download_models.py
```

---

## Placeholder Files

The following empty placeholder files are created for git tracking:

- `face_detector.tflite` ← Download and replace
- `face_landmark.tflite` ← Download and replace
- `face_recognizer.tflite` ← Download and replace
- `anti_spoof_1.tflite` ← Download and replace
- `anti_spoof_2.tflite` ← Download and replace

---

## Notes

1. **Model Licenses:** Each model has its own license. Review before deployment:
   - MediaPipe models: Apache 2.0
   - MobileFaceNet: Custom (check repo)
   - Silent-Face-Anti-Spoofing: Custom (check repo)

2. **Model Conversion:** Some models may need conversion from PyTorch/SavedModel to TFLite format using:

   ```bash
   python -m tensorflow.lite.converter --export_format=TFLITE --model_input_path=model.pb --output_file=model.tflite
   ```

3. **.gitignore:** The `.gitignore` file ignores `*.tflite` files to prevent committing large binaries. Use Git LFS if version control is needed.

4. **Testing:** After downloading, verify model integrity:
   ```bash
   ls -lh src/models/
   ```

---

## Questions?

Refer to individual model repositories for detailed documentation and conversion guides.
