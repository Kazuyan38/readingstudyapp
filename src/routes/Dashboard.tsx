import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'
import { Ring } from '../components/ui/Ring'
import { BookCover } from '../components/book/BookCover'
import { listBooks, listDueCards, getSettings } from '../lib/db/repository'
import type { Book, InsightCard } from '../lib/db/schema'

export function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [dueCount, setDueCount] = useState(0)
  const [reviewLimit, setReviewLimit] = useState(60)
  const [reading, setReading] = useState<Book[]>([])
  const [, setDueCards] = useState<InsightCard[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [books, due, settings] = await Promise.all([listBooks(), listDueCards(Date.now()), getSettings()])
      if (cancelled) return
      setReading(books.filter((b) => b.status === 'reading').slice(0, 6))
      setDueCards(due)
      setDueCount(Math.min(due.length, settings.dailyReviewLimit))
      setReviewLimit(settings.dailyReviewLimit)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <div className="glass h-64 animate-pulse" />
  }

  return (
    <div className="flex flex-col gap-8">
      <GlassCard padding="lg" className="flex flex-col items-center gap-6 text-center">
        <p className="text-(--text-muted)">今日、思い出すべきこと</p>
        <Ring value={reviewLimit ? dueCount / reviewLimit : 0} label={String(dueCount)} size={140} />
        <Link to="/review">
          <GlassButton variant="primary" disabled={dueCount === 0}>
            {dueCount > 0 ? '復習をはじめる' : '今日はここまで'}
          </GlassButton>
        </Link>
      </GlassCard>

      <section>
        <h2 className="mb-3 text-lg">読書中</h2>
        {reading.length === 0 ? (
          <p className="text-sm text-(--text-muted)">
            読書中の本がありません。<Link to="/library" className="underline">蔵書</Link>から本を登録しましょう。
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {reading.map((book) => (
              <Link key={book.id} to={`/books/${book.id}`}>
                <BookCover book={book} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
