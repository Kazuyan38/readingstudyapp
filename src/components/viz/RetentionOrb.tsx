import { retentionBand } from '../../lib/srs/retention'

const BAND_COLOR: Record<ReturnType<typeof retentionBand>, string> = {
  fresh: 'var(--accent-warm)',
  normal: 'var(--accent)',
  fading: 'var(--text-muted)',
  faded: 'rgb(120 120 140 / 0.4)',
}

export function RetentionOrb({ retention, size = 14 }: { retention: number; size?: number }) {
  const band = retentionBand(retention)
  const color = BAND_COLOR[band]
  return (
    <span
      className="inline-block rounded-full transition-all duration-500"
      style={{
        width: size,
        height: size,
        background: color,
        opacity: 0.35 + retention * 0.65,
        boxShadow: band === 'fresh' ? `0 0 10px ${color}` : 'none',
      }}
    />
  )
}
