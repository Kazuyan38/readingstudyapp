import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'
import { BookCover } from '../components/book/BookCover'
import { getBook, listNotesByBook, listCardsByBook, updateBook } from '../lib/db/repository'
import type { Book, BookStatus, Note, InsightCard } from '../lib/db/schema'

const STATUS_LABEL: Record<BookStatus, string> = {
  want: '積読',
  reading: '読書中',
  finished: '読了',
  paused: '中断',
}

export function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [cards, setCards] = useState<InsightCard[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    if (!id) return
    const [b, n, c] = await Promise.all([getBook(id), listNotesByBook(id), listCardsByBook(id)])
    setBook(b ?? null)
    setNotes(n)
    setCards(c)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <div className="glass h-64 animate-pulse" />
  if (!book) return <p className="text-(--text-muted)">本が見つかりませんでした。</p>

  async function setStatus(status: BookStatus) {
    if (!id) return
    await updateBook(id, { status })
    refresh()
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="w-40 shrink-0">
          <BookCover book={book} />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <h1 className="text-2xl">{book.title}</h1>
          {book.authors.length > 0 && <p className="text-(--text-muted)">{book.authors.join('、')}</p>}
          {book.publisher && <p className="text-sm text-(--text-muted)">{book.publisher}</p>}
          <div className="flex flex-wrap gap-1.5">
            {(['want', 'reading', 'finished', 'paused'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
                  book.status === s ? 'glass' : 'text-(--text-muted) hover:text-(--text-primary)'
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <div>
            <Link to={`/books/${book.id}/note`}>
              <GlassButton variant="primary">メモを書く</GlassButton>
            </Link>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg">メモ（{notes.length}）</h2>
        {notes.length === 0 ? (
          <p className="text-sm text-(--text-muted)">まだメモがありません。</p>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map((note) => (
              <GlassCard key={note.id} padding="sm">
                <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                <p className="mt-2 text-xs text-(--text-muted)">
                  {note.distilled ? '蒸留済み' : '未蒸留'}
                  {note.page ? ` ・ p.${note.page}` : ''}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg">要点カード（{cards.length}）</h2>
        {cards.length === 0 ? (
          <p className="text-sm text-(--text-muted)">
            まだカードがありません。<Link to="/distill" className="underline">蒸留</Link>からメモをカードにできます。
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <GlassCard key={card.id} padding="sm">
                <p className="text-sm font-medium">{card.front}</p>
                <p className="mt-1 text-xs text-(--text-muted)">次回: {new Date(card.dueAt).toLocaleDateString('ja-JP')}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
