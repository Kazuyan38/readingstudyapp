import MiniSearch from 'minisearch'
import { listBooks, listNotesByBook } from '../db/repository'
import { tokenizeJapanese } from './tokenizer'
import { db } from '../db/schema'

export interface SearchDoc {
  id: string
  kind: 'book' | 'note'
  bookId: string
  bookTitle: string
  title: string
  body: string
}

export async function buildSearchIndex(): Promise<MiniSearch<SearchDoc>> {
  const mini = new MiniSearch<SearchDoc>({
    fields: ['title', 'body'],
    storeFields: ['kind', 'bookId', 'bookTitle', 'title', 'body'],
    tokenize: tokenizeJapanese,
    searchOptions: { prefix: true, fuzzy: 0.1 },
  })

  const books = await listBooks()
  const docs: SearchDoc[] = []

  for (const book of books) {
    docs.push({
      id: `book:${book.id}`,
      kind: 'book',
      bookId: book.id,
      bookTitle: book.title,
      title: book.title,
      body: `${book.authors.join(' ')} ${book.summary ?? ''}`,
    })
    const notes = await listNotesByBook(book.id)
    for (const note of notes) {
      docs.push({
        id: `note:${note.id}`,
        kind: 'note',
        bookId: book.id,
        bookTitle: book.title,
        title: book.title,
        body: note.body,
      })
    }
  }

  // カードの前面・裏面も検索対象に含める
  const cards = await db.cards.toArray()
  for (const card of cards.filter((c) => !c.deletedAt)) {
    const book = books.find((b) => b.id === card.bookId)
    docs.push({
      id: `card:${card.id}`,
      kind: 'note',
      bookId: card.bookId,
      bookTitle: book?.title ?? '',
      title: card.front,
      body: card.back,
    })
  }

  mini.addAll(docs)
  return mini
}
