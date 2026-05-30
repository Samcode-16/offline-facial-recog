import { cosineSimilarity } from "../utils/EmbeddingUtils";
import { Constants } from "../utils/Constants";
import { RecognitionResult, EnrolledPerson } from "../types/Face";
import { EmbeddingCache } from "./EmbeddingCache";

export class EmbeddingMatcher {
  /**
   * Compares a query embedding against all cached embeddings.
   * For persons with multiple stored embeddings, uses the MAXIMUM similarity
   * across all of their embeddings (best match wins per person).
   * Returns the best-matching person if similarity > MATCH_THRESHOLD.
   * Returns matched=false if best similarity < REJECT_THRESHOLD.
   * Returns matched=false with no person if similarity is between thresholds
   * (uncertain zone — require retry, do not reveal the candidate identity).
   */
  match(queryEmbedding: Float32Array): RecognitionResult {
    const cache = EmbeddingCache.getInstance().getAll();
    const start = Date.now();

    // Group by person and find best similarity per person
    const personScores = new Map<
      string,
      { person: EnrolledPerson; score: number }
    >();

    for (const cached of cache) {
      const sim = cosineSimilarity(queryEmbedding, cached.embedding);
      const existing = personScores.get(cached.personId);
      if (!existing || sim > existing.score) {
        personScores.set(cached.personId, {
          person: cached.person,
          score: sim,
        });
      }
    }

    // Find the overall best match
    let bestScore = -1;
    let bestPerson: EnrolledPerson | undefined;
    personScores.forEach(({ person, score }) => {
      if (score > bestScore) {
        bestScore = score;
        bestPerson = person;
      }
    });

    return {
      matched: bestScore > Constants.MATCH_THRESHOLD,
      person: bestScore > Constants.MATCH_THRESHOLD ? bestPerson : undefined,
      confidence: Math.max(0, bestScore),
      processingTimeMs: Date.now() - start,
    };
  }
}
