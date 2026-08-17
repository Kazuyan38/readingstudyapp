import type { Book } from '../../lib/db/schema'

/** タイトルから決定的にグラデーションを生成する（表紙が取れない時のフォールバック）。 */
function gradientFor(title: string): string {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0
  const hue1 = Math.abs(h) % 360
  const hue2 = (hue1 + 45) % 360
  return `linear-gradient(160deg, hsl(${hue1} 55% 30%), hsl(${hue2} 45% 18%))`
}

export function BookCover({ book, className = '' }: { book: Book; className?: string }) {
  if (book.coverUrl) {
    return (
      <img
        src={book.coverUrl}
        alt={book.title}
        loading="lazy"
        className={`aspect-[2/3] w-full rounded-lg object-cover shadow-lg ${className}`}
      />
    )
  }
  return (
    <div
      className={`flex aspect-[2/3] w-full items-center justify-center rounded-lg p-3 text-center shadow-lg ${className}`}
      style={{ background: gradientFor(book.title) }}
    >
      <span className="font-serif text-sm leading-snug text-white/90">{book.title}</span>
    </div>
  )
}
