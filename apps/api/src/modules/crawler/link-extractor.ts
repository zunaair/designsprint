/**
 * Extracts same-domain links from HTML for multi-page crawling.
 * Deduplicates, normalizes, and respects maxPages limit.
 */
export function extractLinks(html: string, baseUrl: string, maxPages: number): string[] {
  const base = new URL(baseUrl);
  const seen = new Set<string>([normalizeUrl(baseUrl)]);
  const links: string[] = [];

  // Match all <a href="..."> in the HTML
  const hrefRegex = /<a\s[^>]*href\s*=\s*["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    if (links.length >= maxPages - 1) break; // -1 because root URL is already counted

    const href = match[1];
    if (!href) continue;

    try {
      const resolved = new URL(href, baseUrl);

      // Only same-domain links
      if (resolved.hostname !== base.hostname) continue;

      // Skip non-HTTP protocols
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') continue;

      // Skip common non-page extensions
      if (/\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|woff|woff2|ttf|ico)$/i.test(resolved.pathname)) continue;

      const normalized = normalizeUrl(resolved.href);
      if (seen.has(normalized)) continue;

      seen.add(normalized);
      links.push(resolved.href);
    } catch {
      // Invalid URL — skip
    }
  }

  return links;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove trailing slash, hash, and common tracking params
    let path = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.protocol}//${u.hostname}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}
