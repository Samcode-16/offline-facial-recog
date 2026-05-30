/**
 * L2-normalize a Float32Array to a unit vector.
 * Always normalize before storing or comparing embeddings.
 */
export function l2Normalize(embedding: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < embedding.length; i++)
    norm += embedding[i] * embedding[i];
  norm = Math.sqrt(norm) + 1e-10;
  return new Float32Array(embedding.map((v) => v / norm));
}

/**
 * Cosine similarity between two L2-normalized unit vectors.
 * Returns a value from -1 (opposite) to 1 (identical).
 * For L2-normalized vectors this is equivalent to the dot product.
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

/**
 * Serialize a Float32Array to a base64 string for SQLite storage.
 */
export function serializeEmbedding(embedding: Float32Array): string {
  return Buffer.from(embedding.buffer).toString("base64");
}

/**
 * Deserialize a base64 string back to a Float32Array.
 */
export function deserializeEmbedding(b64: string): Float32Array {
  const buf = Buffer.from(b64, "base64");
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
