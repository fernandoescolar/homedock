/**
 * Returns a deterministic background image URL based on the current date.
 * Same date always returns the same image (picsum.photos seed-based URL).
 */
export function getDailyBackgroundUrl(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seed = `${y}-${m}-${d}`;
  // Use a large format to avoid blurry backgrounds on HiDPI screens
  return `https://picsum.photos/seed/${seed}/1920/1080`;
}
