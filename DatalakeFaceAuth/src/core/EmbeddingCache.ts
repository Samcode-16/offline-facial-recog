import { FaceRepository } from "../database/FaceRepository";
import { SecurityUtils } from "../utils/SecurityUtils";
import { deserializeEmbedding, l2Normalize } from "../utils/EmbeddingUtils";
import { EnrolledPerson } from "../types/Face";

export interface CachedEntry {
  personId: string;
  person: EnrolledPerson;
  embedding: Float32Array; // Already decrypted, deserialized, L2-normalized
}

/**
 * In-memory store of all face embeddings.
 * SQLite cannot be read inside VisionCamera frame processor worklets.
 * Pre-load all embeddings at app start. Refresh after any enrollment change.
 * At 100 persons × 5 embeddings × 512 dims × 4 bytes = ~1 MB — safe.
 */
export class EmbeddingCache {
  private static _instance: EmbeddingCache;
  private entries: CachedEntry[] = [];

  static getInstance(): EmbeddingCache {
    if (!EmbeddingCache._instance)
      EmbeddingCache._instance = new EmbeddingCache();
    return EmbeddingCache._instance;
  }

  async loadAll(): Promise<void> {
    const raw = await FaceRepository.getAllEmbeddingsWithPersons();
    this.entries = await Promise.all(
      raw.map(async (r) => {
        const b64 = await SecurityUtils.decryptEmbedding(r.embedding);
        const vec = l2Normalize(deserializeEmbedding(b64));
        return { personId: r.personId, person: r.person, embedding: vec };
      }),
    );
  }

  async reload(): Promise<void> {
    this.entries = [];
    await this.loadAll();
  }

  getAll(): CachedEntry[] {
    return this.entries;
  }
  get count(): number {
    return this.entries.length;
  }
}
