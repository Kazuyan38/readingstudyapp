import { useEffect, useState } from 'react'
import { GlassCard } from '../components/ui/GlassCard'
import { ForecastBars } from '../components/viz/ForecastBars'
import { RetentionOrb } from '../components/viz/RetentionOrb'
import { db } from '../lib/db/schema'
import { estimateRetention } from '../lib/srs/retention'
import type { InsightCard } from '../lib/db/schema'

const DAY_MS = 24 * 60 * 60 * 1000

export function Stats() {
  const [cards, setCards] = useState<InsightCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.cards.toArray().then((rows) => {
      setCards(rows.filter((c) => !c.deletedAt))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="glass h-64 animate-pulse" />

  const now = Date.now()
  const forecast = Array.from({ length: 30 }, (_, i) => {
    const dayStart = now + i * DAY_MS
    const dayEnd = dayStart + DAY_MS
    return cards.filter((c) => c.dueAt >= dayStart && c.dueAt < dayEnd).length
  })

  const avgRetention =
    cards.length === 0
      ? 1
      : cards.reduce((sum, c) => sum + estimateRetention(c.lastReviewedAt, c.interval, now), 0) / cards.length

  return (
    <div className="flex flex-col gap-6">
      <GlassCard padding="lg">
        <h2 className="mb-4 text-lg">今後 30 日の復習予定</h2>
        <ForecastBars counts={forecast} />
      </GlassCard>

      <GlassCard padding="lg">
        <h2 className="mb-4 text-lg">記憶の状態（{cards.length} 枚）</h2>
        <p className="mb-4 text-sm text-(--text-muted)">平均保持率 {Math.round(avgRetention * 100)}%</p>
        <div className="flex flex-wrap gap-2">
          {cards.map((c) => (
            <RetentionOrb key={c.id} retention={estimateRetention(c.lastReviewedAt, c.interval, now)} />
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
