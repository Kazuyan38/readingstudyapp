import { db } from '../db/schema'

export async function exportAllData(): Promise<Blob> {
  const [books, notes, cards, reviewLogs, tags, settings] = await Promise.all([
    db.books.toArray(),
    db.notes.toArray(),
    db.cards.toArray(),
    db.reviewLogs.toArray(),
    db.tags.toArray(),
    db.settings.toArray(),
  ])
  const payload = {
    exportedAt: Date.now(),
    version: 1,
    books,
    notes,
    cards,
    reviewLogs,
    tags,
    settings,
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
