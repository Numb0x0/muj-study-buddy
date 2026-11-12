/**
 * Lightweight search tokenisation for Firestore.
 *
 * Firestore has no full-text search. Each note stores `searchTokens`: lower-cased
 * words and their prefixes (≥ 2 chars). A query uses one `array-contains` on the
 * most selective token and checks the rest in memory. PDF contents are NOT
 * indexed. Swap in Algolia/Typesense later via src/lib/queries/notes.ts.
 *
 * Budgets: structured fields (title, course code, subject, unit, type, tags)
 * always fit; the free-text description gets a separate, smaller budget so a
 * long description can never crowd them out.
 */

const STOP_WORDS = new Set(["the", "and", "of", "for", "to", "in", "on", "a", "an", "with", "by", "or", "at"]);
const MAX_TOKEN_LEN = 12;
const MIN_PREFIX_LEN = 2;
export const PRIMARY_TOKEN_BUDGET = 350;
export const SECONDARY_TOKEN_BUDGET = 150;

export function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** "Unit 3" / "unit-3" / "u3" → "unit3" so a unit number is searchable as one token. */
function joinUnits(text: string): string {
  return text.replace(/\b(?:unit|u)[\s_-]*(\d{1,2})\b/gi, "unit$1");
}

/** Split free text into normalised words (no prefixes). */
export function tokenizeQuery(text: string): string[] {
  return Array.from(
    new Set(
      joinUnits(text)
        .split(/[\s,./()_-]+/)
        .map(normalizeWord)
        .filter((w) => w.length >= MIN_PREFIX_LEN && !STOP_WORDS.has(w))
        .map((w) => w.slice(0, MAX_TOKEN_LEN)),
    ),
  );
}

function addPrefixes(into: Set<string>, parts: Array<string | null | undefined>, budget: number) {
  const limit = into.size + budget;
  for (const part of parts) {
    if (!part) continue;
    for (const word of tokenizeQuery(part)) {
      for (let i = MIN_PREFIX_LEN; i <= word.length; i++) {
        if (into.size >= limit) return;
        into.add(word.slice(0, i));
      }
    }
  }
}

/**
 * Build the stored token array. `primary` fields are indexed first and in
 * order; `secondary` text (e.g. a description) only uses its own budget.
 */
export function buildSearchTokens(primary: Array<string | null | undefined>, secondary: Array<string | null | undefined> = []): string[] {
  const tokens = new Set<string>();
  addPrefixes(tokens, primary, PRIMARY_TOKEN_BUDGET);
  addPrefixes(tokens, secondary, SECONDARY_TOKEN_BUDGET);
  return Array.from(tokens);
}

/** Pick the token most likely to narrow the result set (longest). */
export function pickPrimaryToken(tokens: string[]): string | null {
  if (!tokens.length) return null;
  return [...tokens].sort((a, b) => b.length - a.length)[0];
}

/** True when every query token is a prefix of some stored token. */
export function matchesAllTokens(storedTokens: string[], queryTokens: string[]): boolean {
  const set = new Set(storedTokens);
  return queryTokens.every((t) => set.has(t));
}
