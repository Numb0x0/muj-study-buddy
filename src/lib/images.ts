/** Hosts listed in next.config images.remotePatterns; anything else must render unoptimised. */
const OPTIMIZED_HOSTS = ["lh3.googleusercontent.com", "images.unsplash.com"];

/** True when next/image can optimise this src (local path or allow-listed host, not SVG). */
export function canOptimizeImage(src: string): boolean {
  if (/\.svg(\?|$)/i.test(src)) return false;
  if (src.startsWith("/")) return true;
  try {
    return OPTIMIZED_HOSTS.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}
