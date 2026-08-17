import { db } from '../db/schema'

interface ExportPayload {
  version: number
  books: unknown[]
  notes: unknown[]
  cards: unknown[]
  reviewLogs: unknown[]
  tags: unknown[]
  settings: unknown[]
}

/** JSON エクスポートからの復元。既存データは全て置き換える。 */
export async function importAllData(file: File): Promise<void> {
  const text = await file.text()
  const payload = JSON.parse(text) as ExportPayload
  if (payload.version !== 1) throw new Error('未対応のバックアップ形式です')

  await db.transaction('rw', [db.books, db.notes, db.cards, db.reviewLogs, db.tags, db.settings], async () => {
    await Promise.all([
      db.books.clear(),
      db.notes.clear(),
      db.cards.clear(),
      db.reviewLogs.clear(),
      db.tags.clear(),
      db.settings.clear(),
    ])
    await Promise.all([
      db.books.bulkAdd(payload.books as Parameters<typeof db.books.bulkAdd>[0]),
      db.notes.bulkAdd(payload.notes as Parameters<typeof db.notes.bulkAdd>[0]),
      db.cards.bulkAdd(payload.cards as Parameters<typeof db.cards.bulkAdd>[0]),
      db.reviewLogs.bulkAdd(payload.reviewLogs as Parameters<typeof db.reviewLogs.bulkAdd>[0]),
      db.tags.bulkAdd(payload.tags as Parameters<typeof db.tags.bulkAdd>[0]),
      db.settings.bulkAdd(payload.settings as Parameters<typeof db.settings.bulkAdd>[0]),
    ])
  })
}
