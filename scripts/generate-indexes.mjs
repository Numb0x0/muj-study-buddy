/**
 * Generates firestore.indexes.json deterministically from the query shapes in
 * src/lib/queries/notes.ts. Run: node scripts/generate-indexes.mjs
 *
 * Notes query = status(=) + [scope(=)] + [resourceType(=)] + [unitNumber(=)]
 *               + [searchTokens|tags (array-contains)] + orderBy(publishedAt|updatedAt)
 */
import { writeFileSync } from "node:fs";

const asc = (f) => ({ fieldPath: f, order: "ASCENDING" });
const desc = (f) => ({ fieldPath: f, order: "DESCENDING" });
const arr = (f) => ({ fieldPath: f, arrayConfig: "CONTAINS" });
const idx = (collectionGroup, fields) => ({ collectionGroup, queryScope: "COLLECTION", fields });

const indexes = [];
// departmentId filters are resolved to `programId in [...]` which shares the programId index.
const scopes = [null, "programId", "semesterId", "subjectId"];
const types = [false, true];
const units = [false, true];
const arrays = [null, "searchTokens", "tags"];
// Public search sorts by publishedAt (newest or oldest); admin lists sort by updatedAt (newest).
// Composite indexes are direction-specific, so each needed direction is listed.
const orders = [
  ["publishedAt", "desc"],
  ["publishedAt", "asc"],
  ["updatedAt", "desc"],
];

for (const scope of scopes)
  for (const t of types)
    for (const u of units)
      for (const a of arrays)
        for (const [o, d] of orders) {
            const dir = d === "desc" ? desc : asc;
            const fields = [asc("status")];
            if (scope) fields.push(asc(scope));
            if (t) fields.push(asc("resourceType"));
            if (u) fields.push(asc("unitNumber"));
            if (a) fields.push(arr(a));
            fields.push(dir(o));
            // single-field (status + order) needs no composite when no other fields,
            // but Firestore still requires one for equality+orderBy on different fields.
            indexes.push(idx("notes", fields));
          }

// Duplicate detection + misc
indexes.push(idx("notes", [asc("subjectId"), asc("titleLower")]));
indexes.push(idx("notes", [asc("contentHash"), desc("updatedAt")]));
indexes.push(idx("auditLogs", [asc("targetId"), desc("createdAt")]));

// De-dupe
const seen = new Set();
const unique = indexes.filter((i) => {
  const k = JSON.stringify(i);
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

// Uploaded PDF chunks: never queried by content, so don't index the ~1 MB bytes field.
const fieldOverrides = [{ collectionGroup: "chunks", fieldPath: "data", indexes: [] }];

writeFileSync("firestore.indexes.json", JSON.stringify({ indexes: unique, fieldOverrides }, null, 2) + "\n");
console.log(`wrote ${unique.length} indexes`);
