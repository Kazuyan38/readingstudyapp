import { useEffect, useState } from 'react'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'
import { TextAreaField, TextField } from '../components/ui/Field'
import { listUndistilledNotes, markNoteDistilled, createCard, getBook } from '../lib/db/repository'
import type { Note } from '../lib/db/schema'

export function Distill() {
  const [notes, setNotes] = useState<Note[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bookTitle, setBookTitle] = useState('')
  const [makingCard, setMakingCard] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  async function refresh() {
    const all = await listUndistilledNotes()
    setNotes(all)
    setIndex(0)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const current = notes[index]

  useEffect(() => {
    if (!current) return
    getBook(current.bookId).then((b) => setBookTitle(b?.title ?? ''))
    setBack(current.body)
    setFront('')
    setMakingCard(false)
  }, [current])

  function advance() {
    setIndex((i) => i + 1)
  }

  async function handleSkip() {
    advance()
  }

  async function handleNeverCard() {
    if (!current) return
    await markNoteDistilled(current.id)
    setNotes((prev) => prev.filter((n) => n.id !== current.id))
  }

  async function handleCreateCard() {
    if (!current || !front.trim() || !back.trim()) return
    await createCard({
      bookId: current.bookId,
      sourceNoteIds: [current.id],
      front: front.trim(),
      back: back.trim(),
      cardType: 'qa',
      tagIds: [],
    })
    await markNoteDistilled(current.id)
    setNotes((prev) => prev.filter((n) => n.id !== current.id))
  }

  if (loading) return <div className="glass h-64 animate-pulse" />

  if (notes.length === 0) {
    return (
      <GlassCard padding="lg" className="text-center">
        <p className="text-(--text-muted)">未蒸留のメモはありません。すべて処理済みです。</p>
      </GlassCard>
    )
  }

  if (!current) {
    return (
      <GlassCard padding="lg" className="text-center">
        <p className="text-(--text-muted)">今日の蒸留が完了しました。</p>
      </GlassCard>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <p className="text-center text-sm text-(--text-muted)">
        {index + 1} / {notes.length} ・ {bookTitle}
      </p>
      <GlassCard padding="lg">
        <p className="whitespace-pre-wrap">{current.body}</p>
      </GlassCard>

      {!makingCard ? (
        <div className="flex flex-wrap justify-center gap-2">
          <GlassButton variant="primary" onClick={() => setMakingCard(true)}>
            カードにする
          </GlassButton>
          <GlassButton onClick={handleSkip}>今はしない</GlassButton>
          <GlassButton variant="ghost" onClick={handleNeverCard}>
            カード化しない
          </GlassButton>
        </div>
      ) : (
        <GlassCard padding="lg">
          <div className="flex flex-col gap-4">
            <TextField
              label="問い（front）"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="想起のきっかけになる問いを書く"
              autoFocus
            />
            <TextAreaField label="要点（back）" value={back} onChange={(e) => setBack(e.target.value)} rows={4} />
            <div className="flex justify-end gap-2">
              <GlassButton onClick={() => setMakingCard(false)}>戻る</GlassButton>
              <GlassButton variant="primary" onClick={handleCreateCard} disabled={!front.trim() || !back.trim()}>
                カードを作成
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
