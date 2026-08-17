/**
 * 記憶保持率の推定（docs/DESIGN.md §3.3）。UI の発光・不透明度に直結させる。
 * R(t) = 0.9 ^ (t / I) — 前回復習日でちょうど 90% になるモデル。
 */
export function estimateRetention(lastReviewedAt: number | null, interval: number, now: number): number {
  if (!lastReviewedAt || interval <= 0) return 1
  const elapsedDays = (now - lastReviewedAt) / (24 * 60 * 60 * 1000)
  if (elapsedDays <= 0) return 1
  return Math.pow(0.9, elapsedDays / interval)
}

export type RetentionBand = 'fresh' | 'normal' | 'fading' | 'faded'

export function retentionBand(r: number): RetentionBand {
  if (r >= 0.9) return 'fresh'
  if (r >= 0.7) return 'normal'
  if (r >= 0.5) return 'fading'
  return 'faded'
}
