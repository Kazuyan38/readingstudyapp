import { Link } from 'react-router-dom'
import type { Book } from '../../lib/db/schema'
import { BookCover } from './BookCover'

export function BookGrid({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return <p className="text-(--text-muted)">まだ本が登録されていません。</p>
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {books.map((book) => (
        <Link key={book.id} to={`/books/${book.id}`} className="group">
          <BookCover book={book} className="transition-transform duration-300 group-hover:-translate-y-1" />
          <p className="mt-2 line-clamp-2 text-sm text-(--text-primary)">{book.title}</p>
        </Link>
      ))}
    </div>
  )
}
