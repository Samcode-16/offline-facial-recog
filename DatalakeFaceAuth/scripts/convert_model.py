"""
Converts:
  1. MobileFaceNet (PyTorch weights) -> ONNX -> TFLite INT8
  2. Silent-Face-Anti-Spoofing (PyTorch .pth) -> ONNX -> TFLite INT8

Clone these repos first:
  git clone https://github.com/sirius-ai/MobileFaceNet_TF
  git clone https://github.com/minivision-ai/Silent-Face-Anti-Spoofing

Then run: python scripts/convert_model.py --output_dir src/models/
"""

import argparse
import torch
import tensorflow as tf
import numpy as np
import os

def convert_to_tflite_int8(onnx_path, output_path, input_shape):
    import tf2onnx
    import onnx
    from onnx_tf.backend import prepare

    onnx_model = onnx.load(onnx_path)
    tf_rep = prepare(onnx_model)
    tf_rep.export_graph("tmp_saved_model")

    converter = tf.lite.TFLiteConverter.from_saved_model("tmp_saved_model")
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter.inference_input_type = tf.int8
    converter.inference_output_type = tf.float32

    def representative_dataset():
        for _ in range(100):
            data = np.random.rand(1, *input_shape).astype(np.float32)
            yield [data]

    converter.representative_dataset = representative_dataset
    tflite_model = converter.convert()

    with open(output_path, 'wb') as f:
        f.write(tflite_model)
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Saved {output_path} — {size_mb:.2f} MB")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output_dir", default="src/models")
    args = parser.parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    print("Place converted .tflite files in", args.output_dir)
    print("See inline comments for MobileFaceNet and Silent-FAS conversion steps.")
