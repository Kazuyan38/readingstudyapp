import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type MiniSearch from 'minisearch'
import { GlassCard } from '../components/ui/GlassCard'
import { buildSearchIndex, type SearchDoc } from '../lib/search'

export function Search() {
  const [index, setIndex] = useState<MiniSearch<SearchDoc> | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    buildSearchIndex().then(setIndex)
  }, [])

  const results = useMemo(() => {
    if (!index || !query.trim()) return []
    return index.search(query).slice(0, 30) as unknown as (SearchDoc & { score: number })[]
  }, [index, query])

  return (
    <div className="flex flex-col gap-6">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="本・メモ・カードを検索"
        className="glass w-full rounded-2xl px-4 py-3 text-lg outline-none"
      />
      {!index ? (
        <div className="glass h-24 animate-pulse" />
      ) : query.trim() && results.length === 0 ? (
        <p className="text-sm text-(--text-muted)">見つかりませんでした。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((r) => (
            <Link key={r.id} to={`/books/${r.bookId}`}>
              <GlassCard padding="sm" className="transition-transform hover:-translate-y-0.5">
                <p className="text-xs text-(--text-muted)">{r.bookTitle}</p>
                <p className="mt-1 line-clamp-2 text-sm">{r.body || r.title}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
