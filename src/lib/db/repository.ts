import { db, DEFAULT_SETTINGS, type Book, type Note, type InsightCard, type ReviewLog, type Tag, type Settings } from './schema'
import { newId } from '../utils/id'

/**
 * UI が触る唯一の永続化 API（docs/DESIGN.md §5.1）。
 * Dexie を直接 import してよいのはこのファイルだけ。
 * 将来サーバー同期を差し替えても、ここより上のレイヤーは無変更でよい設計にする。
 */

function now() {
  return Date.now()
}

// ---- Books ----

export async function listBooks(): Promise<Book[]> {
  const rows = await db.books.toArray()
  return rows.filter((b) => !b.deletedAt).sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getBook(id: string): Promise<Book | undefined> {
  const b = await db.books.get(id)
  return b && !b.deletedAt ? b : undefined
}

export async function createBook(
  input: Omit<Book, 'id' | 'updatedAt' | 'deletedAt' | 'syncedAt' | 'createdAt'>
): Promise<Book> {
  const t = now()
  const book: Book = {
    ...input,
    id: newId(),
    createdAt: t,
    updatedAt: t,
    deletedAt: null,
    syncedAt: null,
  }
  await db.books.add(book)
  return book
}

export async function updateBook(id: string, patch: Partial<Book>): Promise<void> {
  await db.books.update(id, { ...patch, updatedAt: now() })
}

export async function deleteBook(id: string): Promise<void> {
  await db.books.update(id, { deletedAt: now(), updatedAt: now() })
}

// ---- Notes ----

export async function listNotesByBook(bookId: string): Promise<Note[]> {
  const rows = await db.notes.where('bookId').equals(bookId).toArray()
  return rows.filter((n) => !n.deletedAt).sort((a, b) => b.createdAt - a.createdAt)
}

export async function listUndistilledNotes(): Promise<Note[]> {
  const rows = await db.notes.toArray()
  return rows.filter((n) => !n.deletedAt && !n.distilled).sort((a, b) => a.createdAt - b.createdAt)
}

export async function createNote(
  input: Omit<Note, 'id' | 'updatedAt' | 'deletedAt' | 'syncedAt' | 'createdAt' | 'distilled'>
): Promise<Note> {
  const t = now()
  const note: Note = {
    ...input,
    id: newId(),
    distilled: false,
    createdAt: t,
    updatedAt: t,
    deletedAt: null,
    syncedAt: null,
  }
  await db.notes.add(note)
  return note
}

export async function updateNote(id: string, patch: Partial<Note>): Promise<void> {
  await db.notes.update(id, { ...patch, updatedAt: now() })
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.update(id, { deletedAt: now(), updatedAt: now() })
}

export async function markNoteDistilled(id: string): Promise<void> {
  await db.notes.update(id, { distilled: true, updatedAt: now() })
}

// ---- Cards ----

export async function listCardsByBook(bookId: string): Promise<InsightCard[]> {
  const rows = await db.cards.where('bookId').equals(bookId).toArray()
  return rows.filter((c) => !c.deletedAt)
}

export async function listDueCards(before: number): Promise<InsightCard[]> {
  const rows = await db.cards.toArray()
  return rows
    .filter((c) => !c.deletedAt && c.state !== 'suspended' && c.dueAt <= before)
    .sort((a, b) => a.dueAt - b.dueAt)
}

export async function getCard(id: string): Promise<InsightCard | undefined> {
  const c = await db.cards.get(id)
  return c && !c.deletedAt ? c : undefined
}

export async function createCard(
  input: Omit<
    InsightCard,
    'id' | 'updatedAt' | 'deletedAt' | 'syncedAt' | 'createdAt' | 'state' | 'stepIndex' | 'easeFactor' | 'interval' | 'repetitions' | 'lapses' | 'dueAt' | 'lastReviewedAt'
  >
): Promise<InsightCard> {
  const t = now()
  const card: InsightCard = {
    ...input,
    id: newId(),
    state: 'learning',
    stepIndex: 0,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: t,
    lastReviewedAt: null,
    createdAt: t,
    updatedAt: t,
    deletedAt: null,
    syncedAt: null,
  }
  await db.cards.add(card)
  return card
}

export async function updateCard(id: string, patch: Partial<InsightCard>): Promise<void> {
  await db.cards.update(id, { ...patch, updatedAt: now() })
}

export async function deleteCard(id: string): Promise<void> {
  await db.cards.update(id, { deletedAt: now(), updatedAt: now() })
}

// ---- Review logs (append-only) ----

export async function appendReviewLog(input: Omit<ReviewLog, 'id'>): Promise<ReviewLog> {
  const log: ReviewLog = { ...input, id: newId() }
  await db.reviewLogs.add(log)
  return log
}

export async function listReviewLogsByCard(cardId: string): Promise<ReviewLog[]> {
  const rows = await db.reviewLogs.where('cardId').equals(cardId).toArray()
  return rows.sort((a, b) => a.reviewedAt - b.reviewedAt)
}

export async function listAllReviewLogs(): Promise<ReviewLog[]> {
  return db.reviewLogs.toArray()
}

// ---- Tags ----

export async function listTags(): Promise<Tag[]> {
  const rows = await db.tags.toArray()
  return rows.filter((t) => !t.deletedAt)
}

export async function createTag(name: string, color: string): Promise<Tag> {
  const t = now()
  const tag: Tag = { id: newId(), name, color, createdAt: t, updatedAt: t, deletedAt: null, syncedAt: null }
  await db.tags.add(tag)
  return tag
}

// ---- Settings ----

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('singleton')
  if (s) return s
  await db.settings.add(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch })
}
