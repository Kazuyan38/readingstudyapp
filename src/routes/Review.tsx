import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'
import { listDueCards, getSettings, updateCard, appendReviewLog, getBook } from '../lib/db/repository'
import { buildTodayQueue } from '../lib/srs/queue'
import { applyReview, type ReviewQuality } from '../lib/srs/scheduler'
import type { InsightCard } from '../lib/db/schema'

const GRADES: { quality: ReviewQuality; label: string; variant: 'ghost' | 'primary' | 'danger' }[] = [
  { quality: 1, label: 'もう一度', variant: 'danger' },
  { quality: 3, label: 'むずかしい', variant: 'ghost' },
  { quality: 4, label: 'ふつう', variant: 'ghost' },
  { quality: 5, label: 'かんたん', variant: 'primary' },
]

export function Review() {
  const [queue, setQueue] = useState<InsightCard[] | null>(null)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [bookTitle, setBookTitle] = useState('')
  const [startedAt, setStartedAt] = useState(Date.now())
  const [deferred, setDeferred] = useState(0)

  useEffect(() => {
    async function load() {
      const [due, settings] = await Promise.all([listDueCards(Date.now()), getSettings()])
      const { queue: q, deferred: d } = buildTodayQueue(due, settings.dailyReviewLimit)
      setQueue(q)
      setDeferred(d)
    }
    load()
  }, [])

  const current = queue?.[index]

  useEffect(() => {
    if (!current) return
    getBook(current.bookId).then((b) => setBookTitle(b?.title ?? ''))
    setStartedAt(Date.now())
    setRevealed(false)
  }, [current])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return
      if (!revealed && e.code === 'Space') {
        e.preventDefault()
        setRevealed(true)
        return
      }
      if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
        const grade = GRADES[Number(e.key) - 1]
        if (grade) handleGrade(grade.quality)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, revealed])

  async function handleGrade(quality: ReviewQuality) {
    if (!current) return
    const reviewedAt = Date.now()
    const result = applyReview({
      state: {
        state: current.state,
        stepIndex: current.stepIndex,
        easeFactor: current.easeFactor,
        interval: current.interval,
        repetitions: current.repetitions,
        lapses: current.lapses,
        dueAt: current.dueAt,
        lastReviewedAt: current.lastReviewedAt,
      },
      quality,
      reviewedAt,
      seed: `${current.id}:${reviewedAt}`,
    })

    await appendReviewLog({
      cardId: current.id,
      reviewedAt,
      quality,
      elapsedDays: result.elapsedDays,
      scheduledDays: result.scheduledDays,
      durationMs: reviewedAt - startedAt,
      intervalAfter: result.state.interval,
      easeAfter: result.state.easeFactor,
    })

    await updateCard(current.id, {
      state: result.state.state,
      stepIndex: result.state.stepIndex,
      easeFactor: result.state.easeFactor,
      interval: result.state.interval,
      repetitions: result.state.repetitions,
      lapses: result.state.lapses,
      dueAt: result.state.dueAt,
      lastReviewedAt: result.state.lastReviewedAt,
    })

    setIndex((i) => i + 1)
  }

  if (!queue) return <div className="glass h-64 animate-pulse" />

  if (queue.length === 0) {
    return (
      <GlassCard padding="lg" className="text-center">
        <p className="text-(--text-muted)">今日の復習はありません。</p>
      </GlassCard>
    )
  }

  if (!current) {
    return (
      <GlassCard padding="lg" className="mx-auto max-w-md text-center">
        <p>今日はここまで。</p>
        {deferred > 0 && (
          <p className="mt-2 text-sm text-(--text-muted)">残り {deferred} 枚は明日以降に持ち越します。</p>
        )}
        <div className="mt-4">
          <Link to="/">
            <GlassButton>ホームに戻る</GlassButton>
          </Link>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-8 pt-8">
      <p className="text-sm text-(--text-muted)">
        {index + 1} / {queue.length} ・ {bookTitle}
      </p>

      <GlassCard
        padding="lg"
        className="min-h-[220px] w-full cursor-pointer"
        onClick={() => !revealed && setRevealed(true)}
      >
        <p className="text-center text-lg font-medium">{current.front}</p>
        {revealed && (
          <div className="mt-6 border-t border-(--glass-stroke) pt-6 text-center transition-opacity duration-300">
            <p className="whitespace-pre-wrap text-(--text-primary)">{current.back}</p>
          </div>
        )}
      </GlassCard>

      {!revealed ? (
        <GlassButton onClick={() => setRevealed(true)}>思い出す（スペース）</GlassButton>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {GRADES.map((g, i) => (
            <GlassButton key={g.quality} variant={g.variant} onClick={() => handleGrade(g.quality)}>
              {g.label} <span className="text-xs opacity-50">{i + 1}</span>
            </GlassButton>
          ))}
        </div>
      )}
    </div>
  )
}
