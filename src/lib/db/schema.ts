import Dexie, { type EntityTable } from 'dexie'

export type BookStatus = 'want' | 'reading' | 'finished' | 'paused'
export type NoteType = 'quote' | 'thought' | 'question' | 'summary'
export type CardType = 'qa' | 'cloze' | 'concept'
export type CardState = 'learning' | 'review' | 'suspended'
export type ReviewQuality = 1 | 3 | 4 | 5

/** 同期の対象となる全テーブルが持つ共通フィールド。docs/DESIGN.md §4 参照。 */
export interface Syncable {
  id: string
  updatedAt: number
  deletedAt: number | null
  syncedAt: number | null
}

export interface Book extends Syncable {
  title: string
  authors: string[]
  isbn13?: string
  publisher?: string
  publishedAt?: string
  coverUrl?: string
  status: BookStatus
  rating?: number
  startedAt?: number
  finishedAt?: number
  totalPages?: number
  currentPage?: number
  summary?: string
  tagIds: string[]
  createdAt: number
}

export interface Note extends Syncable {
  bookId: string
  type: NoteType
  body: string
  page?: number
  chapter?: string
  tagIds: string[]
  distilled: boolean
  createdAt: number
}

export interface InsightCard extends Syncable {
  bookId: string
  sourceNoteIds: string[]
  front: string
  back: string
  cardType: CardType
  tagIds: string[]
  state: CardState
  stepIndex: number
  easeFactor: number
  interval: number
  repetitions: number
  lapses: number
  dueAt: number
  lastReviewedAt: number | null
  createdAt: number
}

export interface ReviewLog {
  id: string
  cardId: string
  reviewedAt: number
  quality: ReviewQuality
  elapsedDays: number
  scheduledDays: number
  durationMs: number
  intervalAfter: number
  easeAfter: number
}

export interface Tag extends Syncable {
  name: string
  color: string
  createdAt: number
}

export interface Settings {
  id: 'singleton'
  dailyNewLimit: number
  dailyReviewLimit: number
  theme: 'light' | 'dark' | 'system'
  learningStepsMinutes: number[]
  lastBackupAt: number | null
}

class ReadingStudyDB extends Dexie {
  books!: EntityTable<Book, 'id'>
  notes!: EntityTable<Note, 'id'>
  cards!: EntityTable<InsightCard, 'id'>
  reviewLogs!: EntityTable<ReviewLog, 'id'>
  tags!: EntityTable<Tag, 'id'>
  settings!: EntityTable<Settings, 'id'>

  constructor() {
    // DB 名は固有名にする — GitHub Pages のオリジンは同アカウントの
    // 他の Pages プロジェクトと共有されるため（DESIGN.md §11）。
    super('readingstudyapp')

    this.version(1).stores({
      books: 'id, status, updatedAt, deletedAt',
      notes: 'id, bookId, updatedAt, deletedAt',
      cards: 'id, bookId, state, dueAt, updatedAt, deletedAt',
      reviewLogs: 'id, cardId, reviewedAt',
      tags: 'id, name, updatedAt, deletedAt',
      settings: 'id',
    })
  }
}

export const db = new ReadingStudyDB()

export const DEFAULT_SETTINGS: Settings = {
  id: 'singleton',
  dailyNewLimit: 10,
  dailyReviewLimit: 60,
  theme: 'dark',
  learningStepsMinutes: [10, 1440, 4320], // 10分後 → 翌日 → 3日後
  lastBackupAt: null,
}
