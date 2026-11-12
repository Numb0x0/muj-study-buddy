// Copies the pdf.js worker that matches react-pdf's pdfjs-dist version into public/,
// so the viewer never depends on a third-party CDN. Runs on `npm install` (postinstall).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
let pkgDir;
try {
  pkgDir = dirname(require.resolve("pdfjs-dist/package.json", { paths: [dirname(require.resolve("react-pdf"))] }));
} catch {
  console.warn("[copy-pdf-worker] pdfjs-dist not found; skipping");
  process.exit(0);
}
const src = join(pkgDir, "build", "pdf.worker.min.mjs");
const outDir = join(process.cwd(), "public", "pdfjs");
if (!existsSync(src)) {
  console.warn(`[copy-pdf-worker] ${src} missing; skipping`);
  process.exit(0);
}
mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, "pdf.worker.min.mjs"));
console.log(`[copy-pdf-worker] pdf.js worker ${require(join(pkgDir, "package.json")).version} → public/pdfjs/`);
