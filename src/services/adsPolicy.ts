export type AdProvider = 'none' | 'admob' | 'sponsor';
export function adPlacementAllowed(path: string) {
  return path === '/' || path === '/galpon';
}
export function sponsorLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}
export function bannerId(
  platform: string,
  testMode: boolean,
  configured: string | undefined,
  testId: string,
) {
  if (!['android', 'ios'].includes(platform)) return null;
  if (testMode) return testId;
  return configured && /^ca-app-pub-\d+\/\d+$/.test(configured) ? configured : null;
}
