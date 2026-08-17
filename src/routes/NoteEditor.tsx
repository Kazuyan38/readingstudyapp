import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'
import { TextAreaField, TextField } from '../components/ui/Field'
import { getBook, createNote } from '../lib/db/repository'
import type { Book, NoteType } from '../lib/db/schema'

const TYPE_LABEL: Record<NoteType, string> = {
  quote: '引用',
  thought: '感想',
  question: '疑問',
  summary: '要約',
}

export function NoteEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [type, setType] = useState<NoteType>('thought')
  const [body, setBody] = useState('')
  const [page, setPage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    getBook(id).then((b) => setBook(b ?? null))
  }, [id])

  async function handleSave() {
    if (!id || !body.trim()) return
    setSaving(true)
    await createNote({
      bookId: id,
      type,
      body: body.trim(),
      page: page ? Number(page) : undefined,
      tagIds: [],
    })
    setSaving(false)
    navigate(`/books/${id}`)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <p className="text-(--text-muted)">{book?.title ?? '...'}</p>
      <GlassCard padding="lg">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TYPE_LABEL) as NoteType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
                  type === t ? 'glass' : 'text-(--text-muted) hover:text-(--text-primary)'
                }`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <TextAreaField
            label="本文"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            autoFocus
            placeholder="思ったこと、引用、疑問……そのまま書く"
          />
          <TextField label="ページ（任意）" value={page} onChange={(e) => setPage(e.target.value)} inputMode="numeric" />
          <div className="flex justify-end">
            <GlassButton variant="primary" onClick={handleSave} disabled={saving || !body.trim()}>
              {saving ? '保存中…' : '保存する'}
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
