/**
 * A tiny two-level cache for on-device tool intermediates, keyed by
 * (sourceKey, quality).
 *
 * Why the sourceKey level exists — ACCURACY: a cached quality is only valid
 * while the underlying image is unchanged. The modal bumps its source
 * generation id whenever the working image changes (a new gallery pick, or an
 * AI render adopted for further on-device editing), so entries from a previous
 * image can never be served for the new one — switching back to an
 * already-processed quality is instant, but only when it truly is the same
 * picture.
 *
 * Retention is capped at the 2 most recent source generations (insertion
 * order): the current one, plus the previous one so "Back to preview" after an
 * AI generate keeps its instant quality switches. Older generations are
 * dropped to keep blob RAM bounded on low-memory devices.
 */
export function createSourceCache(maxSources = 2) {
  /** @type {Map<string|number, Map<string, object>>} sourceKey → (quality → entry) */
  const bySource = new Map();

  return {
    /** The cached entry for (sourceKey, quality), or null. */
    get(sourceKey, quality) {
      return bySource.get(sourceKey)?.get(quality) || null;
    },

    /** True when (sourceKey, quality) is already cached (cheap peek — no read). */
    has(sourceKey, quality) {
      return !!bySource.get(sourceKey)?.get(quality);
    },

    /** Store an entry, evicting the oldest source generation past the cap. */
    set(sourceKey, quality, entry) {
      let perQuality = bySource.get(sourceKey);
      if (!perQuality) {
        perQuality = new Map();
        bySource.set(sourceKey, perQuality);
        while (bySource.size > maxSources) {
          const oldest = bySource.keys().next().value;
          bySource.delete(oldest);
          console.log(`🧹 [source-cache] dropped stale source generation ${oldest}`);
        }
      }
      perQuality.set(quality, entry);
    },

    /** Drop everything (tool dispose). */
    clear() {
      bySource.clear();
    },
  };
}
