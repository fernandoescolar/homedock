/**
 * Converts a hex color + opacity to an rgba() CSS string.
 * Falls back to transparent on invalid input.
 */
export function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(255,255,255,${opacity})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(255,255,255,${opacity})`;
  return `rgba(${r},${g},${b},${opacity})`;
}
