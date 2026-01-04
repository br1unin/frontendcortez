export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function stars(rating: number) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return { full, half };
}
