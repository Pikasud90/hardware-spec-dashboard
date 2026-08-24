/**
 * Trigram search engine — a faithful TypeScript port of PostgreSQL `pg_trgm`.
 *
 * The original design leaned on a GIN trigram index in Postgres. A standalone,
 * offline bundle has no database, so the same algorithm runs in the client
 * against a precomputed index. Over a catalogue of this size the whole query
 * costs well under a millisecond, so the sub-15ms search-as-you-type budget is
 * met with room to spare and without a network round trip.
 *
 * `pg_trgm` semantics reproduced here:
 *  - the string is lowercased and every non-alphanumeric run becomes a break;
 *  - each word is padded to `"  word "` (two leading spaces, one trailing);
 *  - trigrams are the 3-character windows of that padded form;
 *  - `similarity(a, b)` is the Jaccard index |A n B| / |A u B|.
 *
 * Two additions on top of stock `pg_trgm`, both aimed at how people actually
 * type part numbers:
 *  - *containment* scoring (|A n B| / |A|), so a short query is not penalised
 *    for the target having many trigrams it does not share;
 *  - an *alphanumeric-compressed* pass, so "rtx4090" matches "RTX 4090" and
 *    "5800x3d" matches "AMD Ryzen 7 5800X3D" regardless of spacing.
 */

/** Default cut-off, matching Postgres' `pg_trgm.similarity_threshold`. */
export const SIMILARITY_THRESHOLD = 0.2;

/** Lowercase and collapse every non-alphanumeric run into a single space. */
export function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Strip everything except alphanumerics — "RTX 4090" becomes "rtx4090". */
export function compressText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Trigram set for a string, using Postgres' word-padding convention.
 */
export function trigrams(text: string): Set<string> {
  const set = new Set<string>();
  const words = normaliseText(text).split(" ").filter(Boolean);
  for (const word of words) {
    const padded = `  ${word} `;
    for (let i = 0; i + 3 <= padded.length; i++) {
      set.add(padded.slice(i, i + 3));
    }
  }
  return set;
}

function intersectionSize(a: Set<string>, b: Set<string>): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let count = 0;
  for (const gram of small) if (large.has(gram)) count += 1;
  return count;
}

/** Postgres `similarity(a, b)` — Jaccard index over trigram sets. */
export function similarity(a: string, b: string): number {
  const setA = trigrams(a);
  const setB = trigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  const shared = intersectionSize(setA, setB);
  const union = setA.size + setB.size - shared;
  return union === 0 ? 0 : shared / union;
}

/** Fraction of the query's trigrams present in the target. */
function containment(query: Set<string>, target: Set<string>): number {
  if (query.size === 0) return 0;
  return intersectionSize(query, target) / query.size;
}

/* --------------------------------------------------------------- indexing */

export interface SearchDocument {
  id: string;
  /** Primary display string; drives the strongest match signals. */
  name: string;
  /** Secondary haystack (brand, series, socket, chipset, ...). */
  keywords: string;
}

interface IndexedDocument extends SearchDocument {
  nameNormalised: string;
  nameCompressed: string;
  keywordsCompressed: string;
  nameTrigrams: Set<string>;
  keywordTrigrams: Set<string>;
}

export interface SearchIndex {
  documents: IndexedDocument[];
}

export function buildSearchIndex(documents: readonly SearchDocument[]): SearchIndex {
  return {
    documents: documents.map((document) => ({
      ...document,
      nameNormalised: normaliseText(document.name),
      nameCompressed: compressText(document.name),
      keywordsCompressed: compressText(document.keywords),
      nameTrigrams: trigrams(document.name),
      keywordTrigrams: trigrams(`${document.name} ${document.keywords}`),
    })),
  };
}

export interface SearchHit {
  id: string;
  score: number;
  /** Which signal produced the score — surfaced as a badge in the palette. */
  matchKind: "exact" | "prefix" | "substring" | "fuzzy";
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  /** Restrict results to this subset of document ids. */
  allowedIds?: ReadonlySet<string>;
}

/**
 * Score one document against a prepared query. Signals are combined with
 * `max`, not a sum, so a strong exact-prefix match is never diluted by a weak
 * fuzzy score on the same record.
 */
function scoreDocument(
  document: IndexedDocument,
  queryNormalised: string,
  queryCompressed: string,
  queryTrigrams: Set<string>,
): SearchHit | null {
  if (document.nameNormalised === queryNormalised) {
    return { id: document.id, score: 1, matchKind: "exact" };
  }

  if (document.nameCompressed.startsWith(queryCompressed)) {
    // Shorter targets are the better answer for a prefix: typing "9800" should
    // favour "Ryzen 7 9800X3D" over a longer motherboard bundle name.
    const lengthRatio = queryCompressed.length / document.nameCompressed.length;
    return { id: document.id, score: 0.9 + 0.09 * lengthRatio, matchKind: "prefix" };
  }

  if (document.nameCompressed.includes(queryCompressed)) {
    const lengthRatio = queryCompressed.length / document.nameCompressed.length;
    return { id: document.id, score: 0.78 + 0.1 * lengthRatio, matchKind: "substring" };
  }

  if (document.keywordsCompressed.includes(queryCompressed) && queryCompressed.length >= 2) {
    return { id: document.id, score: 0.7, matchKind: "substring" };
  }

  const nameContainment = containment(queryTrigrams, document.nameTrigrams);
  const nameSimilarity = (() => {
    const shared = intersectionSize(queryTrigrams, document.nameTrigrams);
    const union = queryTrigrams.size + document.nameTrigrams.size - shared;
    return union === 0 ? 0 : shared / union;
  })();
  const keywordContainment = containment(queryTrigrams, document.keywordTrigrams);

  // Containment dominates because queries are short; Jaccard breaks ties by
  // preferring targets that are not padded out with unrelated tokens.
  const fuzzy = Math.max(
    nameContainment * 0.65 + nameSimilarity * 0.35,
    keywordContainment * 0.45,
  );

  return fuzzy > 0 ? { id: document.id, score: fuzzy, matchKind: "fuzzy" } : null;
}

export function search(
  index: SearchIndex,
  rawQuery: string,
  options: SearchOptions = {},
): SearchHit[] {
  const { limit = 12, threshold = SIMILARITY_THRESHOLD, allowedIds } = options;

  const queryNormalised = normaliseText(rawQuery);
  const queryCompressed = compressText(rawQuery);
  if (queryCompressed.length === 0) return [];

  const queryTrigrams = trigrams(rawQuery);

  const hits: SearchHit[] = [];
  for (const document of index.documents) {
    if (allowedIds && !allowedIds.has(document.id)) continue;
    const hit = scoreDocument(document, queryNormalised, queryCompressed, queryTrigrams);
    if (hit && hit.score >= threshold) hits.push(hit);
  }

  hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return hits.slice(0, limit);
}

/* ------------------------------------------------------------ highlighting */

export interface HighlightSegment {
  text: string;
  matched: boolean;
}

/**
 * Split `text` so the palette can bold the part the user actually typed.
 * Matching ignores spacing and punctuation, but the returned segments preserve
 * the original characters exactly.
 */
export function highlightMatch(text: string, rawQuery: string): HighlightSegment[] {
  const queryCompressed = compressText(rawQuery);
  if (queryCompressed.length === 0) return [{ text, matched: false }];

  // Map each compressed character back to its index in the original string.
  const positions: number[] = [];
  let compressed = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i].toLowerCase();
    if (/[a-z0-9]/.test(char)) {
      compressed += char;
      positions.push(i);
    }
  }

  const start = compressed.indexOf(queryCompressed);
  if (start === -1) return [{ text, matched: false }];

  const from = positions[start];
  const to = positions[start + queryCompressed.length - 1] + 1;

  return [
    { text: text.slice(0, from), matched: false },
    { text: text.slice(from, to), matched: true },
    { text: text.slice(to), matched: false },
  ].filter((segment) => segment.text.length > 0);
}
