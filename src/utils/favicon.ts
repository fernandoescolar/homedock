/**
 * Returns a favicon URL for a given page URL using DuckDuckGo's favicon service.
 * Falls back to empty string if the URL cannot be parsed.
 */
export function getFaviconUrl(pageUrl: string): string {
  try {
    const { hostname } = new URL(pageUrl);
    if (!hostname) return '';
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch {
    return '';
  }
}
