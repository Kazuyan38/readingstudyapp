import { useEffect, useState } from 'react'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'
import { TextField } from '../components/ui/Field'
import { BookGrid } from '../components/book/BookGrid'
import { listBooks, createBook } from '../lib/db/repository'
import { lookupByIsbn } from '../lib/metadata/isbn'
import type { Book, BookStatus } from '../lib/db/schema'

const STATUS_LABEL: Record<BookStatus, string> = {
  want: '積読',
  reading: '読書中',
  finished: '読了',
  paused: '中断',
}

export function Library() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<BookStatus | 'all'>('all')

  async function refresh() {
    setBooks(await listBooks())
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = filter === 'all' ? books : books.filter((b) => b.status === filter)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'want', 'reading', 'finished', 'paused'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
                filter === s ? 'glass' : 'text-(--text-muted) hover:text-(--text-primary)'
              }`}
            >
              {s === 'all' ? 'すべて' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <GlassButton variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '閉じる' : '本を登録'}
        </GlassButton>
      </div>

      {showForm && (
        <AddBookForm
          onCreated={() => {
            setShowForm(false)
            refresh()
          }}
        />
      )}

      {loading ? <div className="glass h-40 animate-pulse" /> : <BookGrid books={filtered} />}
    </div>
  )
}

function AddBookForm({ onCreated }: { onCreated: () => void }) {
  const [isbn, setIsbn] = useState('')
  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState('')
  const [publisher, setPublisher] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [looking, setLooking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  async function handleLookup() {
    if (!isbn.trim()) return
    setLooking(true)
    setNotFound(false)
    const result = await lookupByIsbn(isbn, {
      rakutenApplicationId: import.meta.env.VITE_RAKUTEN_APP_ID,
      googleBooksApiKey: import.meta.env.VITE_GOOGLE_BOOKS_API_KEY,
    })
    if (result) {
      setTitle(result.title)
      setAuthors(result.authors.join('、'))
      setPublisher(result.publisher ?? '')
      setCoverUrl(result.coverUrl ?? '')
    } else {
      setNotFound(true)
    }
    setLooking(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await createBook({
      title: title.trim(),
      authors: authors.split(/[、,]/).map((a) => a.trim()).filter(Boolean),
      isbn13: isbn.trim() || undefined,
      publisher: publisher.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      status: 'want',
      tagIds: [],
    })
    setSaving(false)
    onCreated()
  }

  return (
    <GlassCard padding="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <TextField
              label="ISBN"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="9784XXXXXXXXX"
            />
          </div>
          <GlassButton type="button" onClick={handleLookup} disabled={looking || !isbn.trim()}>
            {looking ? '検索中…' : 'ISBN から検索'}
          </GlassButton>
        </div>
        {notFound && <p className="text-sm text-(--text-muted)">見つかりませんでした。手入力してください。</p>}

        <TextField label="タイトル" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <TextField label="著者（読点区切り）" value={authors} onChange={(e) => setAuthors(e.target.value)} />
        <TextField label="出版社" value={publisher} onChange={(e) => setPublisher(e.target.value)} />

        <div className="flex justify-end">
          <GlassButton type="submit" variant="primary" disabled={saving || !title.trim()}>
            {saving ? '保存中…' : '登録する'}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  )
}
